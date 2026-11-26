# AGENTS.md — Morabbi

مورابی = سامانهٔ تربیتی «نهضت تربیتی حضرت سیدالشهدا (ع)». این ریپو **سه نسل** محصول را هم‌زمان دارد؛ قبل از هر تغییری مشخص کن با کدام نسل کار داری.

## پاسخ‌ها
- **همیشه به فارسی پاسخ بده.** قبل از هر ابزار/اقدام، یک خط `💭 فکر: ...` به فارسی بنویس.
- متن UI فارسی/RTL؛ شناسه‌های کد انگلیسی.

## سه نسل (مهم — گم نکن)
| لایه | مسیر | پورت | توضیح |
|---|---|---|---|
| بکند legacy | `backend/` | `:3010` | ASP.NET Core + EF + SQL Server (`Morabbi_Dev`). بکندی که `nehzat-plus` به آن وصل است. |
| فرانت‌اند مجزا | `frontend/` | `:4210` | Angular 21 standalone (Vitest). |
| **نسل یکپارچه (فعال)** | `unified/` | `:3015` | Next.js 16 + Prisma 6 + SQLite + PWA + قاب Android. **اینجا جای کار فعلی است.** |

## راهنماها
- **نسل یکپارچه**: [unified/README.md](unified/README.md) + `unified/server/AGENTS.md` (قوانین اختصاصی server).
- **یکپارچگی با nehzat-plus**: [docs/INTEGRATION_ARCHITECTURE.md](docs/INTEGRATION_ARCHITECTURE.md).
- ⚠️ [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) **نسل قدیمی** است — فقط تاریخچه، نه مرجع فعلی.

## دستورات کلیدی (نسل یکپارچه)
```bash
cd unified/server
npm install
npm run db:restore          # prisma/dev.db از dev.db.zip (قرآن + حدیث کامل)
npx next dev -p 3015        # PWA روی /app/index.html
npm run lint                # eslint
npm run import:quran        # بازسازی قرآن از D:\nehzat-plus\Quran (اختیاری)
npm run import:hadith       # بازسازی حدیث از E:\بحارالانوار\5-کتاب‌های مرتبط (اختیاری)
```

## هشدارها (landmines)
- `unified/server/prisma/dev.db` در git **نیست** — از `dev.db.zip` (committed) بازسازی می‌شود. پس از تغییر بزرگ داده‌ای، **zip را بازمساخته و commit کن** تا کلون بعدی دادهٔ کامل داشته باشد.
- keystore اندروید (`unified/android/morabbi-release.keystore`) عمداً committed است (dev، ریپوی خصوصی) — حذفش نکن مگر اینکه جایگزین ارائه شود؛ رمزها در `unified/android/README.md`.
- بکند legacy `Server=.` در `appsettings.Development.json` = instance پیش‌فرض SQL Server روی همان دستگاه؛ برای دستگاه دیگر تنظیم شود.
- لاگ‌های dev (`*.log/*.out/*.err`) gitignore شده‌اند.
- `nehzat-plus` رپوی جدا در `D:\nehzat-plus` است — سورس بکند مورابی **فقط** همین ریپو است.
