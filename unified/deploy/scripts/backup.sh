#!/usr/bin/env bash
# ============================================================
# backup.sh - Morabbi Unified v4.0.0 - بک‌آپ روزانه دیتابیس
#
# نصب به عنوان cron job:
#   sudo crontab -e
#   0 3 * * * /opt/morabbi/deploy/scripts/backup.sh
#
# مثال معادل با sqlite3 مستقیم:
#   0 3 * * * sqlite3 /opt/morabbi/server/prisma/dev.db ".backup /backups/morabbi-$(date +\%F).db"
# ============================================================
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/morabbi}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/morabbi}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
DB_FILE="$APP_DIR/server/prisma/dev.db"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

mkdir -p "$BACKUP_DIR"

echo "[$(date)] شروع بک‌آپ ..."

# ۱) بک‌آپ دیتابیس SQLite (آنلاین/سازگار با نوشت‌های همزمان)
if [[ -f "$DB_FILE" ]]; then
    sqlite3 "$DB_FILE" ".backup '$BACKUP_DIR/db_$TIMESTAMP.db'"
    echo "  دیتابیس: db_$TIMESTAMP.db"
fi

# ۲) بک‌آپ .env
if [[ -f "$APP_DIR/server/.env" ]]; then
    cp "$APP_DIR/server/.env" "$BACKUP_DIR/env_$TIMESTAMP"
    chmod 600 "$BACKUP_DIR/env_$TIMESTAMP"
    echo "  تنظیمات: env_$TIMESTAMP"
fi

# ۳) پاک کردن بک‌آپ‌های قدیمی
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
echo "  بک‌آپ‌های قدیمی‌تر از $RETENTION_DAYS روز حذف شدند"

# ۴) گزارش نهایی
SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
COUNT=$(find "$BACKUP_DIR" -type f | wc -l)
echo "[$(date)] بک‌آپ کامل شد | حجم کل: $SIZE | تعداد: $COUNT فایل"
