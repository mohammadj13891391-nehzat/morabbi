// PWA sync-layer test — runs the REAL js/api.js in a Node vm sandbox with
// stubbed localStorage / location / navigator / IndexedDB, against the live
// server on :3015. Verifies: login mapping, online push + sid application,
// offline queueing, queue flush, pullAll merge, remove, 401 handling.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const B = 'http://localhost:3015';
let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log('OK   ' + n); };
const bad = (n, x) => { fail++; console.log('FAIL ' + n + (x ? ' — ' + x : '')); };
const check = (n, cond, x) => (cond ? ok(n) : bad(n, x));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const uniq = 'SYNCTEST' + Date.now().toString(36).toUpperCase();

// ---------- minimal in-memory localStorage ----------
function makeLocalStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    _dump: () => Object.fromEntries(m),
  };
}

// ---------- minimal in-memory IndexedDB (just what api.js uses) ----------
function makeIDB() {
  const dbs = new Map();
  function makeReq() { return { onsuccess: null, onerror: null, result: undefined }; }
  function handle(name) {
    const storeMap = dbs.get(name);
    return {
      objectStoreNames: { contains: (n) => storeMap.has(n) },
      createObjectStore: (n) => { storeMap.set(n, new Map()); return { name: n }; },
      close: () => {},
      transaction: (storeName) => {
        const store = storeMap.get(storeName);
        const tx = {
          objectStore: () => ({
            put: (item) => { store.set(item.qid, item); const rq = makeReq(); setTimeout(() => rq.onsuccess && rq.onsuccess(), 0); return rq; },
            getAll: () => { const rq = makeReq(); const rows = [...store.values()]; setTimeout(() => { rq.result = rows; rq.onsuccess && rq.onsuccess(); }, 0); return rq; },
            delete: (key) => { store.delete(key); const rq = makeReq(); setTimeout(() => rq.onsuccess && rq.onsuccess(), 0); return rq; },
          }),
          oncomplete: null, onerror: null,
        };
        setTimeout(() => tx.oncomplete && tx.oncomplete(), 5);
        return tx;
      },
    };
  }
  return {
    open(name) {
      const req = makeReq();
      const isFresh = !dbs.has(name);
      if (isFresh) dbs.set(name, new Map());
      setTimeout(() => {
        req.result = handle(name);
        if (isFresh && req.onupgradeneeded) req.onupgradeneeded();
        if (req.onsuccess) req.onsuccess();
      }, 0);
      return req;
    },
    _storeCount: (db, st) => (dbs.get(db) || new Map()).get(st) ? dbs.get(db).get(st).size : -1,
  };
}

// ---------- sandbox ----------
const ls = makeLocalStorage();
const idb = makeIDB();
let online = true;
const realFetch = fetch;
const sandbox = {
  localStorage: ls,
  location: { origin: B },
  navigator: { get onLine() { return online; } },
  fetch: (url, opts) => (online ? realFetch(url, opts) : Promise.reject(new TypeError('Failed to fetch (offline)'))),
  indexedDB: idb,
  window: null, // set below
  setInterval, clearInterval, setTimeout,
  console,
};
sandbox.window = sandbox; // window === global scope for listeners
sandbox.addEventListener = () => {};
sandbox.window.addEventListener = () => {};

vm.createContext(sandbox);
const apiSrc = readFileSync(new URL('../public/app/js/api.js', import.meta.url), 'utf8');
vm.runInContext(apiSrc, sandbox, { filename: 'api.js' });
const API = sandbox.window.API;
check('api.js loaded, window.API exists', !!API && typeof API.push === 'function');

function localDb() { return JSON.parse(ls.getItem('morabbi_db_v23')); }
function setLocalDb(d) { ls.setItem('morabbi_db_v23', JSON.stringify(d)); }

// seed a v23-shaped local DB (one instructor user, no serverId yet)
setLocalDb({
  maktabs: [], branches: [],
  users: [{ id: 'u2', name: 'مربی نمونه', phone: '09120000002', code: '112233', nationalId: '', role: 'INSTRUCTOR', branchId: null, points: 0, recognitions: 0, approvalStatus: 'APPROVED', active: true, created: Date.now() }],
  reports: [], lessons: [], people: [], attendance: [], sessions: [], notifications: [],
  criteria: [], evaluations: [], comments: [], points: [], recognitions: [],
  quran: [], hadiths: [], methodologies: [], tasks: [], dailyTracker: [], chatHistory: [],
  settings: { serverUrl: '', theme: 'green', darkMode: false },
});

