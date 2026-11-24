# معماری — Morabbi Unified 4.0.0

## ۱) نمودار اجزا

```
                    ┌─────────────────────────────────────────────┐
                    │            سرور Next.js 16                  │
                    │                                             │
  ┌────────────┐    │  ┌───────────────────────────────────────┐  │
  │  مرورگر    │    │  │  /api/*  — 48 مسیر REST              │  │
  │  / PWA     │◄───┼──┤  (app router, route handlers)         │  │
  │  (install  │    │  └──────────────────┬────────────────────┘  │
  │  شده)      │    │                     ▼                       │
  └─────┬──────┘    │  ┌───────────────────────────────────────┐  │
        │           │  │  src/lib  (session, points, sync,     │  │
        │           │  │  notifications, push, templates ...)  │  │
        │           │  └──────────────────┬────────────────────┘  │
        │           │                     ▼                       │
        │           │  ┌───────────────────────────────────────┐  │
        │           │  │  Prisma 6 ── SQLite (prisma/dev.db)   │  │
        │           │  │  24 مدل                                │  │
        │           │  └───────────────────────────────────────┘  │
        │           │                                             │
        │           │  ┌───────────────────────────────────────┐  │
        │           │  │  public/app  — PWA (بدون build step)   │  │
        │           │  │  index.html + js/api.js + sw.js        │  │
        │           │  └───────────────────────────────────────┘  │
        │           └─────────────────────────────────────────────┘
        │  WebView (domStorageEnabled=true → localStorage ماندگار)
  ┌─────┴────────────┐
  │  Android shell   │  android/ — Kotlin, minSdk 26, v4.0.0
  │  ir.nehzat.morabbi│  SERVER_URL = https://morabbi.nehzat128.ir/app/index.html
  └──────────────────┘
```

رابط بین PWA و سرور **همان origin** است؛ `js/api.js` با `settings.serverUrl` (پیش‌فرض `location.origin`) می‌تواند به سرور دیگری هم اشاره کند.

## ۲) جریان داده (local-first + sync)

```
تغییر کاربر ──► localStorage (morabbi_db_v23)  ◄── منبعِ حقیقت همیشه
                   │
                   │  window.API.push(kind, payload, localId)
                   ▼
             REST POST (x-user-id: token)
                   │
        ┌──────────┴──────────┐
     موفق                  شکست/آفلاین
        │                       │
        ▼                       ▼
  sid روی ریکورد        صف IndexedDB (morabbi_sync_queue)
  محلی نوشته می‌شود        └─ flush در رویداد online + تایمر 60 ثانیه
                                              └─ پس از 8 تلاش حذف می‌شود
```

- **Push**: هر تغییر (report/lesson/person/attendance/session/task/tracker/evaluation/status) با `API.push` به سرور می‌رود. پاسخ سرور (`id`) به‌عنوان `sid` روی ریکورد محلی ذخیره می‌شود.
- **Queue**: اگر سرور/توکن در دسترس نباشد، آیتم `{qid, kind, payload, localId, ts, tries}` در IndexedDB می‌نشیند و `flushQueue()` آن‌ها را به ترتیب زمان می‌فرستد. خطای `UNIQUE/P1002` و 401 قدیمی → حذف از صف (نه retry).
- **Pull**: `API.pullAll()` هر ۶۰ ثانیه (و هنگام `online`) ۷ مسیر را می‌کشد: reports, lessons, people, tasks, tracker, notifications, methodologies. ادغام **بر پایه `sid`** است: ریکوردی که `sid` آن با `id` سرور برابر باشد آپدیت می‌شود، وگرنه با پیشوند `s` + id محلی اضافه می‌شود.
- **نگاشت وضعیت**: `DRAFT/SUBMITTED/APPROVED` دوطرفه یکسان؛ `REJECTED` (لوکال) ⇄ `RETURNED` (سرور)؛ `UNDER_REVIEW` (سرور) → `SUBMITTED` (لوکال).

