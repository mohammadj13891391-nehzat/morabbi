#!/usr/bin/env bash
# ============================================================
# deploy.sh - Morabbi Unified v4.0.0
# استقرار خودکار روی VPS لینوکس (Ubuntu 22.04+ / Debian 12+)
#
# استفاده:
#   1) کل پروژه (server/ + deploy/) را روی سرور کپی کنید
#   2) chmod +x deploy.sh
#   3) sudo DOMAIN=morabbi.nehzat128.ir EMAIL=admin@nehzat128.ir ./deploy.sh
# ============================================================
set -euo pipefail

# --- متغیرها (با اولویت آرگومان‌های محیطی) ---
DOMAIN="${DOMAIN:-morabbi.nehzat128.ir}"
EMAIL="${EMAIL:-admin@nehzat128.ir}"
APP_DIR="${APP_DIR:-/opt/morabbi}"
APP_USER="${APP_USER:-www-data}"
NODE_VERSION="${NODE_VERSION:-22}"
DEPLOY_DIR="$(cd "$(dirname "$0")/.." && pwd)"      # .../deploy
PROJECT_ROOT="$(cd "$DEPLOY_DIR/.." && pwd)"        # ریشهٔ morabbi-unified
SERVER_DIR="$PROJECT_ROOT/server"

# --- رنگ‌ها ---
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
log()   { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERR]${NC} $*" >&2; }
step()  { echo -e "\n${BLUE}=== $* ===${NC}"; }

if [[ $EUID -ne 0 ]]; then
    error "این اسکریپت باید با sudo اجرا شود"
    exit 1
fi

step "۱) نصب پیش‌نیازها (Node.js, Caddy, ابزارها)"
export DEBIAN_FRONTEND=noninteractive

if ! command -v node &>/dev/null; then
    log "نصب Node.js $NODE_VERSION ..."
    curl -fsSL "https://deb.nodesource.com/setup_$NODE_VERSION.x" | bash -
    apt-get install -y nodejs
fi
log "Node: $(node -v) | npm: $(npm -v)"

if ! command -v caddy &>/dev/null; then
    log "نصب Caddy ..."
    apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
    curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list
    apt-get update
    apt-get install -y caddy
fi
log "Caddy: $(caddy version)"

apt-get install -y git unzip ufw fail2ban sqlite3

step "۲) ساخت کاربر و مسیر برنامه"
if ! id "$APP_USER" &>/dev/null; then
    useradd --system --no-create-home --shell /usr/sbin/nologin "$APP_USER"
    log "کاربر $APP_USER ساخته شد"
fi
mkdir -p "$APP_DIR/server" "$APP_DIR/deploy" "$APP_DIR/logs"
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

step "۳) کپی کد به $APP_DIR"
rsync -av --exclude 'node_modules' --exclude '.next' --exclude '*.log' \
      "$SERVER_DIR/" "$APP_DIR/server/" 2>/dev/null || \
    cp -r "$SERVER_DIR"/. "$APP_DIR/server/" 2>/dev/null || true
rsync -av "$DEPLOY_DIR/" "$APP_DIR/deploy/" 2>/dev/null || \
    cp -r "$DEPLOY_DIR"/. "$APP_DIR/deploy/" 2>/dev/null || true
chown -R "$APP_USER":"$APP_USER" "$APP_DIR"

step "۴) نصب وابستگی‌ها و build standalone"
sudo -u "$APP_USER" bash <<EOS
cd "$APP_DIR/server"
npm install
npm run build
EOS
log "build کامل شد → $APP_DIR/server/.next/standalone/"

step "۵) دیتابیس (Prisma + Seed)"
sudo -u "$APP_USER" bash <<EOS
cd "$APP_DIR/server"
export DATABASE_URL="file:$APP_DIR/server/prisma/dev.db"
npx prisma generate --schema prisma/schema.prisma
npx prisma db push --accept-data-loss --schema prisma/schema.prisma
node --experimental-strip-types scripts/seed.ts || npx tsx scripts/seed.ts || true
EOS
chown -R "$APP_USER":"$APP_USER" "$APP_DIR/server/prisma"
log "دیتابیس در $APP_DIR/server/prisma/dev.db"

step "۶) ساخت فایل .env"
cat > "$APP_DIR/server/.env" <<EOF
DATABASE_URL="file:$APP_DIR/server/prisma/dev.db"
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
EOF
chown "$APP_USER":"$APP_USER" "$APP_DIR/server/.env"
chmod 600 "$APP_DIR/server/.env"

step "۷) نصب سرویس systemd"
cat > /etc/systemd/system/morabbi.service <<EOF
[Unit]
Description=Morabbi Unified Production Server (Next.js standalone)
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=$APP_USER
Group=$APP_USER
WorkingDirectory=$APP_DIR/server
ExecStart=/usr/bin/node $APP_DIR/server/.next/standalone/server.js
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=0.0.0.0
Environment=DATABASE_URL=file:$APP_DIR/server/prisma/dev.db
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=morabbi
LimitNOFILE=65536
ProtectSystem=strict
PrivateTmp=true
ReadWritePaths=$APP_DIR/server/prisma

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable morabbi
systemctl restart morabbi
sleep 3
log "وضعیت سرویس:"
systemctl status morabbi --no-pager || true

step "۸) پیکربندی Caddy با HTTPS خودکار"
CADDYFILE="/etc/caddy/Caddyfile"
mv "$CADDYFILE" "$CADDYFILE.bak" 2>/dev/null || true
cp "$APP_DIR/deploy/Caddyfile" "$CADDYFILE"
sed -i "s/morabbi.nehzat128.ir/$DOMAIN/g" "$CADDYFILE"
sed -i "s/email admin@nehzat128.ir/email $EMAIL/" "$CADDYFILE"

systemctl restart caddy
sleep 5
log "وضعیت Caddy:"
systemctl status caddy --no-pager | head -20 || true

step "۹) فایروال (UFW)"
ufw allow 22/tcp    comment 'SSH'
ufw allow 80/tcp    comment 'HTTP'
ufw allow 443/tcp   comment 'HTTPS'
ufw --force enable
log "فایروال فعال شد"

step "۱۰) تست نهایی"
sleep 5
log "تست محلی (localhost:3000):"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/api/health || warn "سرور هنوز بالا نیامده"

log "تست PWA (localhost:3000):"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" http://localhost:3000/app/index.html || warn "PWA پاسخ نداد"

log "تست از طریق Caddy (HTTPS):"
curl -sS -o /dev/null -w "HTTP %{http_code}\n" "https://$DOMAIN/api/health" || warn "گواهی SSL هنوز صادر نشده (ممکن است تا ۲ دقیقه طول بکشد)"

step "استقرار کامل شد!"
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  PWA:     https://$DOMAIN/app/index.html${NC}"
echo -e "${GREEN}  API:     https://$DOMAIN/api${NC}"
echo -e "${GREEN}  Health:  https://$DOMAIN/api/health${NC}"
echo ""
echo -e "${YELLOW}  لاگ‌های سرور:  journalctl -u morabbi -f${NC}"
echo -e "${YELLOW}  لاگ‌های Caddy: journalctl -u caddy -f${NC}"
echo -e "${YELLOW}  ری‌استارت:     systemctl restart morabbi${NC}"
echo -e "${GREEN}============================================${NC}"
