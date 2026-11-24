# استقرار تولید — Morabbi Unified 4.0.0

دامنهٔ تولید: **`morabbi.nehzat128.ir`** (همان `SERVER_URL` قاب اندروید).
محل نصب روی سرور: **`/opt/morabbi`** (کد در `/opt/morabbi/server`).

## ۱) Build (standalone)

```bash
cd server
npm run build
```

`next.config.ts` دارای `output: "standalone"` است و اسکریپت build همین کارها را می‌کند:

```bash
next build && cp -r .next/static .next/standalone/.next/ && cp -r public .next/standalone/
```

خروجی قابل اجرا: `server/.next/standalone/server.js` (شامل `public/app` — PWA داخل standalone است).

> `cp` در ویندوز با Git-Bash/MSYS کار می‌کند؛ روی لینوکس عادی است. اگر `public` را دستی کپی کردید، `standalone/public/app/index.html` باید وجود داشته باشد.

## ۲) انتقال به سرور

```bash
scp -r server/.next/standalone/ root@VPS:/opt/morabbi/server/.next/standalone/
scp -r server/prisma root@VPS:/opt/morabbi/server/
scp -r server/scripts root@VPS:/opt/morabbi/server/   # برای seed
scp -r deploy root@VPS:/opt/morabbi/deploy
```

`node_modules` و `.next` (غیر از standalone) لازم **نیستند** (standalone خودش `node_modules` مینیمال دارد).

## ۳) دیتابیس

```bash
cd /opt/morabbi/server
export DATABASE_URL="file:/opt/morabbi/server/prisma/dev.db"
npx prisma generate --schema prisma/schema.prisma   # فقط اگر client standalone کامل نیست
npx prisma db push --accept-data-loss --schema prisma/schema.prisma
node --experimental-strip-types scripts/seed.ts     # یا: npx tsx scripts/seed.ts (Node 22+)
```

## ۴) Caddy (HTTPS خودکار + reverse proxy)

فایل آماده: [`deploy/Caddyfile`](deploy/Caddyfile) — reverse proxy `morabbi.nehzat128.ir` → `localhost:3000` (پورت standalone):

```
morabbi.nehzat128.ir {
    email admin@nehzat128.ir        # برای اطلاع‌رسانی انقضای گواهی

    log {
        output file /var/log/caddy/morabbi-access.log { roll_size 10mb roll_keep 10 }
        format json
    }

    request_body { max_size 50MB }
    encode gzip zstd

    header {
        Strict-Transport-Security "max-age=31536000; includeSubDomains; preload"
        X-Content-Type-Options "nosniff"
        X-Frame-Options "SAMEORIGIN"
        Referrer-Policy "strict-origin-when-cross-origin"
        Access-Control-Allow-Origin "*"
        Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Access-Control-Allow-Headers "Content-Type, Authorization, x-user-id"
        -Server
    }

    @options method OPTIONS
    handle @options {
        header Access-Control-Max-Age "86400"
        respond 204
    }

    handle /api/* {
        reverse_proxy localhost:3000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
            transport http { read_timeout 120s write_timeout 120s dial_timeout 10s }
        }
    }

    handle {
        reverse_proxy localhost:3000 {
            header_up Host {host}
            header_up X-Real-IP {remote_host}
            header_up X-Forwarded-For {remote_host}
            header_up X-Forwarded-Proto {scheme}
        }
    }
}
```

نصب:

```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
sudo cp deploy/Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

## ۵) systemd

فایل آماده: [`deploy/systemd/morabbi.service`](deploy/systemd/morabbi.service):

```ini
[Unit]
Description=Morabbi Unified Production Server (Next.js standalone)
Documentation=https://morabbi.nehzat128.ir
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/morabbi/server
ExecStart=/usr/bin/node /opt/morabbi/server/.next/standalone/server.js
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
Environment=DATABASE_URL=file:/opt/morabbi/server/prisma/dev.db
Restart=always
RestartSec=5
TimeoutStopSec=30
StandardOutput=journal
StandardError=journal
SyslogIdentifier=morabbi
LimitNOFILE=65536
ProtectSystem=strict
PrivateTmp=true
ReadWritePaths=/opt/morabbi/server/prisma /var/log/caddy

[Install]
WantedBy=multi-user.target
```

فعال‌سازی:

```bash
sudo cp deploy/systemd/morabbi.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now morabbi
sudo journalctl -u morabbi -f
```

## ۶) اسکریپت‌های کمکی (deploy/)

| اسکریپت | کاربرد |
|---|---|
| `deploy/scripts/deploy.sh` | استقرار یک‌دست از صفر (Node + Caddy + کپی + build + seed + systemd + Caddyfile + UFW) — `sudo DOMAIN=morabbi.nehzat128.ir EMAIL=admin@nehzat128.ir bash deploy.sh` |
| `deploy/scripts/update.sh` | آپدیت: build جدید + `prisma db push` + ری‌استارت + تست سلامت |
| `deploy/scripts/backup.sh` | بک‌آپ روزانهٔ SQLite + `.env`، retention ۳۰ روز |

## ۷) بک‌آپ دیتابیس (cron)

```bash
sudo crontab -e
0 3 * * * sqlite3 /opt/morabbi/server/prisma/dev.db ".backup /backups/morabbi-$(date +\%F).db"
```

یا با اسکریپت آماده: `0 3 * * * /opt/morabbi/deploy/scripts/backup.sh`

## ۸) APK اندروید

```
android/  →  Android Studio  →  Build → Build APK(s)  →  امضا (keystore)  →  توزیع
```

- نسخه: `versionName = "4.0.0"` در `android/app/build.gradle.kts`
- `SERVER_URL` از پیش روی `https://morabbi.nehzat128.ir/app/index.html` است
- راهنمای کامل (امولاتور، امضا، Play): [android/README.md](android/README.md)

## ۹) تست پس از استقرار

```bash
curl -sS https://morabbi.nehzat128.ir/api/health                 # 200
curl -sS -o /dev/null -w "%{http_code}\n" https://morabbi.nehzat128.ir/app/index.html   # 200
curl -sS -X POST https://morabbi.nehzat128.ir/api/auth \
     -H 'Content-Type: application/json' \
     -d '{"phone":"09120000001","password":"567890"}'            # token + user
```

| مورد | آدرس |
|---|---|
| PWA | `https://morabbi.nehzat128.ir/app/index.html` |
| API | `https://morabbi.nehzat128.ir/api` |
| سلامت | `https://morabbi.nehzat128.ir/api/health` |

## 10) فایروال

```bash
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw --force enable
```

> ⚠️ یادآوری امنیتی: قبل از انتشار عمومی، محدودیت raw-`userId` در `server/src/lib/session.ts` (هدر `x-user-id` غیر-64-هگز به‌عنوان userId) **باید بسته شود** — جزئیات در [ARCHITECTURE.md](ARCHITECTURE.md) §۳.
