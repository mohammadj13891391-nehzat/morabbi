# مورابی (Morabbi)

سامانهٔ تربیتی «نهضت تربیتی حضرت سیدالشهدا (ع)».

> **استک رسمی**: بکند **ASP.NET Core + SQL Server** (`backend/`) + فرانت‌اند **Angular** (`frontend/`).
> دادهٔ کامل **قرآن (۶۲۳۶ آیه)** و **۹ کتاب حدیث (۱۷۱ روایت)** در دیتابیس SQL Server بارگذاری شده و **جستجو در قرآن و روایات فعال** است.

| لایه | مسیر | فناوری | پورت dev | وضعیت |
|---|---|---|---|---|
| **بکند رسمی** | `backend/` | ASP.NET Core (Clean Architecture) + EF Core + **SQL Server** | `:3010` | **فعال — استک اصلی** (قرآن + حدیث + جستجو) |
| **فرانت رسمی** | `frontend/` | Angular 21 standalone + Vitest | `:4210` | **فعال — SPA اصلی** |
| نسل یکپارچه | `unified/` | Next.js 16 + Prisma + SQLite (PWA) + WebView | `:3015` | مرجع/تاریخی — مبدأ داده‌های اولیه |

> ⚠️ `unified/` دیگر «نسل فعال» نیست؛ داده‌ها به استک رسمی (SQL Server) مهاجرت کرده‌اند. جزئیات: [unified/README.md](unified/README.md)
> معماری یکپارچگی با `nehzat-plus`: [docs/INTEGRATION_ARCHITECTURE.md](docs/INTEGRATION_ARCHITECTURE.md)

---

## شروع سریع — استک رسمی (توصیه‌شده)

### ۱. بکند (:3010)

```bash
cd backend
dotnet run            # API روی :3010 — DB: Morabbi_Dev
```

**پیش‌نیاز**: .NET SDK 10 + **SQL Server** (Windows Auth, instance پیش‌فرض).
- دیتابیس `Morabbi_Dev` هنگام استارت به‌صورت خودکار ساخته/مهاجرت می‌شود.
- برای بازآفرینی کامل + seed: `dotnet run --seed`
- برای بارگذاری مجدد قرآن/حدیث از منبع SQLite (unified): `dotnet run --project tools/migrate-data`

> ⚠️ مقدار `Server=.` در `backend/src/EducationalPlatform.Morabbi.API/appsettings.Development.json` یعنی «instance پیش‌فرض SQL Server روی همان دستگاه». اگر instance شما فرق دارد، `ConnectionStrings:DefaultConnection` را تنظیم کنید. بقیهٔ مقادیر آن فایل (LocalAuth secret، VAPID keys) صرفاً dev هستند.

### ۲. فرانت‌اند (:4210)

```bash
cd frontend
npm install
npm start             # روی :4210
```

**پیش‌نیاز**: Node.js (تست با Node 26).

- SPA: <http://localhost:4210>
- صفحات **قرآن** و **روایات** دارای **جستجوی سرورساید** هستند (روایات: دکمهٔ «جستجوی عمیق» برای جستجو در متن کامل).

### حساب‌های دمو (بکند)
`09120000001`/`password123` (admin)، `09120000002`/`password123` (manager)، `09120000003`/`password123` (branch_manager)، `09120000004`/`password123` (evaluator)، `09120000005`/`password123` (coach).

### سلامت API
`GET http://localhost:3010/api/health` → `{status:"ok",service:"morabbi"}`

---

## داده‌ها: قرآن و روایات

- **قرآن**: ۶۲۳۶ آیه، ۱۱۴ سوره (متن عثمانی + ساده‌شده). جدول `Morabbi_quran_verses` با فیلدهای `TextAr` (عثمانی) + `TextFa` (ساده‌شده).
- **روایات**: ۱۷۱ روایت از ۹ کتاب (کافی، نهج‌البلاغه، نورالثقلین، علل‌الشرایع، سجادیه، غررالحکم، ثواب‌الاعمال، تحف‌العقول، بصائرالدرجات). جدول `Morabbi_hadiths` با `TextAr` + `TextFa`.
- **جستجو**:
  - `GET /api/quran-verses/search?q=` — نرمال‌سازی عربی (تشدید/همزه) + جستجو در متن عربی/ساده‌شده/سوره/موضوع
  - `GET /api/hadiths/search?q=&includeText=` — سریع (متادیتا) یا `includeText=true` برای متن کامل

### ابزار مهاجرت داده
`backend/tools/migrate-data` — از SQLite (unified) به SQL Server:
```bash
cd backend/tools/migrate-data
dotnet run            # پیش‌فرض: D:\morabbi\unified\server\prisma\dev.db → Morabbi_Dev
```

---

## نسل یکپارچه (`unified/`) — مرجع

```bash
cd unified/server
npm install
npm run db:restore    # بازسازی prisma/dev.db از dev.db.part1..5.zip (git-lfs)
cp .env.example .env
npx next dev -p 3015
```
- PWA: <http://localhost:3015/app/index.html>

## قاب اندروید (`unified/android/`)

WebView باریک Kotlin که PWA را می‌بندد. ساخت **فقط در Android Studio** (Gradle wrapper در ریپو نیست). راهنمای کامل + رمز keystore: [unified/android/README.md](unified/android/README.md).

> `unified/android/morabbi-release.keystore` عمداً در ریپو مانده است: این یک keystore **dev** برای ریپوی خصوصی است و بدون آن، همکار نمی‌تواند APK release با امضای هم‌خوان build کند؛ رمزهای آن در همان README اندروید مستند شده است.

---

## نکات برای همکار

- **`docs/DEVELOPMENT_LOG.md` مربوط به نسل قدیمی (Next.js نسل اول) است** — به‌عنوان تاریخچه بخوانید، نه راهنمای فعلی.
- دیتابیس dev (`unified/server/prisma/dev.db`) در git نیست و از `dev.db.part1..5.zip` (git-lfs) بازسازی می‌شود؛ `npm run db:restore` تکه‌ها را یکپارچه می‌کند.
- داده‌های SQL Server (`Morabbi_Dev`) در git نیست؛ برای بازسازی کامل از `backend/tools/migrate-data` استفاده کنید (منبع: `unified/server/prisma/dev.db`).
- لاگ‌های dev (`*.log`، `*.out`، `*.err`) gitignore شده‌اند و نباید commit شوند.

## ساختار مستندات

| فایل | محتوا |
|---|---|
| [unified/README.md](unified/README.md) | راهنمای کامل نسل یکپارچه (v4.0.0) |
| [unified/INSTALL.md](unified/INSTALL.md) | نصب کامل + رفع مشکل |
| [unified/ARCHITECTURE.md](unified/ARCHITECTURE.md) | معماری، احراز هویت، قانون امتیازها |
| [unified/DEPLOY.md](unified/DEPLOY.md) | استقرار تولید (Caddy + systemd + APK) |
| [docs/INTEGRATION_ARCHITECTURE.md](docs/INTEGRATION_ARCHITECTURE.md) | یکپارچگی با nehzat-plus |
| [docs/DEVELOPMENT_LOG.md](docs/DEVELOPMENT_LOG.md) | ⚠️ نسل قدیمی — فقط تاریخچه |
