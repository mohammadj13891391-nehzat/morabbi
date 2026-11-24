// PWA static verification — no browser needed.
// Checks: JS syntax (index inline + api.js + sw.js), manifest, API surface
// cross-reference, nav/render view coverage, PWA head links, icon files,
// Persian byte integrity, sw precache coverage.
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';

const APP = path.resolve('public/app');
let pass = 0, fail = 0;
const ok = (n) => { pass++; console.log('OK   ' + n); };
const bad = (n, extra) => { fail++; console.log('FAIL ' + n + (extra ? ' — ' + extra : '')); };

function check(name, cond, extra) { if (cond) ok(name); else bad(name, extra); }

// ---- 1. files exist & non-empty
const files = ['index.html', 'js/api.js', 'sw.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
for (const f of files) {
  const p = path.join(APP, f);
  const sz = existsSync(p) ? readFileSync(p).length : 0;
  check('file ' + f + ' exists (' + sz + 'B)', sz > 0);
}
const html = readFileSync(path.join(APP, 'index.html'), 'utf8');
const apiJs = readFileSync(path.join(APP, 'js/api.js'), 'utf8');
const swJs = readFileSync(path.join(APP, 'sw.js'), 'utf8');

// ---- 2. JS syntax via node --check
const tmp = path.join(tmpdir(), 'pwa-check');
mkdirSync(tmp, { recursive: true });
function syntaxCheck(label, code) {
  const f = path.join(tmp, label + '.js');
  writeFileSync(f, code);
  try { execFileSync('node', ['--check', f], { stdio: 'pipe' }); ok('syntax ' + label); }
  catch (e) { bad('syntax ' + label, String(e.stderr || e.message).slice(0, 200)); }
}
// inline scripts of index.html (skip api.js external)
const scripts = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map(m => ({ attrs: m[1], code: m[2] }));
const inline = scripts.filter(s => !/src=/.test(s.attrs) && s.code.trim());
check('index.html has >=1 inline script', inline.length >= 1, 'found ' + inline.length);
syntaxCheck('index-inline', inline.map(s => s.code).join('\n;\n'));
syntaxCheck('api.js', apiJs);
syntaxCheck('sw.js', swJs);

// ---- 3. manifest
let manifest = null;
try { manifest = JSON.parse(readFileSync(path.join(APP, 'manifest.webmanifest'), 'utf8')); ok('manifest JSON valid'); }
catch (e) { bad('manifest JSON valid', e.message); }
if (manifest) {
  check('manifest dir=rtl', manifest.dir === 'rtl');
  check('manifest lang=fa-IR', /fa/.test(manifest.lang || ''));
  check('manifest display=standalone', manifest.display === 'standalone');
  check('manifest theme_color #059669', /059669/i.test(manifest.theme_color || ''));
  const icons = manifest.icons || [];
  check('manifest icons 192+512', icons.some(i => /192/.test(i.sizes)) && icons.some(i => /512/.test(i.sizes)), JSON.stringify(icons.map(i => i.sizes)));
  for (const ic of icons) {
    const f = path.join(APP, ic.src.split('/').pop());
    check('icon file ' + ic.src, existsSync(f));
  }
}

// ---- 4. API surface cross-reference
const used = [...new Set([...html.matchAll(/\bAPI\.([A-Za-z_]\w*)/g)].map(m => m[1]))];
const exported = new Set([...apiJs.matchAll(/^\s{4}([A-Za-z_]\w*)\s*:\s*(function|[A-Za-z_$])/gm)].map(m => m[1]));
const missing = used.filter(u => !exported.has(u) && !['_timer', '_started'].includes(u));
check('API.* uses (' + used.join(',') + ') all exported', missing.length === 0, 'missing: ' + missing.join(','));

// ---- 5. render() dispatcher covers every nav() target
const navTargets = new Set();
for (const m of html.matchAll(/\bnav\(\s*'([a-z]+)'(?:\s*,\s*'([a-z]+)')?/gi)) navTargets.add(m[1] + (m[2] ? ':' + m[2] : ''));
// the render dispatcher uses if/else on page & page:sub — collect the quoted keys it compares
const dispKeys = new Set([...html.matchAll(/page\s*===?\s*'?([a-z]+)'?/gi)].map(m => m[1]));
// simpler: every nav target must appear somewhere in render() as a comparison string
const renderSrc = (html.match(/function render\(\)[\s\S]*?^}/m) || [''])[0];
const missingViews = [...navTargets].filter(t => {
  const page = t.split(':')[0];
  const sub = t.split(':')[1];
  if (!renderSrc.includes("'" + page + "'")) return true;
  return false;
});
check('nav() targets (' + navTargets.size + ') all in render()', missingViews.length === 0, 'missing: ' + missingViews.join(','));

// ---- 6. the 33 view functions exist
const expectedViews = ['loginPage','homePage','reportsPage','reportForm','reportView','lessonsPage','lessonForm','lessonView','peoplePage','personForm','morePage','attendancePage','sessionsPage','sessionForm','sessionView','notificationsPage','calendarPage','statsPage','quranPage','hadithPage','evaluationsPage','evalCriteriaPage','pointsPage','recognitionsPage','leaderboardPage','branchesPage','usersPage','approvalsPage','profilePage','settingsPage','aboutPage','aiAssistantPage','tasksPage','dailyTrackerPage','methodologiesPage','helpPage','globalSearchPage','exportAllPage'];
const missingFns = expectedViews.filter(fn => !new RegExp('function\\s+' + fn + '\\s*\\(').test(html));
check('view functions (' + expectedViews.length + ') all defined', missingFns.length === 0, 'missing: ' + missingFns.join(','));

// ---- 7. PWA head links
check('head: manifest link', /<link[^>]+manifest\.webmanifest/.test(html));
check('head: icon-192 link', /icon-192\.png/.test(html));
check('head: icon-512 link', /icon-512\.png/.test(html));
check('head: api.js before inline script', html.indexOf('js/api.js') > -1 && html.indexOf('js/api.js') < (inline[0] ? html.indexOf(inline[0].code.slice(0, 40)) : Infinity));
check('head: meta viewport', /<meta[^>]+name="viewport"/.test(html));
check('html dir=rtl lang=fa', /<html[^>]+dir="rtl"/.test(html) && /<html[^>]+lang="fa"/.test(html));
check('SW registration in init', /serviceWorker\.register/.test(html));

// ---- 8. sw.js precache covers the shell
const swPrecache = swJs.match(/['"][\/a-zA-Z0-9_.-]+\.?(?:html|js|webmanifest|png)['"]/g) || [];
for (const asset of ['index.html', 'js/api.js', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png']) {
  check('sw.js references ' + asset, swPrecache.some(s => s.includes(asset)));
}

// ---- 9. Persian byte integrity (no U+FFFD replacement chars)
for (const [name, txt, needPersian] of [['index.html', html, true], ['api.js', apiJs, false], ['sw.js', swJs, false]]) {
  const badChars = (txt.match(/\uFFFD/g) || []).length;
  const faOk = needPersian ? /گزارش|مربی|نهضت/.test(txt) : true;
  check(name + ' no U+FFFD' + (needPersian ? ' & has Persian' : ''), faOk && badChars === 0, 'FFFD=' + badChars);
}

// ---- 10. key hooks present (online layer wiring)
const hooks = ['API.push(\'report\'', 'API.push(\'lesson\'', 'API.push(\'person\'', 'API.push(\'attendance\'', 'API.push(\'session\'', 'API.push(\'task\'', 'API.push(\'tracker\'', 'API.push(\'evaluation\'', 'API.push(\'reportStatus\'', 'API.login(', 'API.register(', 'API.start(', 'API.remove(', 'API.patchPerson(', 'API.patchTask('];
const missingHooks = hooks.filter(h => !html.includes(h));
check('all ' + hooks.length + ' online hooks wired in index.html', missingHooks.length === 0, 'missing: ' + missingHooks.join(' | '));

// ---- 11. session title bug fix (v23 never saved title)
check('saveSession saves title (v23 bug fixed)', /title\s*:\s*t/.test(html) || /title:t/.test(html));

console.log('\n=== PWA STATIC: ' + pass + ' passed, ' + fail + ' failed ===');
process.exit(fail ? 1 : 0);
