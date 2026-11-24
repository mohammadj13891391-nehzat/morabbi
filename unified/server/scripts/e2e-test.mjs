const B = 'http://localhost:3015';
let token = '';
async function req(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['x-user-id'] = token;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(B + path, opts);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(method + ' ' + path + ' -> ' + res.status + ' ' + JSON.stringify(data).slice(0, 120));
  return data;
}
const ok = (name) => console.log('OK  ' + name);
(async () => {
  const login = await req('POST', '/api/auth', { phone: '09120000001', password: '567890' });
  token = login.token;
  console.log('OK  login ' + login.user.name + ' role=' + login.user.role);

  const rep = await req('POST', '/api/reports', { subject: 'E2E تست گزارش', content: 'متن آزمایشی یکپارچه‌سازی', stagePresentation: 'مرحله ۱', attendeesCount: 12, status: 'SUBMITTED' });
  ok('report created ' + rep.report.id.slice(0, 8));

  const les = await req('POST', '/api/lesson-plans', { title: 'E2E تست طرح درس', subject: 'اخلاق', generalObjective: 'هدف', introductionPhase: 'مرحله ۱' });
  ok('lesson created ' + les.lessonPlan.id.slice(0, 8));

  const per = await req('POST', '/api/people', { name: 'E2E دانش‌آموز', code: '1111111111', age: 15, phone: '09120009999', group: 'ESTEGHLATI' });
  ok('person created ' + per.person.id.slice(0, 8));

  const att = await req('POST', '/api/attendance', { personId: per.person.id, date: '1404/09/01', status: 'PRESENT' });
  ok('attendance ' + (att.record ? 'created' : JSON.stringify(att)));

  const ses = await req('POST', '/api/sessions', { title: 'E2E صورتجلسه', attendees: 5, place: 'مدرسه', agenda: 'موضوع ۱' });
  ok('session created ' + ses.session.id.slice(0, 8));

  const task = await req('POST', '/api/tasks', { text: 'E2E کار آزمایشی', priority: 'HIGH', due: '1404/09/10' });
  ok('task created ' + task.task.id.slice(0, 8));

  const trk = await req('POST', '/api/tracker', { salatFajr: true, quran: true, dhikrMorning: true });
  ok('tracker ' + (trk.item ? 'saved' : JSON.stringify(trk).slice(0, 80)));

  const taskP = await req('PATCH', '/api/tasks', { id: task.task.id, text: 'E2E کار آزمایشی', priority: 'HIGH', done: true });
  ok('task patched done=' + taskP.task.done);

  const ev = await req('POST', '/api/evaluations', { targetType: 'REPORT', targetId: rep.report.id, scores: [{ criteriaId: 'c1', criteriaName: 'چهار مرحله‌ای', score: 9, maxScore: 10 }, { criteriaId: 'c2', criteriaName: 'سه گروه', score: 8, maxScore: 10 }], overallComment: 'E2E' });
  ok('evaluation total=' + ev.totalScore + '/' + ev.maxScore);

  const rep2 = await req('GET', '/api/reports');
  const found = rep2.reports.find(r => r.id === rep.report.id);
  console.log('OK  report listed, status=' + found.status);

  const pts = await req('GET', '/api/profile?userId=' + login.user.id);
  console.log('OK  profile points=' + pts.profile.totalPoints + ' recognitions=' + pts.profile.recognitionsCount);

  const srch = await req('GET', '/api/search?q=E2E');
  const counts = {};
  (srch.results || []).forEach(r => { counts[r.type] = (counts[r.type] || 0) + 1; });
  console.log('OK  search E2E -> ' + JSON.stringify(counts));

  console.log('ALL E2E TESTS PASSED');
})().catch(e => { console.error('FAIL ' + e.message); process.exit(1); });
