# AGENTS.md — Morabbi

مورابی = سامانهٔ تربیتی «نهضت تربیتی حضرت سیدالشهدا (ع)».

## پاسخ‌ها
- **همیشه به فارسی پاسخ بده.** قبل از هر ابزار/اقدام، یک خط `💭 فکر: ...` به فارسی بنویس.
- متن UI فارسی/RTL؛ شناسه‌های کد انگلیسی.

## استک رسمی (مهم)
| لایه | مسیر | پورت | توضیح |
|---|---|---|---|
| **بکند رسمی** | `backend/` | `:3010` | ASP.NET Core 10 (Clean Architecture) + EF Core + **SQL Server** (`Morabbi_Dev`). بکندی که `nehzat-plus` به آن وصل است. **قرآن (۶۲۳۶ آیه) + روایات (۱۷۱ رکورد) + جستجو فعال است.** |
| **فرانت رسمی** | `frontend/` | `:4210` | Angular 21 standalone (Vitest). صفحات قرآن/روایات با جستجوی سرورساید. |
| نسل یکپارچه (مرجع) | `unified/` | `:3015` | Next.js 16 + Prisma 6 + SQLite + PWA + قاب Android. **دیگر نسل فعال نیست** — مبدأ داده‌های اولیه و مرجع. |

> ⚠️ فرانت‌اند **Angular** و بکند **SQL Server** است — هر تغییری باید بر این استک باشد، نه unified.

## دستورات کلیدی
```bash
# بکند رسمی
cd backend
dotnet run                          # API روی :3010 (DB: Morabbi_Dev)
dotnet run --seed                   # drop + recreate + seed
cd tools/migrate-data && dotnet run # بازآفرینی قرآن/حدیث از unified SQLite (اختیاری)

# فرانت رسمی
cd frontend
npm install && npm start            # روی :4210
npx ng test                         # Vitest

# نسل یکپارچه (مرجع)
cd unified/server
npm install && npm run db:restore   # prisma/dev.db از dev.db.part1..5.zip (git-lfs)
npx next dev -p 3015                # PWA روی /app/index.html
```

## راهنماها
- **یکپارچگی با nehzat-plus**: [docs/INTEGRATION_ARCHITECTURE.md](docs/INTEGRATION_ARCHITECTURE.md).
- **نسل یکپارچه**: [unified/README.md](unified/README.md) + `unified/server/AGENTS.md`.
- ⚠️ [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) **نسل قدیمی** است — فقط تاریخچه.

## هشدارها (landmines)
- **داده‌های SQL Server در git نیست** — برای بازسازی کامل: `backend/tools/migrate-data` (منبع: `unified/server/prisma/dev.db`).
- `unified/server/prisma/dev.db` در git **نیست** — از `dev.db.part1..5.zip` (git-lfs, committed) بازسازی می‌شود. پس از تغییر بزرگ داده‌ای، **zip جدید را بساز، به ۵ تکه ۱۱ مگابایتی تقسیم کن و part‌ها را commit کن**.
- **جستجوی عمیق روایات** (`includeText=true`) روی ۲۳۱MB متن، ~۳۳-۶۰ ثانیه طول می‌کشد (LIKE full scan) — FTS روی این SQL Server نصب نیست.
- کلمهٔ `EF.Functions.Replace` در EF Core **وجود ندارد** (CS1929) — برای نرمال‌سازی عربی، داده را در حافظه فیلتر کن.
- keystore اندروید (`unified/android/morabbi-release.keystore`) عمداً committed است (dev، ریپوی خصوصی) — حذفش نکن؛ رمزها در `unified/android/README.md`.
- بکند `Server=.` در `appsettings.Development.json` = instance پیش‌فرض SQL Server روی همان دستگاه؛ برای دستگاه دیگر تنظیم شود.
- لاگ‌های dev (`*.log/*.out/*.err`) gitignore شده‌اند.
- `nehzat-plus` رپوی جدا در `D:\nehzat-plus` است — سورس بکند مورابی **فقط** همین ریپو است.
