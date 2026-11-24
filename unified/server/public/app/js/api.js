/* Morabbi Unified — online layer over the v23 offline app.
   Loads BEFORE the main script. Exposes window.API.
   Strategy: local-first (v23 localStorage stays the truth),
   push mutations to the server, queue failures in IndexedDB,
   pull server data on a timer and merge by `sid` (server id). */
(function () {
  'use strict';
  var DB_KEY = 'morabbi_db_v23';
  var TOKEN_KEY = 'morabbi_api_token';
  var QUEUE_DB = 'morabbi_sync_queue';
  var QUEUE_STORE = 'queue';

  function readDb() {
    try { return JSON.parse(localStorage.getItem(DB_KEY) || 'null'); } catch (e) { return null; }
  }
  function writeDb(d) { localStorage.setItem(DB_KEY, JSON.stringify(d)); }

  function base() {
    try {
      var d = readDb();
      if (d && d.settings && d.settings.serverUrl) {
        return String(d.settings.serverUrl).replace(/\/+$/, '');
      }
    } catch (e) {}
    return location.origin;
  }

  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t) { try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch (e) {} }
  function hasToken() { return !!getToken(); }

  function req(method, path, body) {
    var opts = { method: method, headers: { 'Content-Type': 'application/json' } };
    var t = getToken();
    if (t) opts.headers['x-user-id'] = t;
    if (body !== undefined) opts.body = JSON.stringify(body);
    return fetch(base() + path, opts).then(function (res) {
      if (res.status === 401) { setToken(''); throw new Error('UNAUTHORIZED'); }
      return res.json().catch(function () { return {}; }).then(function (data) {
        if (!res.ok) { var m = (data && data.error) || ('HTTP ' + res.status); throw new Error(m); }
        return data;
      });
    });
  }

  /* ---------- IndexedDB queue ---------- */
  function idbOpen() {
    return new Promise(function (resolve, reject) {
      var r = indexedDB.open(QUEUE_DB, 1);
      r.onupgradeneeded = function () {
        var db = r.result;
        if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: 'qid' });
      };
      r.onsuccess = function () { resolve(r.result); };
      r.onerror = function () { reject(r.error); };
    });
  }
  function idbTx(mode, fn) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(QUEUE_STORE, mode);
        var st = tx.objectStore(QUEUE_STORE);
        var out;
        try { out = fn(st); } catch (e) { db.close(); reject(e); return; }
        tx.oncomplete = function () {
          db.close();
          if (out && typeof out.then === 'function') { out.then(resolve, reject); }
          else if (out && 'result' in out) { resolve(out.result); }
          else { resolve(out); }
        };
        tx.onerror = function () { db.close(); reject(tx.error); };
      });
    });
  }
  function queueAdd(item) {
    return idbTx('readwrite', function (st) { var rq = st.put(item); rq.onsuccess = null; });
  }
  function queueAll() {
    return idbTx('readonly', function (st) {
      var rq = st.getAll();
      return new Promise(function (res) { rq.onsuccess = function () { res(rq.result || []); }; });
    });
  }
  function queueDel(qid) { return idbTx('readwrite', function (st) { st.delete(qid); }); }

  /* ---------- field mappers: v23 local -> server payload ---------- */
  function localUserByPhone(phone) {
    var d = readDb(); if (!d) return null;
    for (var i = 0; i < (d.users || []).length; i++) if (d.users[i].phone === phone) return d.users[i];
    return null;
  }
  function serverBranchIdOf(user) { return (user && user.serverBranchId) || null; }

  var MAP_STATUS = { DRAFT: 'DRAFT', SUBMITTED: 'SUBMITTED', APPROVED: 'APPROVED', REJECTED: 'RETURNED' };
  var INV_STATUS = { DRAFT: 'DRAFT', SUBMITTED: 'SUBMITTED', UNDER_REVIEW: 'SUBMITTED', APPROVED: 'APPROVED', RETURNED: 'REJECTED' };
  function mapOut(s) { return MAP_STATUS[s] || 'DRAFT'; }
  function mapIn(s) { return INV_STATUS[s] || 'DRAFT'; }

  function faDate(iso) {
    try { var dt = new Date(iso); if (isNaN(dt.getTime())) return ''; return dt.toLocaleDateString('fa-IR'); } catch (e) { return ''; }
  }
  function wrapList(x) {
    if (!x) return '[]';
    if (typeof x === 'string') { x = x.split(/\n|،|,/).map(function (s) { return s.trim(); }).filter(Boolean); if (!x.length) return '[]'; }
    if (!Array.isArray(x)) x = [x];
    return JSON.stringify(x);
  }

  var PAYLOADS = {
    report: function (r) {
      return {
        instructorId: r.uid ? (function () { var d = readDb(), u = null; for (var i = 0; i < d.users.length; i++) if (d.users[i].id === r.uid) { u = d.users[i]; break; } return u ? u.serverId || '' : ''; })() : '',
        branchId: (function () { var d = readDb(), u = null; for (var i = 0; i < (d.users || []).length; i++) if (d.users[i].id === r.uid) { u = d.users[i]; break; } return u ? u.serverBranchId || null : null; })(),
        subject: r.subject || '',
        content: r.content || '',
        date: r.date ? new Date(r.date).toISOString() : new Date().toISOString(),
        attendeesCount: r.count | 0,
        stagePresentation: r.s1 || null, stageThinking: r.s2 || null,
        stageDiscussion: r.s3 || null, stageReporting: r.s4 || null,
        groupEndurance: r.g1 || null, groupSemiSpeed: r.g2 || null, groupSpeed: r.g3 || null,
        evaluationSelf: r.ev || null,
        status: mapOut(r.status || 'DRAFT'),
        quranRefs: '[]', hadithRefs: '[]'
      };
    },
    lesson: function (l) {
      return {
        instructorId: (function () { var d = readDb(), u = null; for (var i = 0; i < (d.users || []).length; i++) if (d.users[i].id === l.uid) { u = d.users[i]; break; } return u ? u.serverId || '' : ''; })(),
        branchId: (function () { var d = readDb(), u = null; for (var i = 0; i < (d.users || []).length; i++) if (d.users[i].id === l.uid) { u = d.users[i]; break; } return u ? u.serverBranchId || null : null; })(),
        title: l.title || '', subject: l.subject || '', grade: l.grade || null,
        sessionCount: 1, traineeCount: l.count | 0,
        generalObjective: l.goal || null,
        objectives: l.subgoals ? JSON.stringify(String(l.subgoals).split('\n').map(function (s) { return s.trim(); }).filter(Boolean)) : '[]',
        introductionPhase: l.p1 || null, presentationPhase: l.p2 || null,
        summaryPhase: l.p3 || null, evaluationPhase: l.p4 || null,
        teachingAids: l.tools || null, supplementaryActivities: l.hw || null,
        sources: l.refs ? wrapList(l.refs) : '[]',
        quranRefs: l.quran ? wrapList(l.quran) : '[]', hadithRefs: l.hadith ? wrapList(l.hadith) : '[]',
        status: mapOut(l.status || 'DRAFT')
      };
    },
    person: function (p) {
      var u = (function () { try { var s = JSON.parse(localStorage.getItem('morabbi_session_v23') || 'null'); return s; } catch (e) { return null; } })();
      return {
        branchId: u ? u.serverBranchId || null : null,
        name: p.name || '', nationalId: p.code || null, age: p.age ? parseInt(p.age, 10) : null,
        phone: p.phone || null, grade: p.grade || null, group: p.group || '',
        joinDate: p.joinDate || null, note: p.note || null
      };
    },
    attendance: function (a) { return a; }, /* {personId:sid, date, status} */
    session: function (s) {
      return { title: s.title || s.name || '', date: s.date ? new Date(s.date).toISOString() : new Date().toISOString(),
        attendees: s.attendees || 0, place: s.place || null, agenda: s.agenda || null,
        decisions: s.decisions || null, followup: s.followup || null, note: s.note || null };
    },
    task: function (t) { return { text: t.text || '', priority: t.priority || 'MED', due: t.due || null }; },
    taskPatch: function (t) { return { text: t.text || '', priority: t.priority || 'MED', due: t.due || null, done: !!t.done }; },
    tracker: function (t) {
      return {
        date: t.date,
        salatFajr: !!t.salat_fajr, salatZuhr: !!t.salat_zuhr, salatAsr: !!t.salat_asr,
        salatMagrib: !!t.salat_magrib, salatIsha: !!t.salat_isha, quran: !!t.quran,
        dhikrMorning: !!t.dhikr_morning, dhikrEvening: !!t.dhikr_evening,
        fasting: !!t.fasting, study: !!t.study
      };
    },
    evaluation: function (e) { return e; }, /* {targetType, targetId, scores, note} */
    reportStatus: function (x) { return x; },
    lessonStatus: function (x) { return x; }
  };

  var ENDPOINTS = {
    report: ['POST', '/api/reports'],
    lesson: ['POST', '/api/lesson-plans'],
    person: ['POST', '/api/people'],
    attendance: ['POST', '/api/attendance'],
    session: ['POST', '/api/sessions'],
    task: ['POST', '/api/tasks'],
    tracker: ['POST', '/api/tracker'],
    evaluation: ['POST', '/api/evaluations'],
    reportStatus: ['POST', '/api/reports/status'],
    lessonStatus: ['POST', '/api/lesson-plans/status']
  };

  /* server responses are wrapped: {report}, {lessonPlan}, {person}, {session}, {task}, {record}, {item}, {evaluation}, {userId}, or bare {id} */
  function extractId(res) {
    if (!res) return null;
    if (res.id) return res.id;
    var keys = ['report', 'lessonPlan', 'person', 'session', 'task', 'record', 'item', 'evaluation'];
    for (var i = 0; i < keys.length; i++) { if (res[keys[i]] && res[keys[i]].id) return res[keys[i]].id; }
    if (res.userId) return res.userId;
    return null;
  }

  /* after a successful create, map server id -> local sid */
  function applySid(kind, localId, serverId) {
    if (!localId || !serverId) return;
    var d = readDb(); if (!d) return;
    var coll = { report: 'reports', lesson: 'lessons', person: 'people', session: 'sessions', task: 'tasks' }[kind];
    if (!coll || !d[coll]) return;
    for (var i = 0; i < d[coll].length; i++) {
      if (d[coll][i].id === localId) { d[coll][i].sid = serverId; break; }
    }
    writeDb(d);
  }

  function sendOne(item) {
    var ep = ENDPOINTS[item.kind];
    if (!ep) return Promise.resolve();
    var p = item.payload || {};
    if (p._localId) { p._localId = p._localId; }
    return req(ep[0], ep[1], p).then(function (res) {
      queueDel(item.qid);
      var sid = extractId(res);
      var localId = (item.payload && item.payload._localId) || item.localId;
      applySid(item.kind, localId, sid);
    }).catch(function (err) {
      if (err && err.message === 'UNAUTHORIZED') return queueDel(item.qid); /* token dead; drop stale writes */
      if (err && /UNIQUE|P1002/i.test(err.message)) return queueDel(item.qid); /* duplicate: fine */
      return Promise.reject(err);
    });
  }

  /* ---------- public API ---------- */
  var API = {
    base: base,
    getToken: getToken,
    isOnline: function () { return navigator.onLine && base(); },

    login: function (phone, code) {
      return req('POST', '/api/auth', { phone: phone, password: code }).then(function (res) {
        setToken(res.token || '');
        var u = res.user || {};
        var local = localUserByPhone(phone);
        var d = readDb();
        if (d) {
        if (local) {
          local.serverId = u.id || local.serverId;
          local.serverBranchId = u.branchId || local.serverBranchId;
          /* local و d از دو خوانش مجزا هستند — تغییرات را روی d هم اعمال کن */
          for (var i = 0; i < d.users.length; i++) {
            if (d.users[i].id === local.id) { d.users[i].serverId = local.serverId; d.users[i].serverBranchId = local.serverBranchId; break; }
          }
        } else {
            var role = u.role || 'INSTRUCTOR';
            var lrole = (role === 'EVALUATOR') ? 'EVALUATOR' : ((role === 'ADMIN' || role === 'SUPERVISOR' || role.indexOf('SUPERVISOR') > -1 || role === 'BRANCH_MANAGER') ? 'ADMIN' : 'INSTRUCTOR');
            var nu = {
              id: 'srv_' + (u.id || phone), serverId: u.id, serverBranchId: u.branchId || null,
              name: u.name || phone, phone: phone, code: code,
              nationalId: u.nationalId || '', role: lrole, branchId: null,
              points: u.totalPoints || 0, recognitions: u.recognitionsCount || 0,
              approvalStatus: 'APPROVED', active: true, created: Date.now()
            };
            d.users.push(nu); local = nu;
          }
          writeDb(d);
        }
        return { user: local, token: res.token, serverUser: u };
      });
    },

    logout: function () {
      setToken('');
      /* best-effort unsubscribe */
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager.getSubscription();
        }).then(function (sub) {
          if (sub) { sub.unsubscribe(); req('DELETE', '/api/notifications/subscribe?endpoint=' + encodeURIComponent(sub.endpoint)).catch(function () {}); }
        }).catch(function () {});
      }
    },

    disablePush: function () {
      return new Promise(function (resolve) {
        if (!('serviceWorker' in navigator)) return resolve(false);
        navigator.serviceWorker.ready.then(function (reg) {
          return reg.pushManager.getSubscription();
        }).then(function (sub) {
          if (!sub) return resolve(false);
          var p = sub.unsubscribe();
          req('DELETE', '/api/notifications/subscribe?endpoint=' + encodeURIComponent(sub.endpoint)).catch(function () {});
          return Promise.resolve(p).then(function () { resolve(true); }).catch(function () { resolve(false); });
        }).catch(function () { resolve(false); });
      });
    },

    pushPermission: function () {
      try { return ('Notification' in window) ? Notification.permission : 'unsupported'; } catch (e) { return 'unsupported'; }
    },

    enablePush: function () {
      return new Promise(function (resolve, reject) {
        if (!('Notification' in window)) return reject(new Error('مرورگر از نوتیفیکیشن پشتیبانی نمی‌کند'));
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) return reject(new Error('Web Push در دسترس نیست'));
        Notification.requestPermission().then(function (perm) {
          if (perm !== 'granted') return reject(new Error('دسترسی نوتیفیکیشن داده نشد'));
          req('GET', '/api/notifications/subscribe').then(function (res) {
            var s = String(res.publicKey || '').replace(/-/g, '+').replace(/_/g, '/');
            while (s.length % 4) s += '=';
            var bin = atob(s);
            var key = new Uint8Array(bin.length);
            for (var i = 0; i < bin.length; i++) key[i] = bin.charCodeAt(i);
            return navigator.serviceWorker.ready.then(function (reg) {
              return reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
            }).then(function (sub) {
              return req('POST', '/api/notifications/subscribe', { subscription: sub.toJSON() });
            }).then(function (r) { resolve(r || { success: true }); });
          }).catch(reject);
        });
      });
    },

    register: function (payload) { return req('POST', '/api/auth/register', payload); },

    /* kind: one of PAYLOADS keys. rec = the local record (for sid mapping). */
    push: function (kind, payload, localId) {
      if (!base()) return Promise.reject(new Error('NO_SERVER'));
      var ep = ENDPOINTS[kind];
      if (!ep) return Promise.reject(new Error('BAD_KIND'));
      payload = payload || {};
      if (localId) payload._localId = localId;
      if (!getToken()) return queueAdd({ qid: String(Date.now()) + Math.random().toString(16).slice(2), kind: kind, payload: payload, localId: localId || null, ts: Date.now(), tries: 0 });
      return req(ep[0], ep[1], payload).then(function (res) {
        applySid(kind, localId, extractId(res));
        return res;
      }).catch(function (err) {
        if (err && err.message === 'UNAUTHORIZED') throw err;
        return queueAdd({ qid: String(Date.now()) + Math.random().toString(16).slice(2), kind: kind, payload: payload, localId: localId || null, ts: Date.now(), tries: 0 });
      });
    },

    /* DELETE-style pushes (person/task/attendance) */
    remove: function (kind, id) {
      if (!base() || !id) return Promise.resolve();
      var path = { person: '/api/people', task: '/api/tasks', attendance: '/api/attendance', session: '/api/sessions' }[kind];
      if (!path) return Promise.resolve();
      return req('DELETE', path, { id: id }).catch(function () {});
    },

    patchPerson: function (serverId, p) {
      if (!base()) return Promise.reject(new Error('NO_SERVER'));
      return req('PATCH', '/api/people', Object.assign({ id: serverId }, PAYLOADS.person(p))).catch(function (err) {
        if (err && err.message === 'UNAUTHORIZED') throw err;
        return null;
      });
    },

    patchTask: function (taskId, payload, localId) {
      if (!base()) return Promise.reject(new Error('NO_SERVER'));
      return req('PATCH', '/api/tasks', payload).then(function (res) {
        var sid = extractId(res);
        if (sid && localId) applySid('task', localId, sid);
      }).catch(function (err) {
        if (err && err.message === 'UNAUTHORIZED') throw err;
        return queueAdd({ qid: String(Date.now()) + Math.random().toString(16).slice(2), kind: 'taskPatch', payload: payload, localId: localId || null, ts: Date.now(), tries: 0 });
      });
    },

    flushQueue: function () {
      if (!base() || !getToken()) return Promise.resolve(0);
      return queueAll().then(function (items) {
        items.sort(function (a, b) { return a.ts - b.ts; });
        var chain = Promise.resolve(0);
        var sent = 0;
        items.forEach(function (it) {
          it.tries = (it.tries || 0) + 1;
          if (it.tries > 8) { queueDel(it.qid); return; }
          chain = chain.then(function () { return sendOne(it).then(function () { sent++; }).catch(function () {}); });
        });
        return chain.then(function () { return sent; });
      }).catch(function () { return 0; });
    },

    /* ---------- pull & merge ---------- */
    findLocalUser: function (serverUserId) {
      var d = readDb(); if (!d || !serverUserId) return null;
      for (var i = 0; i < d.users.length; i++) if (d.users[i].serverId === serverUserId) return d.users[i];
      return null;
    },

    pullReports: function () {
      return req('GET', '/api/reports').then(function (res) {
        var list = (res && res.reports) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (r) {
          if (!r || !r.id) return;
          var idx = -1;
          for (var i = 0; i < d.reports.length; i++) if (d.reports[i].sid === r.id) { idx = i; break; }
          var lu = API.findLocalUser(r.instructorId) || { id: 'srv_' + (r.instructorId || 'x'), name: (r.instructor && r.instructor.name) || '' };
          if (idx >= 0) {
            var o = d.reports[idx];
            o.subject = r.subject || o.subject; o.content = r.content || o.content;
            o.s1 = r.stagePresentation || o.s1; o.s2 = r.stageThinking || o.s2;
            o.s3 = r.stageDiscussion || o.s3; o.s4 = r.stageReporting || o.s4;
            o.g1 = r.groupEndurance || o.g1; o.g2 = r.groupSemiSpeed || o.g2; o.g3 = r.groupSpeed || o.g3;
            o.ev = r.evaluationSelf || o.ev; o.count = (r.attendeesCount != null ? r.attendeesCount : o.count);
            o.status = mapIn(r.status || o.status);
          } else {
            d.reports.push({
              id: 's' + r.id, sid: r.id, uid: lu.id, instructorName: (r.instructor && r.instructor.name) || lu.name || '',
              date: r.date, jdate: r.date ? faDate(r.date) : '', status: mapIn(r.status || 'DRAFT'),
              count: r.attendeesCount || 0, subject: r.subject || '', content: r.content || '',
              s1: r.stagePresentation || '', s2: r.stageThinking || '', s3: r.stageDiscussion || '', s4: r.stageReporting || '',
              g1: r.groupEndurance || '', g2: r.groupSemiSpeed || '', g3: r.groupSpeed || '', ev: r.evaluationSelf || ''
            });
            added++;
          }
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullLessons: function () {
      return req('GET', '/api/lesson-plans').then(function (res) {
        var list = (res && res.lessonPlans) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (l) {
          if (!l || !l.id) return;
          var idx = -1;
          for (var i = 0; i < d.lessons.length; i++) if (d.lessons[i].sid === l.id) { idx = i; break; }
          var lu = API.findLocalUser(l.instructorId) || { id: 'srv_' + (l.instructorId || 'x'), name: (l.instructor && l.instructor.name) || '' };
          if (idx >= 0) {
            var o = d.lessons[idx];
            o.title = l.title || o.title; o.subject = l.subject || o.subject;
            o.goal = l.generalObjective || o.goal; o.status = mapIn(l.status || o.status);
            o.p1 = l.introductionPhase || o.p1; o.p2 = l.presentationPhase || o.p2;
            o.p3 = l.summaryPhase || o.p3; o.p4 = l.evaluationPhase || o.p4;
          } else {
            d.lessons.push({
              id: 's' + l.id, sid: l.id, uid: lu.id, name: lu.name || '',
              date: l.createdAt, title: l.title || '', subject: l.subject || '',
              jdate: l.createdAt ? faDate(l.createdAt) : '', status: mapIn(l.status || 'DRAFT'),
              duration: l.sessionCount || 1, count: l.traineeCount || 0, grade: l.grade || '',
              goal: l.generalObjective || '', subgoals: '', quran: '', hadith: '',
              p1: l.introductionPhase || '', p2: l.presentationPhase || '', p3: l.summaryPhase || '', p4: l.evaluationPhase || '',
              tools: l.teachingAids || '', refs: '', hw: l.supplementaryActivities || ''
            });
            added++;
          }
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullPeople: function () {
      return req('GET', '/api/people').then(function (res) {
        var list = (res && res.people) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (p) {
          if (!p || !p.id) return;
          var idx = -1;
          for (var i = 0; i < d.people.length; i++) if (d.people[i].sid === p.id) { idx = i; break; }
          if (idx >= 0) {
            var o = d.people[idx];
            o.name = p.name || o.name; o.age = (p.age != null ? String(p.age) : o.age);
            o.phone = p.phone || o.phone; o.grade = p.grade || o.grade;
            o.group = p.group || o.group; o.note = p.note != null ? p.note : o.note;
          } else {
            d.people.push({ id: 's' + p.id, sid: p.id, created: p.createdAt || Date.now(), name: p.name || '', code: p.nationalId || '', age: p.age != null ? String(p.age) : '', phone: p.phone || '', grade: p.grade || '', group: p.group || '', joinDate: p.joinDate || '', note: p.note || '' });
            added++;
          }
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullTasks: function (localUid) {
      return req('GET', '/api/tasks').then(function (res) {
        var list = (res && res.tasks) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (t) {
          if (!t || !t.id) return;
          var idx = -1;
          for (var i = 0; i < d.tasks.length; i++) if (d.tasks[i].sid === t.id) { idx = i; break; }
          if (idx >= 0) {
            var o = d.tasks[idx]; o.text = t.text || o.text; o.priority = t.priority || o.priority; o.done = !!t.done;
          } else {
            d.tasks.push({ id: 's' + t.id, sid: t.id, uid: localUid, text: t.text || '', priority: t.priority || 'MED', due: t.due || '', done: !!t.done, created: t.createdAt || Date.now() });
            added++;
          }
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullTracker: function (localUid) {
      return req('GET', '/api/tracker').then(function (res) {
        var list = (res && res.items) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (t) {
          if (!t || !t.date) return;
          var idx = -1;
          for (var i = 0; i < d.dailyTracker.length; i++) if (d.dailyTracker[i].date === t.date && d.dailyTracker[i].uid === localUid) { idx = i; break; }
          if (idx < 0) {
            d.dailyTracker.push({
              id: 'st' + t.id, sid: t.id, uid: localUid, date: t.date,
              salat_fajr: !!t.salatFajr, salat_zuhr: !!t.salatZuhr, salat_asr: !!t.salatAsr,
              salat_magrib: !!t.salatMagrib, salat_isha: !!t.salatIsha, quran: !!t.quran,
              dhikr_morning: !!t.dhikrMorning, dhikr_evening: !!t.dhikrEvening,
              fasting: !!t.fasting, study: !!t.study
            });
            added++;
          }
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullSessions: function () {
      return req('GET', '/api/sessions').then(function (res) {
        var list = (res && res.sessions) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (s) {
          if (!s || !s.id) return;
          var idx = -1;
          for (var i = 0; i < d.sessions.length; i++) if (d.sessions[i].sid === s.id) { idx = i; break; }
          var lu = API.findLocalUser(s.instructorId) || { id: 'srv_' + (s.instructorId || 'x'), name: (s.instructor && s.instructor.name) || '' };
          if (idx >= 0) {
            var o = d.sessions[idx];
            o.name = s.title || o.name; o.title = s.title || o.title;
            o.attendees = (s.attendees != null ? s.attendees : o.attendees);
            o.place = s.place || o.place; o.agenda = s.agenda || o.agenda;
            o.decisions = s.decisions || o.decisions; o.followup = s.followup || o.followup; o.note = s.note != null ? s.note : o.note;
          } else {
            d.sessions.push({
              id: 'ss' + s.id, sid: s.id, uid: lu.id, name: s.title || '', title: s.title || '',
              date: s.date, jdate: s.date ? faDate(s.date) : '',
              attendees: s.attendees || 0, place: s.place || '', agenda: s.agenda || '',
              decisions: s.decisions || '', followup: s.followup || '', note: s.note || ''
            });
            added++;
          }
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullEvaluations: function () {
      return req('GET', '/api/evaluations').then(function (res) {
        var list = (res && res.evaluations) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (e) {
          if (!e || !e.id) return;
          var exists = false;
          for (var i = 0; i < d.evaluations.length; i++) if (d.evaluations[i].sid === e.id) { exists = true; break; }
          if (exists) return;
          var scores = [];
          try {
            var raw = JSON.parse(e.scores || '[]');
            if (Array.isArray(raw)) {
              scores = raw.map(function (s) { return { criteriaId: s.criteriaId || '', criteriaName: s.criteriaName || '', score: s.score | 0, maxScore: s.maxScore | 0 }; });
            } else if (raw && typeof raw === 'object') {
              Object.keys(raw).forEach(function (cid) { var v = raw[cid]; scores.push({ criteriaId: cid, criteriaName: '', score: (v && v.score != null ? v.score : (typeof v === 'number' ? v : 0)) | 0, maxScore: (v && v.maxScore) | 0 }); });
            }
          } catch (err) {}
          d.evaluations.push({
            id: 'se' + e.id, sid: e.id,
            targetType: (e.targetType === 'lesson_plan' || e.targetType === 'LESSON') ? 'LESSON' : 'REPORT',
            targetId: e.targetId, targetUid: e.targetUid || '',
            evaluatorId: e.evaluatorId,
            scores: scores, totalScore: e.totalScore | 0, maxScore: e.maxScore | 0,
            note: e.overallComment || '', date: e.createdAt,
            targetTitle: e.targetTitle || '', instructorName: e.instructorName || ''
          });
          added++;
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullMaktabs: function () {
      return req('GET', '/api/maktabs').then(function (res) {
        var list = (res && res.maktabs) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (m) {
          if (!m || !m.id) return;
          var idx = -1;
          for (var i = 0; i < d.maktabs.length; i++) if (d.maktabs[i].sid === m.id) { idx = i; break; }
          if (idx >= 0) { d.maktabs[idx].name = m.name || d.maktabs[idx].name; }
          else { d.maktabs.push({ id: 'smk' + m.id, sid: m.id, name: m.name || '', code: m.code || '', active: m.active !== false }); added++; }
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullBranches: function () {
      return req('GET', '/api/branches').then(function (res) {
        var list = (res && res.branches) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (b) {
          if (!b || !b.id) return;
          var idx = -1;
          for (var i = 0; i < d.branches.length; i++) if (d.branches[i].sid === b.id) { idx = i; break; }
          if (idx >= 0) { d.branches[idx].name = b.name || d.branches[idx].name; }
          else { d.branches.push({ id: 'sbr' + b.id, sid: b.id, name: b.name || '', code: b.code || '', maktabId: b.maktabId || null, phone: '', isBoys: !!b.isBoys }); added++; }
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullHadiths: function () {
      return req('GET', '/api/hadith/search').then(function (res) {
        var list = (res && res.hadiths) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (h) {
          if (!h || !h.id) return;
          var exists = false;
          for (var i = 0; i < d.hadiths.length; i++) if (d.hadiths[i].sid === h.id) { exists = true; break; }
          if (exists) return;
          d.hadiths.push({ id: 'sh' + h.id, sid: h.id, source: h.source || '', narrator: h.narratorChain || '', text: h.textFa || h.textAr || '', topic: '' });
          added++;
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    /* Quran has no list endpoint (search-only) — merge search results on demand */
    pullQuranSearch: function (q) {
      return req('GET', '/api/quran/search?q=' + encodeURIComponent(q)).then(function (res) {
        var list = (res && res.verses) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (v) {
          if (!v || !v.id) return;
          var exists = false;
          for (var i = 0; i < d.quran.length; i++) if (d.quran[i].sid === v.id) { exists = true; break; }
          if (exists) return;
          d.quran.push({ id: 'sq' + v.id, sid: v.id, surah: v.surahNameFa ? 'سوره ' + v.surahNameFa : String(v.surah), verseNo: v.ayah, text: v.textUthmani || v.textSimple || '', topic: v.surahNameFa || '' });
          added++;
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullNotifications: function () {
      return req('GET', '/api/notifications').then(function (res) {
        var list = (res && res.notifications) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var added = 0;
        list.forEach(function (n) {
          if (!n || !n.id) return;
          var exists = false;
          for (var i = 0; i < d.notifications.length; i++) if (d.notifications[i].sid === n.id) { exists = true; break; }
          if (!exists) {
            d.notifications.push({ id: 'sn' + n.id, sid: n.id, title: n.title || '', body: n.body || '', date: n.createdAt, read: !!n.read });
            added++;
          }
        });
        writeDb(d); return added;
      }).catch(function () { return 0; });
    },

    pullMethodologies: function () {
      return req('GET', '/api/methodologies').then(function (res) {
        var list = (res && res.methodologies) || [];
        var d = readDb(); if (!d || !list.length) return 0;
        var localIds = {};
        (d.methodologies || []).forEach(function (m) { localIds[m.name] = true; });
        list.forEach(function (m) {
          if (m && m.name && !localIds[m.name]) {
            d.methodologies.push({ id: 'sm' + (m.id || m.name), name: m.name, desc: m.desc || '', steps: m.steps || '' });
          }
        });
        writeDb(d); return list.length;
      }).catch(function () { return 0; });
    },

    pullAll: function () {
      if (!base() || !getToken()) return Promise.resolve(null);
      var sess = null;
      try { sess = JSON.parse(localStorage.getItem('morabbi_session_v23') || 'null'); } catch (e) {}
      var uid = sess ? sess.id : null;
      var ps = [
        API.pullReports(), API.pullLessons(), API.pullPeople(),
        API.pullTasks(uid), API.pullTracker(uid),
        API.pullSessions(), API.pullEvaluations(),
        API.pullMaktabs(), API.pullBranches(), API.pullHadiths(),
        API.pullNotifications(), API.pullMethodologies()
      ];
      return Promise.all(ps).then(function (counts) {
        return { ok: true, counts: counts };
      }).catch(function (err) {
        return { ok: false, error: err && err.message };
      });
    },

    /* periodic sync: flush queue + pull; 60s + on 'online' */
    _timer: null,
    _started: false,
    start: function () {
      var self = this;
      if (self._started) return;
      self._started = true;
      function tick() {
        if (!base() || !getToken() || !navigator.onLine) return;
        self.flushQueue().then(function () { return self.pullAll(); }).then(function () {
          if (typeof window.syncToast === 'function') window.syncToast();
        }).catch(function () {});
      }
      self._timer = setInterval(tick, 60000);
      window.addEventListener('online', function () { tick(); });
      setTimeout(tick, 1500);
    },
    stop: function () {
      if (this._timer) { clearInterval(this._timer); this._timer = null; }
      this._started = false;
    }
  };

  window.API = API;
})();
