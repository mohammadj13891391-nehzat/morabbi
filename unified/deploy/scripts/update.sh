#!/usr/bin/env bash
# ============================================================
# update.sh - Morabbi Unified v4.0.0 - آپدیت با قطعی حداقل
#
# استفاده:
#   sudo /opt/morabbi/deploy/scripts/update.sh
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/morabbi}"
APP_USER="${APP_USER:-www-data}"
DB_URL="file:$APP_DIR/server/prisma/dev.db"

cd "$APP_DIR/server"

echo "[$(date)] ۱) Pull آخرین تغییرات ..."
if [[ -d .git ]]; then
    sudo -u "$APP_USER" git pull --ff-only
fi

echo "[$(date)] ۲) نصب وابستگی‌ها ..."
sudo -u "$APP_USER" npm install

echo "[$(date)] ۳) Build نسخه جدید (standalone) ..."
sudo -u "$APP_USER" npm run build

echo "[$(date)] ۴) به‌روزرسانی schema دیتابیس (prisma db push) ..."
sudo -u "$APP_USER" env "DATABASE_URL=$DB_URL" npx prisma db push --accept-data-loss --schema prisma/schema.prisma

echo "[$(date)] ۵) ری‌استارت سرویس ..."
systemctl restart morabbi
sleep 3

echo "[$(date)] ۶) تست سلامت ..."
if curl -sS -o /dev/null -w "%{http_code}" http://localhost:3000/api/health | grep -q "200"; then
    echo "آپدیت با موفقیت انجام شد"
    systemctl status morabbi --no-pager | head -5
else
    echo "خطا: سرور پاسخ نمی‌دهد! لاگ را بررسی کنید:"
    echo "   journalctl -u morabbi -n 50 --no-pager"
    exit 1
fi
