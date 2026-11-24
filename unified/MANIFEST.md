# مانیفست بسته — Morabbi Unified

```yaml
manifest: morabbi-unified
version: "4.0.0"
product: "نهضت تربیتی حضرت سیدالشهدا (ع)"
language: fa
direction: rtl
unified_from:
  - "v2.0.0 (Next.js 16 + Prisma 6 + SQLite backend, 42 routes)"
  - "v23 (offline single-file app, 33 views, localStorage local-first)"
generated_for: D:\morabbi-unified
counts:
  server_files: 178        # excluding node_modules, .next, lockfiles, dev logs
  server_lines: 22871      # text files (ts/tsx/js/html/css/prisma/json/sh/kt/xml)
  api_route_files: 49      # 48 domain routes + generic /api
  pwa_files: 6
  pwa_lines: 3125
  android_files: 18
  android_lines: 585
components:
  server:
    type: "Next.js 16 (App Router) + Prisma 6 + SQLite"
    dev_port: 3015
    prod_port: 3000        # standalone
    db: "server/prisma/dev.db (SQLite, DATABASE_URL=file:./dev.db)"
    models: 24
    enums: 10
    routes: 48
    pwa:
      path: server/public/app
      index_html_lines: 2489
      api_js_lines: 531
      sw_js_lines: 86
      offline_storage: "localStorage morabbi_db_v23 + IndexedDB morabbi_sync_queue"
      session_keys: [morabbi_db_v23, morabbi_session_v23, morabbi_theme, morabbi_api_token]
    scripts:
      - "npm run db:push / db:seed / dev / build / start"
  android:
    type: "Kotlin WebView shell + resource-less APK"
    package: ir.nehzat.morabbi
    minSdk: 26
    targetSdk: 35
    version_name: "4.0.0"
    server_url: "https://morabbi.nehzat128.ir/app/index.html"
    buildable_here: true
    apk: build-apk/Morabbi-release.apk
    apk_signing: "v1 (jarsigner), morabbi-release.keystore, alias=morabbi"
  deploy:
    caddyfile: deploy/Caddyfile
    systemd: deploy/systemd/morabbi.service
    scripts: [deploy.sh, update.sh, backup.sh]
    domain: morabbi.nehzat128.ir
    install_path: /opt/morabbi
demo_accounts:
  - { role: ADMIN,      name: "مدیر سامانه",  phone: "09120000001", password: "567890" }
  - { role: INSTRUCTOR, name: "مربی نمونه",  phone: "09120000002", password: "112233" }
  - { role: EVALUATOR,  name: "ارزیاب نمونه", phone: "09120000003", password: "445566" }
integrity:
  sha256:
    server/public/app/index.html: "42c14527cf3a0e2cfa19dc7ee70973f3d91c8058a70184addec34392cc2163c9"
    server/public/app/js/api.js:  "cd70bdecf6a494bfebd084b0257e2c766a8795e59ee4ee17121be0cd5ce34eb1"
    build-apk/Morabbi-release.apk: "b539175445532cd8dcff7cd8ee27bb4f492ba3fbddd7c81f97d0314d6ee3abc8"
```

## محدودیت‌های شناخته‌شده

| # | محدودیت | توضیح |
|---|---|---|
| 1 | **احراز هویت raw-userId** | در `server/src/lib/session.ts` هدر `x-user-id` اگر 64 کاراکتر hex نباشد، مستقیم به‌عنوان `userId` پذیرفته می‌شود — هر کسی می‌تواند با `x-user-id: <id>` به داده‌های آن کاربر دسترسی کند. **باید قبل از انتشار عمومی بسته شود.** |
| 2 | **بدون عکس/دوربین** | PWA قابلیت photo capture ندارد (Caddyfile هم `Permissions-Policy: camera=()` می‌زند). |
| 3 | **افراد/حضور سراسری** | نماهای People/Attendance در PWA یکجا (global) هستند؛ فیلتر per-branch در UI اعمال نمی‌شود هرچند `Person.branchId` در schema موجود است. |
| 4 | **ورود محلی PENDING** | سمت سرور ورود کاربران `PENDING` رد می‌شود، ولی ورود محلی v23 در PWA `approvalStatus` را چک نمی‌کند — کاربر در انتظار تأیید می‌تواند محلی وارد شود (داده‌هایش sync نمی‌شود تا تأیید شود). |

## صحت فایل‌ها (integrity)

بررسی در هر خط:

```bash
sha256sum server/public/app/index.html server/public/app/js/api.js
# 42c14527cf3a0e2cfa19dc7ee70973f3d91c8058a70184addec34392cc2163c9  server/public/app/index.html
# cd70bdecf6a494bfebd084b0257e2c766a8795e59ee4ee17121be0cd5ce34eb1  server/public/app/js/api.js
```

یا با Node (ویندوز):

```js
require("crypto").createHash("sha256")
  .update(require("fs").readFileSync("server/public/app/index.html"))
  .digest("hex");
```

## سوابق تغییر (4.0.0)

- ادغام PWA v23 (۳۳ نما) روی بکند v2.0.0؛ حذف React SPA (redirect به `/app/index.html`)
- ۶ مدل جدید: `SessionMinutes`, `Person`, `AttendanceRecord`, `Task`, `DailyTracker`, `Methodology`
- ۷ مسیر جدید: `/api/people`, `/api/sessions`, `/api/tasks`, `/api/tracker`, `/api/methodologies`, `/api/reports/status`, `/api/lesson-plans/status`
- گشودن role gates (مثلاً POST گزارش: + EVALUATOR, BRANCH_MANAGER, SUPERVISOR)
- لایهٔ آنلاین `js/api.js` روی v23 (push/pull/queue) + `settings.serverUrl` زنده
- قاب اندروید `v4.0.0` روی `morabbi.nehzat128.ir`
