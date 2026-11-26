# مورابی (Morabbi)

سامانهٔ تربیتی «نهضت تربیتی حضرت سیدالشهدا (ع)». این ریپو **سه نسل** از محصول را کنار هم دارد:

| لایه | مسیر | فناوری | پورت dev | وضعیت |
|---|---|---|---|---|
| **بکند اصلی (legacy)** | `backend/` | ASP.NET Core (Clean Architecture) + EF Core + SQL Server | `:3010` | فعال — بکندی است که `nehzat-plus` به آن وصل می‌شود |
| **فرانت‌اند مجزا** | `frontend/` | Angular 21 standalone + Vitest | `:4210` | فعال — SPA مستقل مورابی |
| **نسل یکپارچه (فعال)** | `unified/` | Next.js 16 + Prisma 6 + SQLite (PWA) + قاب اندروید | `:3015` | **نسل فعلی** — PWA آفلاین‌اول + ۴۸ مسیر REST + WebView Android |

> راهنمای کامل نسل یکپارچه: [unified/README.md](unified/README.md)
> معماری یکپارچگی با `nehzat-plus`: [docs/INTEGRATION_ARCHITECTURE.md](docs/INTEGRATION_ARCHITECTURE.md)

---

## شروع سریع — نسل یکپارچه (توصیه‌شده)

```bash
git clone https://github.com/mohammadj13891391-nehzat/morabbi.git
cd morabbi/unified/server

npm install
npm run db:restore          # بازسازی prisma/dev.db از dev.db.zip (قرآن + ۱۷۱ روایت حدیث)
cp .env.example .env        # مقادیر پیش‌فرض dev کافی‌اند
npx next dev -p 3015
```

- PWA: <http://localhost:3015/app/index.html>
- سلامت API: <http://localhost:3015/api/health>

پس از `db:restore`، **جستجو در قرآن و روایات بلافاصله فعال** است (۶۲۳۶ آیه + ۹ کتاب حدیث داخل zip هستند).

حساب‌های دمو: `09120000001`/`567890` (ADMIN)، `09120000002`/`112233` (INSTRUCTOR)، `09120000003`/`445566` (EVALUATOR).

### پیش‌نیازها
- **Node.js** (تست با Node 26؛ هر نسخه‌ای که `next dev` و `prisma` را بچرخاند کافی است)
- SQLite — داخلی است، نصب جداگانه ندارد
- (اختیاری) برای دستیار AI: `ZAI_BASE_URL`/`ZAI_API_KEY` در `.env` — بدون آن‌ها پاسخ‌ها rule-based آفلاین است

---

## بکند legacy (`backend/`) — ASP.NET Core :3010

```bash
cd backend
dotnet run            # API روی :3010 (DB: Morabbi_Dev)
```

**پیش‌نیاز**: .NET SDK 10 + **SQL Server** با دسترسی Windows Auth (instance پیش‌فرض).
> ⚠️ مقدار `Server=.` در `backend/src/EducationalPlatform.Morabbi.API/appsettings.Development.json` یعنی «instance پیش‌فرض SQL Server روی همان دستگاه». اگر instance شما فرق دارد، `ConnectionStrings:DefaultConnection` را تنظیم کنید. بقیهٔ مقادیر آن فایل (LocalAuth secret، VAPID keys) صرفاً dev هستند.

این بکند، بکندی است که اپلیکیشن `nehzat-plus` (رپوی جدا در `D:\nehzat-plus`) از طریق `MorabbiApiService` به آن وصل می‌شود؛ جزئیات: [docs/INTEGRATION_ARCHITECTURE.md](docs/INTEGRATION_ARCHITECTURE.md).

## فرانت‌اند مجزا (`frontend/`) — Angular :4210

```bash
cd frontend
npm install
npm start             # روی :4210
```

## قاب اندروید (`unified/android/`)

WebView باریک Kotlin که PWA را می‌بندد. ساخت **فقط در Android Studio** (Gradle wrapper در ریپو نیست). راهنمای کامل + رمز keystore: [unified/android/README.md](unified/android/README.md).

> `unified/android/morabbi-release.keystore` عمداً در ریپو مانده است: این یک keystore **dev** برای ریپوی خصوصی است و بدون آن، همکار نمی‌تواند APK release با امضای هم‌خوان build کند؛ رمزهای آن در همان README اندروید مستند شده است.

---

## نکات برای همکار

- **`docs/DEVELOPMENT_LOG.md` مربوط به نسل قدیمی (Next.js نسل اول) است** — به‌عنوان تاریخچه بخوانید، نه راهنمای فعلی.
- دیتابیس dev (`unified/server/prisma/dev.db`) در git نیست و از `dev.db.zip` بازسازی می‌شود؛ پس از هر تغییر بزرگ داده‌ای، zip را بازمساخته و commit کنید تا کلون بعدی دادهٔ کامل داشته باشد.
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