### اسکیما localStorage v23

| کلید | محتوا |
|---|---|
| `morabbi_db_v23` | کل دیتابیس محلی: `users, branches, maktabs, reports, lessons, people, attendance, sessions, notifications, evaluations, criteria, points, recognitions, tasks, dailyTracker, methodologies, quran, hadith, settings{serverUrl,...}` |
| `morabbi_session_v23` | کاربر ورودکرده (اسم/نقش/تلفن/points + `serverId`, `serverBranchId`) |
| `morabbi_theme` | `light`/`dark` |
| `morabbi_api_token` | توکن سشن سرور (لایهٔ api.js) |

**`sid`** (server id) روی ریکوردهای `reports/lessons/people/sessions/tasks/notifications/methodologies` و `serverId` روی `users` نگهداری می‌شود — این کلیدهای پایدار، ادغام pull و نگاشت payloadها (instructorId/branchId محلی→سرور) را ممکن می‌سازند.

## ۳) احراز هویت (session-based)

- `POST /api/auth` با `{phone, password}` → بررسی bcrypt در `User.passwordHash` → ساخت سشن ۲۴ ساعته در جدول `sessions` (token = 32 بایت random hex) → بازگشت `{token, user}`.
- همهٔ requestهای بعدی: هدر **`x-user-id: <token>`** (نه `Authorization`).
- `getCurrentUser()` در `server/src/lib/session.ts`:

```ts
if (authHeader.length === 64 && /^[a-f0-9]+$/.test(authHeader)) {
  // جست‌وجو در جدول sessions + اعتبارسنجی expiresAt
} else {
  userId = authHeader;   // ⚠️ هر هدر غیر-hex به‌عنوان userId خام پذیرفته می‌شود
}
```

> **محدودیت شناخته‌شده**: هدری که 64 هگز نباشد، مستقیم به‌عنوان `userId` استفاده می‌شود — یعنی هر کسی با `x-user-id: <id-هرکاربری>` به داده‌های آن کاربر دسترسی دارد. این برای توسعهٔ سریع پذیرفته شده و **باید قبل از انتشار عمومی اصلاح شود** (حذف بازوی `else`).

- کاربران `PENDING`/`REJECTED` در سمت سرور **نمی‌توانند** وارد شوند؛ اما در PWA ورود محلی v23 هنوز آن‌ها را قبول می‌کند (محدودیت شناخته‌شده — ورود محلی بدون بررسی `approvalStatus`).

## ۴) قوانین امتیاز / ارزیابی / تقدیر

۹ قانون (منبع واحد: `server/src/lib/points.ts` → `POINT_RULES`):

| رویداد | امتیاز |
|---|---|
| ثبت گزارش | +5 |
| تأیید گزارش | +10 |
| ارزیابی گزارش عالی (≥۸۰٪) | +15 |
| ثبت طرح درس | +8 |
| تأیید طرح درس | +10 |
| ارزیابی طرح درس عالی (≥۸۰٪) | +20 |
| ثبت صورتجلسه | +3 |
| انجام تکلیف | +1 |
| هر آیتم برنامهٔ روزانه | +1 |

- امتیازها در `PointTransaction` ثبت و روی `User.totalPoints` جمع می‌شوند (transaction اتمیک در `awardPoints`).
- **تقدیر خودکار**: ارزیابی با درصد ≥۸۰ یک `Recognition` می‌سازد (`recognitionsCount++`). سطوح: WEEKLY_BRANCH, MONTHLY_BRANCH, MONTHLY_CENTRAL, SPECIAL.
- معیارهای ارزیابی وزنی (۱۴+۱۷ معیار v2.0.0 و ۱۲ معیار الگوی v23 در seed).

## ۵) ۳۳+ نما (گروه‌بندی بر پایهٔ تب‌ها)

تب‌های پایین (۵): `home` 🏠 / `reports` 📝 / `lessons` 📋 / `people` 👤 / `more`

