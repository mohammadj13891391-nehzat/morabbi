# راهنمای استقرار روی سرور واقعی

این سند مراحل استقرار سامانه «گزارش و طرح درس روزانه مربیان» را روی یک سرور تولیدی شرح می‌دهد.

---

## 📋 پیش‌نیازها

### ۱. سرور
- **سیستم‌عامل:** Ubuntu 22.04 LTS یا جدیدتر (توصیه‌شده)
- **رم حداقل:** ۲ گیگابایت (برای عملکرد بهینه، ۴ گیگابایت توصیه می‌شود)
- **دیسک:** حداقل ۲۰ گیگابایت فضای آزاد
- **دسترسی:** دسترسی root یا sudo

### ۲. نرم‌افزارهای مورد نیاز
- Node.js 18+ یا Bun
- PostgreSQL 14+ (توصیه‌شده برای تولید) یا SQLite (برای نصب کوچک)
- Nginx (به‌عنوان reverse proxy)
- PM2 (برای مدیریت پروسه)
- Certbot (برای گواهی SSL رایگان Let's Encrypt)

### ۳. دامنه
- یک دامنه ثبت‌شده (مثلاً: `morabbi.yourdomain.ir`)
- رکوردهای DNS تنظیم‌شده به IP سرور

---

## 🚀 مراحل استقرار

### مرحله ۱: آماده‌سازی سرور

```bash
# به‌روزرسانی سیستم
sudo apt update && sudo apt upgrade -y

# نصب نرم‌افزارهای پایه
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# نصب Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# نصب Bun
curl -fsSL https://bun.sh/install | bash
source ~/.bashrc

# نصب PM2
sudo npm install -g pm2

# نصب PostgreSQL
sudo apt install -y postgresql postgresql-contrib
```

### مرحله ۲: تنظیم پایگاه‌داده PostgreSQL

```bash
# ورود به PostgreSQL
sudo -u postgres psql

# در محیط psql:
CREATE DATABASE morabbi_db;
CREATE USER morabbi_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE morabbi_db TO morabbi_user;
\q

# تست اتصال
psql -U morabbi_user -d morabbi_db -h localhost
```

### مرحله ۳: دریافت کد و نصب

```bash
# ایجاد کاربر برای اپلیکیشن
sudo useradd -m -s /bin/bash morabbi
sudo su - morabbi

# دریافت کد (با فرض اینکه در مخزن Git قرار داده‌اید)
git clone https://your-repo-url.git ~/morabbi-app
cd ~/morabbi-app

# نصب وابستگی‌ها
bun install
# یا
npm install --production

# کپی فایل‌های پیکربندی
cp .env.example .env
nano .env
```

### مرحله ۴: پیکربندی محیط (.env)

```bash
# تنظیمات پایگاه‌داده
DATABASE_URL="postgresql://morabbi_user:YOUR_STRONG_PASSWORD@localhost:5432/morabbi_db?schema=public"

# تنظیمات امنیتی
NEXTAUTH_SECRET="YOUR_RANDOM_32_CHAR_SECRET_HERE"
NEXTAUTH_URL="https://morabbi.yourdomain.ir"

# تنظیمات Samane
NODE_ENV="production"
PORT=3000
```

**تولید رشته‌های تصادفی امن:**
```bash
openssl rand -hex 32  # برای NEXTAUTH_SECRET
```

### مرحله ۵: تغییر schema به PostgreSQL

فایل `prisma/schema.prisma` را ویرایش کنید:
```prisma
datasource db {
  provider = "postgresql"  # به جای "sqlite"
  url      = env("DATABASE_URL")
}
```

سپس اعمال schema:
```bash
bun run db:push
bun run db:generate
```

### مرحله ۶: وارد کردن داده‌های اولیه

```bash
# پر کردن داده‌های اولیه (شعب، کاربران، معیارها)
bun run scripts/seed.ts

# وارد کردن پایگاه‌داده کامل قرآن
bun run scripts/import-quran.ts

# نرمال‌سازی متن آیات برای جستجو
bun run scripts/normalize-quran.ts

# وارد کردن روایات
bun run scripts/import-hadith.ts scripts/hadith-data.json

# هش کردن رمزهای عبور
bun run scripts/hash-passwords.ts
```

### مرحله ۷: ساخت و اجرای اپلیکیشن

```bash
# ساخت نسخه تولید
bun run build

# اجرای اپلیکیشن با PM2
pm2 start npm --name "morabbi" -- start
pm2 save
pm2 startup  # برای اجرای خودکار در زمان بوت
```

### مرحله ۸: تنظیم Nginx به‌عنوان Reverse Proxy

```bash
sudo nano /etc/nginx/sites-available/morabbi
```

محتوای فایل:
```nginx
server {
    listen 80;
    server_name morabbi.yourdomain.ir;

    # ریدایرکت به HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name morabbi.yourdomain.ir;

    # تنظیمات SSL (با certbot پر می‌شود)
    # ssl_certificate /etc/letsencrypt/live/morabbi.yourdomain.ir/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/morabbi.yourdomain.ir/privkey.pem;

    # محل ذخیره فایل‌های آپلودی
    client_max_body_size 30M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # فایل‌های استاتیک
    location /uploads/ {
        alias /home/morabbi/morabbi-app/uploads/;
        expires 30d;
    }
}
```

فعال‌سازی:
```bash
sudo ln -s /etc/nginx/sites-available/morabbi /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### مرحله ۹: دریافت گواهی SSL رایگان

```bash
sudo certbot --nginx -d morabbi.yourdomain.ir
```

### مرحله ۱۰: تنظیم فایروال

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### مرحله ۱۱: تست نهایی

```bash
# تست دسترسی به سایت
curl -I https://morabbi.yourdomain.ir

# بررسی وضعیت PM2
pm2 status
pm2 logs morabbi

# بررسی لاگ Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔒 اقدامات امنیتی ضروری

### ۱. تغییر رمز عبور همه کاربران پیش‌فرض
پس از استقرار، **بلافاصله** رمز عبور همه کاربران (به‌ویژه مسئول مرکزی و مدیر سیستم) را از طریق صفحه «تنظیمات» تغییر دهید.

### ۲. محدودیت IP برای ادمین (اختیاری)
برای افزایش امنیت، می‌توانید دسترسی به صفحه ادمین را به IP‌های مشخص محدود کنید:
```nginx
location /admin {
    allow YOUR_OFFICE_IP;
    deny all;
    proxy_pass http://localhost:3000;
}
```

### ۳. پشتیبان‌گیری خودکار
اسکریپت پشتیبان‌گیری روزانه ایجاد کنید:
```bash
sudo nano /etc/cron.daily/backup-morabbi
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/morabbi"
DATE=$(date +%Y%m%d)
mkdir -p $BACKUP_DIR

# پشتیبان‌گیری از پایگاه‌داده
pg_dump -U morabbi_user morabbi_db > $BACKUP_DIR/db-$DATE.sql

# پشتیبان‌گیری از فایل‌های آپلودی
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz /home/morabbi/morabbi-app/uploads/

# حذف پشتیبان‌های قدیمی‌تر از ۳۰ روز
find $BACKUP_DIR -type f -mtime +30 -delete
```

```bash
sudo chmod +x /etc/cron.daily/backup-morabbi
```

### ۴. مانیتورینگ
- **PM2 Monitoring:** `pm2 monit`
- **Logrotate برای لاگ‌ها:** مطمئن شوید `/etc/logrotate.d/pm2` وجود دارد
- **نظارت بر منابع:** نصب `htop` و `vnstat`

### ۵. به‌روزرسانی منظم
```bash
# به‌روزرسانی وابستگی‌ها (هر ماه)
cd ~/morabbi-app
bun update
bun audit

# به‌روزرسانی سیستم (هر هفته)
sudo apt update && sudo apt upgrade -y
```

---

## 📊 مانیتورینگ و نگهداری

### دستورات مفید PM2
```bash
pm2 status              # مشاهده وضعیت
pm2 logs morabbi        # مشاهده لاگ‌ها
pm2 restart morabbi     # ری‌استارت
pm2 reload morabbi      # بارگذاری مجدد بدون قطعی
pm2 stop morabbi        # توقف
pm2 delete morabbi      # حذف
```

### پشتیبان‌گیری و بازیابی
```bash
# پشتیبان‌گیری دستی
pg_dump -U morabbi_user morabbi_db > backup.sql

# بازیابی
psql -U morabbi_user morabbi_db < backup.sql
```

### به‌روزرسانی اپلیکیشن
```bash
cd ~/morabbi-app
git pull origin main
bun install
bun run build
pm2 reload morabbi
```

---

## ⚠️ رفع اشکال رایج

### مشکل: خطای 502 Bad Gateway
```bash
# بررسی وضعیت PM2
pm2 status
# اگر متوقف است:
pm2 restart morabbi

# بررسی لاگ‌ها
pm2 logs morabbi --lines 50
```

### مشکل: خطای اتصال به پایگاه‌داده
```bash
# تست اتصال
psql -U morabbi_user -d morabbi_db -h localhost

# بررسی وضعیت PostgreSQL
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

### مشکل: گواهی SSL منقضی شده
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### مشکل: فضای دیسک پر شده
```bash
# بررسی فضای دیسک
df -h

# پاک کردن کش
sudo apt autoremove
sudo apt clean

# پاک کردن لاگ‌های قدیمی
sudo journalctl --vacuum-time=30d
```

---

## 📞 پشتیبانی

در صورت بروز مشکل:
۱. لاگ‌های PM2 و Nginx را بررسی کنید
۲. مطمئن شوید پایگاه‌داده در حال اجراست
۳. فضای دیسک را بررسی کنید
۴. در صورت نیاز، از پشتیبان‌گیری اخیر بازیابی کنید

---

## 🎯 چک‌لیست نهایی استقرار

- [ ] سرور با سیستم‌عامل به‌روز آماده شده
- [ ] PostgreSQL نصب و پایگاه‌داده ایجاد شده
- [ ] کد برنامه روی سرور کپی شده
- [ ] فایل `.env` با مقادیر واقعی پر شده
- [ ] `DATABASE_URL` به PostgreSQL تنظیم شده
- [ ] Schema به PostgreSQL تغییر و `db:push` اجرا شده
- [ ] داده‌های اولیه وارد شده (seed، قرآن، روایات، هش رمزها)
- [ ] برنامه با PM2 در حال اجراست
- [ ] Nginx به‌عنوان reverse proxy تنظیم شده
- [ ] گواهی SSL دریافت شده
- [ ] فایروال فعال شده
- [ ] پشتیبان‌گیری خودکار تنظیم شده
- [ ] **رمز عبور همه کاربران پیش‌فرض تغییر کرده**
- [ ] تست نهایی انجام شده و سایت قابل دسترسی است

---

**موفق باشید! 🎉**
