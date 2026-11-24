// E2E — full role flows, points accounting, status transitions.
// Mirrors exactly what the PWA's js/api.js would send.
const B = "http://localhost:3015";
let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log("OK   " + n); };
const bad = (n, x) => { fail++; console.log("FAIL " + n + (x ? " — " + x : "")); };
const check = (n, cond, x) => (cond ? ok(n) : bad(n, x));

async function req(method, path, body, tok) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (tok) opts.headers["x-user-id"] = tok;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(B + path, opts);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}
async function j(method, path, body, tok) {
  const r = await req(method, path, body, tok);
  if (r.status >= 400) throw new Error(method + " " + path + " -> " + r.status + " " + JSON.stringify(r.data).slice(0, 120));
  return r.data;
}
async function login(phone, password) {
  const d = await j("POST", "/api/auth", { phone, password });
  return { token: d.token, user: d.user };
}
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const uniq = Date.now().toString(36);

(async () => {
  // ---- 0. auth
  const admin = await login("09120000001", "567890");
  check("login ADMIN", admin.user.role === "ADMIN", admin.user.role);
  const instr = await login("09120000002", "112233");
  check("login INSTRUCTOR", instr.user.role === "INSTRUCTOR", instr.user.role);
  const evalr = await login("09120000003", "445566");
  check("login EVALUATOR", evalr.user.role === "EVALUATOR", evalr.user.role);

  // unauthenticated -> 401
  const anon = await req("GET", "/api/reports");
  check("no token -> 401", anon.status === 401, "got " + anon.status);
  const badtok = await req("GET", "/api/reports", null, "deadbeef".repeat(8));
  check("bogus token -> 401", badtok.status === 401, "got " + badtok.status);

  // ---- 1. register -> PENDING -> login (v23 signup flow)
  const phone = "09" + String(100000000 + (Date.now() % 899999999));
  const natl = "1" + String(Date.now()).slice(-9);
  const reg = await j("POST", "/api/auth/register", {
    name: "E2E نوپا " + uniq, nationalId: natl,
    phone, requestedRole: "INSTRUCTOR", branchId: admin.user.branchId || undefined,
  }, admin.token);
  check("register -> PENDING", reg.status === "PENDING" || reg.userId, JSON.stringify(reg).slice(0, 100));
  // password = last 6 of nationalId. Server: PENDING login is 403 — the PWA
  // local-first doLogin() logs in locally and shows «حالت آفلاین», so this is by design.
  const pend2 = await req("POST", "/api/auth", { phone, password: natl.slice(-6) });
  check("PENDING login -> 403 (PWA falls back to local login)", pend2.status === 403, "got " + pend2.status);

  // ---- 2. instructor report flow: SUBMITTED -> evaluate 90% -> APPROVED + points + recognition
  const prof0 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  const rep = (await j("POST", "/api/reports", {
    subject: "E2EFULL گزارش " + uniq, content: "متن کامل " + uniq,
    stagePresentation: "س1", stageThinking: "س2", stageDiscussion: "س3", stageReporting: "س4",
    groupEndurance: "گ1", groupSemiSpeed: "گ2", groupSpeed: "گ3", evaluationSelf: "خوب",
    attendeesCount: 15, status: "SUBMITTED",
  }, instr.token)).report;
  check("report created (SUBMITTED)", rep.status === "SUBMITTED", rep.status);

  const prof1 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  check("report save +5 pts", prof1.totalPoints - prof0.totalPoints === 5, "delta=" + (prof1.totalPoints - prof0.totalPoints));

  // evaluator scores 9/10 + 8/10 on two REPORT criteria (90%)
  const ev1 = (await j("POST", "/api/evaluations", {
    targetType: "REPORT", targetId: rep.id,
    scores: [{ criteriaId: "c1", criteriaName: "چهار مرحله‌ای", score: 9, maxScore: 10 }, { criteriaId: "c2", criteriaName: "سه گروه", score: 8, maxScore: 10 }],
    overallComment: "عالی",
  }, evalr.token));
  check("evaluation 17/20 (85%)", ev1.totalScore === 17 && ev1.maxScore === 20, ev1.totalScore + "/" + ev1.maxScore);

  const repAfter = (await j("GET", "/api/reports", null, instr.token)).reports.find(r => r.id === rep.id);
  check("report auto-APPROVED by evaluation", repAfter && repAfter.status === "APPROVED", repAfter && repAfter.status);

  const prof2 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  const d2 = prof2.totalPoints - prof1.totalPoints;
  check("excellent eval +15 (85%>=80%)", d2 === 15, "delta=" + d2);
  check("recognition auto-awarded", prof2.recognitionsCount - prof1.recognitionsCount === 1, "delta=" + (prof2.recognitionsCount - prof1.recognitionsCount));

  // instructor notified
  const notif = (await j("GET", "/api/notifications", null, instr.token)).notifications;
  check("instructor got evaluation notification", notif.some(n => /ارزیابی/.test(n.title + (n.body || ""))), JSON.stringify(notif.slice(0, 2)).slice(0, 120));

  // ---- 3. lesson flow: DRAFT +8 -> manual status APPROVED +10 -> evaluate 90% +20
  const les = (await j("POST", "/api/lesson-plans", {
    title: "E2EFULL طرح درس " + uniq, subject: "عقاید", grade: "پایه ۷",
    generalObjective: "هدف اصلی", introductionPhase: "م1", presentationPhase: "م2",
    summaryPhase: "م3", evaluationPhase: "م4", status: "DRAFT",
  }, instr.token)).lessonPlan;
  check("lesson created (DRAFT)", les.status === "DRAFT", les.status);
  const profL0 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  check("lesson save +8 pts", profL0.totalPoints - prof2.totalPoints === 8, "delta=" + (profL0.totalPoints - prof2.totalPoints));

  await j("POST", "/api/lesson-plans/status", { id: les.id, status: "APPROVED" }, evalr.token);
  const profL1 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  check("lesson manual approve +10 pts", profL1.totalPoints - profL0.totalPoints === 10, "delta=" + (profL1.totalPoints - profL0.totalPoints));

  await j("POST", "/api/evaluations", {
    targetType: "LESSON", targetId: les.id,
    scores: [{ criteriaId: "c7", criteriaName: "آیات", score: 9, maxScore: 10 }, { criteriaId: "c8", criteriaName: "احادیث", score: 9, maxScore: 10 }],
  }, evalr.token);
  const profL2 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  check("excellent lesson eval +20 pts", profL2.totalPoints - profL1.totalPoints === 20, "delta=" + (profL2.totalPoints - profL1.totalPoints));

  // role gate: INSTRUCTOR cannot evaluate
  const forbidden = await req("POST", "/api/evaluations", {
    targetType: "REPORT", targetId: rep.id,
    scores: [{ criteriaId: "c1", criteriaName: "x", score: 5, maxScore: 10 }],
  }, instr.token);
  check("INSTRUCTOR cannot evaluate (403)", forbidden.status === 403, "got " + forbidden.status);

  // ---- 4. session +3, task +1, tracker +1
  const profA0 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  await j("POST", "/api/sessions", { title: "E2EFULL صورتجلسه " + uniq, attendees: 7, place: "کلاس", agenda: "ب" }, instr.token);
  const profA1 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  check("session +3 pts", profA1.totalPoints - profA0.totalPoints === 3, "delta=" + (profA1.totalPoints - profA0.totalPoints));

  const task = (await j("POST", "/api/tasks", { text: "E2EFULL کار " + uniq, priority: "HIGH" }, instr.token)).task;
  await j("PATCH", "/api/tasks", { id: task.id, text: task.text, priority: "HIGH", done: true }, instr.token);
  const profA2 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  check("task done +1 pt", profA2.totalPoints - profA1.totalPoints === 1, "delta=" + (profA2.totalPoints - profA1.totalPoints));

  // idempotent: pick 2 currently-false items, check them -> +2; then one more -> +1
  const trkItems = ["salatFajr", "salatZuhr", "salatAsr", "salatMagrib", "salatIsha", "quran", "dhikrMorning", "dhikrEvening", "fasting", "study"];
  const trkList = (await j("GET", "/api/tracker", null, instr.token)).items;
  const today = trkList[0];
  const falseItems = today ? trkItems.filter(k => !today[k]) : trkItems;
  const pick2 = falseItems.slice(0, 2), pick1 = falseItems.slice(2, 3);
  const payload2 = {}; pick2.forEach(k => { payload2[k] = true; });
  await j("POST", "/api/tracker", payload2, instr.token);
  const profA3 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  check("tracker 2 new items +2 pts", profA3.totalPoints - profA2.totalPoints === 2, "delta=" + (profA3.totalPoints - profA2.totalPoints));
  const payload1 = {}; if (pick1[0]) payload1[pick1[0]] = true;
  await j("POST", "/api/tracker", payload1, instr.token);
  const profA4 = (await j("GET", "/api/profile?userId=" + instr.user.id, null, instr.token)).profile;
  check("tracker upsert +1 (only new item)", profA4.totalPoints - profA3.totalPoints === 1, "delta=" + (profA4.totalPoints - profA3.totalPoints));

  // ---- 5. people + attendance upsert
  const person = (await j("POST", "/api/people", { name: "E2EFULL فرد " + uniq, code: "0011223344", age: 14, phone: "09121112223", group: "NIMESORAT" }, instr.token)).person;
  const d1 = "1404/09/0" + (1 + (Date.now() % 8));
  await j("POST", "/api/attendance", { personId: person.id, date: d1, status: "PRESENT" }, instr.token);
  await j("POST", "/api/attendance", { personId: person.id, date: d1, status: "ABSENT" }, instr.token); // upsert
  const att = (await j("GET", "/api/attendance?date=" + d1, null, instr.token)).records;
  const mine = att.filter(a => a.personId === person.id);
  check("attendance upsert = 1 record (ABSENT)", mine.length === 1 && mine[0].status === "ABSENT", JSON.stringify(mine));

  // ---- 6. global search (5 collections) with unique token (before person patch)
  const srch = (await j("GET", "/api/search?q=" + encodeURIComponent(uniq), null, admin.token)).results || [];
  const types = {};
  srch.forEach(r => types[r.type] = (types[r.type] || 0) + 1);
  check("search finds report", (types.report || 0) >= 1, JSON.stringify(types));
  check("search finds lesson_plan", (types.lesson_plan || 0) >= 1, JSON.stringify(types));
  check("search finds person", (types.person || 0) >= 1, JSON.stringify(types));

  // ---- 5b. patch person (after search)
  await j("PATCH", "/api/people", { id: person.id, name: "E2EFULL فرد ویرایش‌شده " + uniq, age: 15 }, instr.token);
  const ppl = (await j("GET", "/api/people", null, instr.token)).people;
  check("person patched", ppl.find(p => p.id === person.id).name.includes("ویرایش"), JSON.stringify(ppl.find(p => p.id === person.id)));

  // ---- 7. quran / hadith / methodologies
  const q = (await j("GET", "/api/quran/search?q=الحمd".replace("d", "د"), null, admin.token));
  check("quran search works", Array.isArray(q.verses || q.results || q), JSON.stringify(q).slice(0, 80));
  const had = await j("GET", "/api/hadith/search", null, admin.token);
  check("hadith list non-empty", (had.hadiths || had).length > 0, JSON.stringify(had).slice(0, 80));
  const meth = (await j("GET", "/api/methodologies", null, admin.token)).methodologies;
  check("8 methodologies", meth.length === 8, "got " + meth.length);

  // ---- 8. export CSV non-empty + UTF-8 BOM (check raw bytes; text() strips BOM)
  const expRes = await fetch(B + "/api/export?type=reports", { headers: { "x-user-id": admin.token } });
  const expBuf = new Uint8Array(await expRes.arrayBuffer());
  const csvLen = expBuf.length;
  const hasBom = expBuf.length >= 3 && expBuf[0] === 0xEF && expBuf[1] === 0xBB && expBuf[2] === 0xBF;
  check("CSV export non-empty + BOM", expRes.ok && csvLen > 50 && hasBom, "len=" + csvLen + " bom=" + hasBom);

  // ---- 9. dashboard + analytics don't 500
  const dash = await req("GET", "/api/dashboard", null, admin.token);
  check("dashboard 200", dash.status === 200, "got " + dash.status);
  const an = await req("GET", "/api/analytics", null, admin.token);
  check("analytics 200", an.status === 200, "got " + an.status);

  // ---- 10. deletes (PWA remove())
  await j("DELETE", "/api/people", { id: person.id }, instr.token);
  const ppl2 = (await j("GET", "/api/people", null, instr.token)).people;
  check("person deleted", !ppl2.find(p => p.id === person.id));
  await j("DELETE", "/api/tasks", { id: task.id }, instr.token);
  const tasks2 = (await j("GET", "/api/tasks", null, instr.token)).tasks;
  check("task deleted", !tasks2.find(t => t.id === task.id));

  console.log("\n=== E2E FULL: " + pass + " passed, " + fail + " failed ===");
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error("FATAL " + e.message); process.exit(1); });