| گروه | نما |
|---|---|
| اصلی | ورود، خانه/داشبورد، فهرست گزارش‌ها، فرم گزارش، مشاهدهٔ گزارش، فهرست طرح‌درس‌ها، فرم طرح درس، مشاهدهٔ طرح درس، افراد، فرم فرد |
| «بیشتر» | امکانات (منوی more)، حضور/غیاب، صورتجلسه (فهرست/فرم/مشاهده)، اطلاعیه، تقویم، آمار، قرآن، حدیث، ارزیابی‌ها، معیارها، امتیازها، تقدیرها، رتبه‌بندی، پروفایل، تنظیمات، درباره |
| v23 جدید | دستیار هوشمند 🤖، کارها، برنامهٔ روزانه 📿، روش‌ها، جستجوی کل 🔍، راهنما، خروجی همه 📦 |
| مدیر (ADMIN) | شعب/مکاتب، کاربران، تأیید ثبت‌نام |

فامیل کامل با توضیح تک‌خطی: [FEATURES.md](FEATURES.md)

## ۶) تفاوتهای نسخه

### نسبت به v2.0.0 (بکند)
| مورد | تغییر |
|---|---|
| React SPA | حذف شد؛ `src/app/page.tsx` فقط `redirect("/app/index.html")` است. کامپوننت‌های `src/components` در کدبیس مانده‌اند ولی UI اصلی PWA است. |
| PWA | جدید: `public/app/` (index.html + api.js + sw.js + manifest + آیکون‌ها) |
| مدل‌ها | ۶ مدل جدید: `SessionMinutes` (صورتجلسه)، `Person`، `AttendanceRecord`، `Task`، `DailyTracker`، `Methodology` → ۲۴ مدل |
| مسیرها | ۷ مسیر جدید: `/api/people`، `/api/sessions`، `/api/tasks`، `/api/tracker`، `/api/methodologies`، `/api/reports/status`، `/api/lesson-plans/status` → ۴۸ مسیر |
| role gates | گشوده‌تر: مثلاً POST گزارش در v2 فقط `INSTRUCTOR` بود؛ در v4: `INSTRUCTOR, INSTRUCTOR_ASSISTANT, EVALUATOR, BRANCH_MANAGER, SUPERVISOR, ADMIN` |
| seed | ۳ کاربر دمو v23 + معیارهای الگوی v23 + ۸ روش تدریس + مجموعهٔ آیات/روایات v23 |

### نسبت به v23 (اپ آفلاین)
| مورد | تغییر |
|---|---|
| اتصال سرور | `js/api.js` افزوده شد: login آنلاین، push تغییرات، صف آفلاین IndexedDB، pullAll هر ۶۰ ثانیه |
| `settings.serverUrl` | در v23 ثابت/بیکار بود؛ حالا **زنده** است (تنظیمات ← آدرس سرور، ذخیره در localStorage) |
| باگ عنوان صورتجلسه | اصلاح شد |
| بقیه | ۱۰۰٪ رفتار v23 حفظ شده؛ PWA حتی بدون سرور کامل کار می‌کند (حالت آفلاین) |

## ۷) فایل‌های کلیدی

| مسیر | نقش |
|---|---|
| `server/src/lib/session.ts` | سشن + `getCurrentUser` (شامل محدودیت raw-userId) |
| `server/src/lib/points.ts` | ۹ قانون امتیاز + `awardPoints` |
| `server/src/lib/sync.ts` | سرویس sync سمت سرور (reports/lessons pending) |
| `server/public/app/index.html` | کل PWA (۲۴۸۷ خط، بدون build) |
| `server/public/app/js/api.js` | لایهٔ آنلاین (`window.API`) |
| `server/public/app/sw.js` | Service Worker (shell cache + sync + push) |
| `server/prisma/schema.prisma` | ۲۴ مدل، ۱۰ enum |
| `server/scripts/seed.ts` | داده‌های اولیه + حساب‌های دمو |
