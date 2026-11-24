# داربست استقرار — Morabbi Unified 4.0.0

| فایل | کاربرد |
|---|---|
| `Caddyfile` | reverse proxy `morabbi.nehzat128.ir` → `localhost:3000` (standalone) + HTTPS خودکار |
| `systemd/morabbi.service` | اجرای دائمی `node .next/standalone/server.js` |
| `scripts/deploy.sh` | استقرار یک‌دست از صفر (Node + Caddy + build + seed + systemd + UFW) |
| `scripts/update.sh` | آپدیت (build + db push + restart + health) |
| `scripts/backup.sh` | بک‌آپ روزانه SQLite + retention ۳۰ روز |

راهنمای کامل: [../DEPLOY.md](../DEPLOY.md)
