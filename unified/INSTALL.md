# راهنمای نصب — Morabbi Unified 4.0.0

## پیش‌نیازها

| ابزار | نسخه | ضرورت |
|---|---|---|
| Node.js | ۲۲+ (LTS پیشنهادی؛ ۲۰ برای سرور کار می‌کند ولی seed نیاز به ۲۲.۶+ دارد) | ✅ |
| Android Studio | هر نسخه با AGP 8.7 | فقط برای ساخت APK |
| Caddy | stable | فقط برای استقرار تولید |

> در ویندوز با PowerShell 5.1 همهٔ دستورات زیر کار می‌کنند. `npm install` ممکن است چند دقیقه طول بکشد — اگر آویزان به نظر رسید، در پس‌زمینه در حال دانلود است؛ صبر کنید.

## ۱) بکند

```bash
cd server
npm install
npm run db:push        # Prisma: ساخت/به‌روزرسانی schema روی SQLite (prisma/dev.db)
npm run db:seed        # = node --experimental-strip-types scripts/seed.ts
npx next dev -p 3015   # سرور توسعه روی پورت 3015
```

توضیحات:
- `dev`ِ تعریف‌شده در `package.json` پورت 3000 را می‌زند؛ پورت رسمی این پروژه **3015** است (جلوگیری از تداخل با سرورهای دیگر مورابی روی 3000 و 3010).
- دیتابیس: SQLite روی `server/prisma/dev.db` (متغیر `DATABASE_URL="file:./dev.db"` در `server/.env`).
- seed: ۴ مکتب، ۶ شعبه، ۴۷ معیار ارزیابی، ۸ روش تدریس، ۳۳ آیه، ۲۳ روایت و ۳ کاربر دمو.

### بررسی سلامت

```
http://localhost:3015/api/health      # {"status":"ok",...}
http://localhost:3015/app/index.html  # PWA
http://localhost:3015/                # ریدایرکت خودکار به /app/index.html
```

تست E2E اختیاری (سرور باید بالا باشد):

```bash
node scripts/e2e-test.mjs   # خروجی: ALL E2E TESTS PASSED
```

## ۲) PWA در مرورگر

1. <http://localhost:3015/app/index.html> را باز کنید.
2. با یکی از حساب‌های دمو وارد شوید (جدول در [README.md](README.md)).
3. در Chrome/Edge: آیکون «نصب» در نوار آدرس → **Install app**. روی اندروید: منوی مرورگر → «Add to Home screen».
4. Service Worker خودکار ثبت می‌شود؛ اپ بعد از نصب کاملاً آفلاین باز می‌شود (داده‌ها از `localStorage`).

نکته: اولین ورود «آنلاین» باید موفق باشد تا توکن سشن ذخیره شود؛ تا آن زمان همهٔ داده‌ها محلی‌اند و آفلاین می‌مانند.

## ۳) قاب اندروید

برای ساخت APK به [android/README.md](android/README.md) بروید (Android Studio، `gradle :app:assembleRelease`). قاب روی `https://morabbi.nehzat128.ir/app/index.html` (تولید) یا `http://10.0.2.2:3015/app/index.html` (امولاتور، با `IS_DEV=true`) لود می‌شود.

## ۴) استقرار تولید

به [DEPLOY.md](DEPLOY.md) بروید — خلاصه:

```bash
cd server && npm run build   # Next standalone + کپی static/public
# کپی .next/standalone + prisma به سرور، Caddy + systemd (فایل‌ها در deploy/)
```

داربست آماده در پوشهٔ `deploy/` (Caddyfile، `morabbi.service`، `deploy.sh`/`update.sh`/`backup.sh`).

## رفع مشکلات رایج

| مشکل | راه‌حل |
|---|---|
| `EADDRINUSE` / پورت گرفته | 3015 را در اختیار این پروژه بگذارید. 3000 و 3010 متعلق به نسخه‌های دیگر مورابی‌اند — استفاده نکنید. با `npx next dev -p <پورت>` پورت را عوض کنید و در PWA (تنظیمات → آدرس سرور) هم همان را بگذارید. |
| فارسی‌نویسی در کنسول/لاگ به‌هم می‌ریزد | کنسول ویندوز/PowerShell نمایش UTF-8 را درست انجام نمی‌دهد. **بايت‌ها را بازنویسی نکنید**؛ صحت با Node چک کنید: `node -e "console.log(require('fs').readFileSync('server/scripts/seed.ts','utf8').includes('نهضت'))"` → `true`. |
| `npm install` آویزان | در پس‌زمینه اجرا می‌شود (log در `npm-install.log`). اگر واقعاً گیر کرد: `npm cache clean --force` و تکرار. |
| `npm run db:seed` خطای `--experimental-strip-types` | Node شما زیر ۲۲.۶ است. یا Node را به ۲۲+ ارتقا دهید یا با `npx tsx scripts/seed.ts` اجرا کنید. |
| PWA به سرور وصل نمی‌شود | آدرس سرور را در **تنظیمات ← آدرس سرور** PWA بگذارید (پیش‌فرض = همان origin). پورت/پروتکل را کامل بنویسید. |
| داده‌ها بعد از پاک‌شدن مرورگر نیستند | داده‌های PWA در `localStorage` همان origin هستند؛ حذف داده‌های سایت یا استفاده از پنجرهٔ ناشناس آن‌ها را می‌زند. قبل از پاک‌سازی، از **تنظیمات ← خروجی بک‌آپ** بگیرید. |
| `P1002` (duplicate) هنگام sync | طبیعی است — ریکورد از قبل روی سرور موجود است؛ لایهٔ sync آن را نادیده می‌گیرد. |