(async () => {
  // ---- 1. login -> token + local user mapping
  const lr = await API.login('09120000002', '112233');
  await sleep(50); // let the login's writeDb settle (it runs in a prior microtask chain)
  check('login returns token', typeof lr.token === 'string' && lr.token.length === 64, 'len=' + (lr.token || '').length);
  check('token persisted in localStorage', ls.getItem('morabbi_api_token') === lr.token);
  const du = localDb().users.find(u => u.phone === '09120000002');
  check('local user mapped (serverId set)', !!du.serverId, JSON.stringify(du).slice(0, 120));
  check('local user mapped (serverBranchId set)', !!du.serverBranchId);

  // ---- 2. online push('report') -> sid applied to local record
  const localReport = { id: String(Date.now()), uid: 'u2', instructorName: 'مربی نمونه', date: new Date().toISOString(), status: 'DRAFT', count: 4, subject: uniq + ' گزارش سینک', content: 'متن', s1: '', s2: '', s3: '', s4: '', g1: '', g2: '', g3: '', ev: '' };
  { const d = localDb(); d.reports.push(localReport); setLocalDb(d); }
  await API.push('report', localReport, localReport.id);
  await sleep(30);
  const after = localDb().reports.find(r => r.id === localReport.id);
  check('online push: sid applied to local record', !!after.sid, 'sid=' + after.sid);
  // verify server side
  const sres = await realFetch(B + '/api/search?q=' + encodeURIComponent(uniq), { headers: { 'x-user-id': lr.token } }).then(r => r.json());
  check('online push: report exists on server', (sres.results || []).some(r => r.type === 'report'), JSON.stringify(sres.results || []).slice(0, 100));

  // ---- 3. offline: push -> queued in IndexedDB
  const localReport2 = { id: String(Date.now() + 1), uid: 'u2', instructorName: 'مربی نمونه', date: new Date().toISOString(), status: 'DRAFT', count: 1, subject: uniq + ' گزارش آفلاین', content: 'متن', s1: '', s2: '', s3: '', s4: '', g1: '', g2: '', g3: '', ev: '' };
  { const d = localDb(); d.reports.push(localReport2); setLocalDb(d); }
  online = false;
  await API.push('report', localReport2, localReport2.id);
  await sleep(30);
  const qcount = idb._storeCount('morabbi_sync_queue', 'queue');
  check('offline push: item queued in IndexedDB', qcount === 1, 'queue=' + qcount);
  const local2 = localDb().reports.find(r => r.id === localReport2.id);
  check('offline push: local record intact, no sid yet', !local2.sid);

  // ---- 4. back online: flushQueue -> delivered + sid applied
  online = true;
  const sent = await API.flushQueue();
  await sleep(50);
  check('flushQueue delivered 1 item', sent === 1, 'sent=' + sent);
  check('flushQueue: queue now empty', idb._storeCount('morabbi_sync_queue', 'queue') === 0, 'queue=' + idb._storeCount('morabbi_sync_queue', 'queue'));
  const local2b = localDb().reports.find(r => r.id === localReport2.id);
  check('flushQueue: sid applied after delivery', !!local2b.sid, 'sid=' + local2b.sid);
  const sres2 = await realFetch(B + '/api/search?q=' + encodeURIComponent(uniq), { headers: { 'x-user-id': lr.token } }).then(r => r.json());
  const offlineOnServer = (sres2.results || []).some(r => r.type === 'report' && (r.title || '').includes('آفلاین'));
  check('flushQueue: offline report now on server', offlineOnServer, JSON.stringify((sres2.results || []).map(r => r.title)).slice(0, 140));

  // ---- 5. pullAll -> server-only record merged into local DB
  // create a report on the server AS THE INSTRUCTOR (GET /api/reports is role-scoped to own)
  const srvReport = (await realFetch(B + '/api/reports', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': lr.token }, body: JSON.stringify({ subject: uniq + ' گزارش سرور', content: 'سروری', status: 'DRAFT' }) }).then(r => r.json())).report;
  // a local-only record (never pushed) must survive pullAll
  { const d = localDb(); d.reports.push({ id: 'localonly_' + Date.now(), uid: 'u2', instructorName: 'مربی نمونه', date: new Date().toISOString(), status: 'DRAFT', count: 0, subject: uniq + ' فقط محلی', content: '', s1: '', s2: '', s3: '', s4: '', g1: '', g2: '', g3: '', ev: '' }); setLocalDb(d); }
  const pullRes = await API.pullAll();
  check('pullAll ok', pullRes && pullRes.ok === true, JSON.stringify(pullRes).slice(0, 100));
  const pulled = localDb().reports.find(r => r.sid === srvReport.id);
  check('pullAll: server report merged into local DB (by sid)', !!pulled, 'reports=' + localDb().reports.length);
  check('pullAll: mapped fields correct', pulled && pulled.subject === uniq + ' گزارش سرور' && pulled.uid === 'u2', pulled ? JSON.stringify(pulled).slice(0, 140) : 'n/a');
  const localCount = localDb().reports.filter(r => !r.sid).length;
  check('pullAll: local-only records preserved', localCount >= 1, 'localOnly=' + localCount);

  // ---- 6. remove('person') -> DELETE on server
  const p = (await realFetch(B + '/api/people', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': lr.token }, body: JSON.stringify({ name: uniq + ' فرد سینک', age: 10 }) }).then(r => r.json())).person;
  await API.remove('person', p.id);
  await sleep(30);
  const ppl = (await realFetch(B + '/api/people', { headers: { 'x-user-id': lr.token } }).then(r => r.json())).people;
  check('remove: person deleted on server', !ppl.find(x => x.id === p.id), 'count=' + ppl.length);

  // ---- 7. 401 handling: bad token -> push throws UNAUTHORIZED (not queued)
  ls.setItem('morabbi_api_token', 'f'.repeat(64));
  let threw = '';
  try { await API.push('report', { ...localReport, id: String(Date.now() + 2) }, 'x'); } catch (e) { threw = e.message; }
  check('bad token: push rejects UNAUTHORIZED', threw === 'UNAUTHORIZED', 'threw=' + threw);
  check('bad token: token cleared', ls.getItem('morabbi_api_token') === '' || ls.getItem('morabbi_api_token') === null);
  ls.setItem('morabbi_api_token', lr.token);

  // ---- 8. start()/stop() no-throw
  let threw2 = '';
  try { API.start(); await sleep(20); API.stop(); } catch (e) { threw2 = e.message; }
  check('start()/stop() no throw', threw2 === '', threw2);

  console.log('\n=== PWA SYNC: ' + pass + ' passed, ' + fail + ' failed ===');
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('FATAL ' + e.message, e.stack); process.exit(1); });
