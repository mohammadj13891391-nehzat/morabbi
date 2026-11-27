# گزارش جلسه ۲۰۲۶-۱۱-۲۶ — وضعیت نهایی Morabbi

> این فایل گزارش وضعیت فعلی پروژه، قابلیت‌ها و نقاط بهبود برای جلسه‌های بعد است.

## ۱. معماری نهایی (استک رسمی)

| لایه | مسیر | تکنولوژی | پورت |
|------|------|-----------|-------|
| **بکند رسمی** | `backend/` | ASP.NET Core 10 + EF Core + **SQL Server** (`Morabbi_Dev`) | :3010 |
| **فرانت رسمی** | `frontend/` | **Angular 21** standalone | :4210 |
| مرجع/تاریخی | `unified/server` | Next.js 16 + Prisma + SQLite | :3015 |
| اندروید | `unified/android` | Kotlin WebView shell | — |

> ✅ مطابق تصمیم کاربر: فرانت = Angular، بکند = SQL Server. داده و جستجو به استک رسمی مهاجرت کرده‌اند.

## ۲. قابلیت‌های فعلی (همه تست‌شده)

### داده (SQL Server `Morabbi_Dev`)
- **قرآن کامل: ۶۲۳۶ آیه** (۱۱۴ سوره) — از Quranic Arabic Corpus
- **۹ کتاب حدیث: ۱۷۱ رکورد** (کافی، نهج‌البلاغه، نورالثقلین، علل‌الشرایع، سجادیه، غررالحکم، ثواب‌الاعمال، بحار/تحف‌العقول، بصائرالدرجات) — بدون آرتیفکت OCR
- اسکیمای جدید: `TextAr` (متن اصلی عربی) + `TextFa` (ترجمه/ساده‌شده، nullable) — migration `20261126173303_AddTextArTextFa`
- داده در git: `unified/server/prisma/dev.db.part1-5.zip` (۵ تکه ~۴۴MB، blob عادی) — با `npm run db:restore` در unified؛ برای SQL Server: `backend/tools/migrate-data` (dotnet run)

### جستجو (فعال)
- `GET /api/quran-verses/search?q=` — نرمال‌سازی عربی (حركات/همزه/الف‌وصل) + درون‌حافظه روی ۶۲۳۶ آیه — سریع
- `GET /api/hadiths/search?q=&includeText=` — مسیر سریع (Source/Narrator/Topic/TextFa) + **جستجوی عمیق** در متن (TextAr, ~33-60 ثانیه)
- `GET /api/quran-verses/{id}` و `GET /api/hadiths/{id}`
- paging با `skip`/`take` روی همه list endpoints
- تست‌ها: 20/20 search + 5/5 id-endpoints ✅

### فرانت Angular (:4210)
- صفحه‌های `quran-verses` و `hadiths`: جستجوی زنده debounce + checkbox «جستجوی عمیق در متن» + نمایش دو-زبانه + فرم‌های ویرایش با دو textarea
- CRUD کامل قرآن/حدیث برای admin/manager
- `api.service.ts`: ~۶۵ روش، توکن در localStorage، `hasRole()` case-insensitive

### احراز هویت
- بکند: LocalAuth HMAC (dev) + OIDC OTUH2 (production) — توکن `at+jwt`
- حساب‌های demo: `09120000001` admin / `09120000002` manager / `09120000003` branch_manager / `09120000004` evaluator / `09120000005` coach — همه `password123`
- CORS: :4210/:4201/:3010 ✅

## ۳. وضعیت push (تکمیل ✅)
- remote = local = `766fc40` — **همه روی GitHub**
- remote SSH: `git@github.com:mohammadj13891391-nehzat/morabbi.git` (HTTPS خراب بود — توکن GCM خالی؛ SSH با کلید `id_ed25519_nehzat` کار می‌کند)
- دیتابیس به‌صورت ۵ blob عادی ۱۱ مگابایتی push شد (LFS از S3 قطع می‌خورد؛ blob عادی ۱۱MB در این شبکه ~۴-۵ دقیقه)

## ۴. نقاط بهبود (به ترتیب اولویت)

| # | مورد | توضیح |
|---|------|-------|
| 1 | **🟠 کیفیت داده حدیث** | رکوردها جلد-محورند (هر جلد = ۱ رکورد تا ۳.۸MB). برای جستجوی دقیق‌تر: شکستن به روایات فردی + زنجیره راوی + شماره‌گذاری |
| 2 | **🟠 سرعت جستجوی عمیق حدیث** | `LIKE` روی ۲۳۱MB متن = 33-60s. FTS نصب نیست روی این SQL Server (Msg 7609). گزینه‌ها: نصب Full-Text Search / شکستن رکوردها / collation Persian |
| 3 | **🟠 حذف نسل قدیمی‌ها** | `unified/` دیگر مرجع داده نیست — تصمیم: حذف از repo یا نگه‌داشتن فقط به‌عنوان PWA/اندروید |
| 4 | **🟠 CI/CD** | workflow GitHub Actions در morabbi نیست (nehzat-plus دارد). build+test خودکار |
| 5 | **🟡 تست خودکار** | backend: 17 xUnit (قدیمی)؛ frontend: Vitest موجود. test جدید برای endpoints search اضافه شود |
| 6 | **🟡 Lint** | ۱۷ مشکل eslint موجود در unified (react-hooks و ...) |
| 7 | **🟡 امنیت** | رازهای LocalAuth/VAPID در appsettings → در production به env var |
| 8 | **🟡 حافظه git** | LFS objects قدیمی غیرمرجع در `.git/lfs/objects` (202MB + 44MB) — `git lfs prune` |
| 9 | **🟡 deploy** | `unified/deploy` (Caddy) اسکلتی؛ راهنمای deploy بکند رسمی ناقص |
| 10 | **🟢 docs فرسوده** | `docs/DEVELOPMENT_LOG.md` legacy (نسل قدیمی) — آرشیوشود |

## ۵. دستورات کلیدی

```bash
# بکند رسمی
cd D:\morabbi\backend
dotnet run                      # :3010
dotnet run --seed               # drop + recreate + seed
dotnet run --project tools/migrate-data   # import قرآن/حدیث از SQLite

# فرانت رسمی
cd D:\morabbi\frontend
npm start                       # :4210
npx ng test                     # Vitest

# unified (مرجع)
cd D:\morabbi\unified\server
npm run db:restore && npx next dev -p 3015
```

## ۶. تله‌ها و نکات
- **FTS نصب نیست** روی SQL Server این ماشین
- `EF.Functions.Replace` در EF Core وجود ندارد (CS1929) — نرمال‌سازی را در حافظه C# بکن
- `Server=.` در appsettings = instance پیش‌فرض SQL Server (مکان‌وابسته)
- kill بکند قبل از `dotnet build` (قفل DLL)
- شبکه: GitHub S3 (LFS) ≈10-24KB/s و قطع‌خور؛ blob عادی ≤۱۱MB موفق
- PowerShell: `Process::Start` با pipe stdout در ابزار timeout می‌خورد
