# Morabbi Android Shell — نهضت تربیتی

یک **شور (shell) WebView باریک** بر پایه Kotlin که PWA مورابی را داخل یک اپ اندروید واقعی پیچیده.
**کل منطق اپلیکیشن در خود PWA** (`/app/index.html`) است — این پروژه فقط یک قاب اندروید است: WebView،
cookie/localStorage ماندگار، pull-to-refresh، ویدیو تمام‌صفحه، و RTL برای کروم بومی.

- بسته (package): `ir.nehzat.morabbi`
- آدرس پیش‌فرض: `https://morabbi.nehzat128.ir/app/index.html`
- `minSdk 26` — **عمد**: آیکون لانچر فقط به‌صورت adaptive icon (XML) ارائه شده و PNG فیل‌بک برای نسخه‌های
  24/25 وجود ندارد. اگر نیاز به minSdk 24/25 دارید، باید PNGهای `mipmap-mdpi/hdpi/...` بسازید.

## پیش‌نیازها

- **Android Studio** (Hedgehog یا جدیدتر — هر نسخه‌ای که AGP 8.7 را پشتیبانی کند)
- **Android SDK 35** (Android Studio در sync خودکار نصب می‌کند)
- Java 17 JDK (همراه خود Android Studio — JBR)

این پروژه بدون SDK هم قابل انتقال است؛ کافی است پوشه `android/` را در Android Studio باز کنید.

## ساخت

```text
1. Android Studio → Open → پوشه android/ را انتخاب کنید
2. صبر کنید Gradle sync تمام شود (دریافت AGP 8.7.3، Kotlin 2.0.20 و وابستگی‌ها)
3. Build → Build Bundle(s) / APK(s) → Build APK(s)
   یا از Terminal:
      gradle :app:assembleRelease        # اگر Gradle CLI ندارید: gradle wrapper و سپس ./gradlew :app:assembleRelease
```

APK خروجی: `app/build/outputs/apk/release/app-release.apk`

> **نکته CLI**: اسکریپت‌های `gradlew` در این repo تولید نشده‌اند. در Android Studio هیچ مشکلی نیست
> (استودیو مستقیم از `gradle-wrapper.properties` دایستریبیوشن Gradle 8.9 را می‌گیرد). برای ساخت
> خط‌دستور، یک‌بار `gradle wrapper` در پوشه `android/` اجرا کنید تا `gradlew`/`gradlew.bat` و
> `gradle-wrapper.jar` ساخته شوند.

## پیکربندی آدرس سرور (IS_DEV / SERVER_URL)

در `app/build.gradle.kts`:

```kotlin
buildConfigField("boolean", "IS_DEV", "false")
buildConfigField("String", "SERVER_URL", "\"https://morabbi.nehzat128.ir/app/index.html\"")
```

- **حالت پیش‌فرض (publish)**: `IS_DEV = false` → اپ روی `SERVER_URL` (https تولید) باز می‌شود.
- **حالت توسعه روی Emulator**: `IS_DEV` را روی `"true"` بگذارید؛ اپ آدرس
  `http://10.0.2.2:3015/app/index.html` را لود می‌کند (`10.0.2.2` = loopback خودِ دسکتاپ از دید
  امولاتور). مطمئن شوید سرور مورابی روی `:3015` با `0.0.0.0` listen کند.
  ترافیک cleartext برای این دامنه‌ها در `res/xml/network_security_config.xml` مجاز شده است.
- **تغییر دامنه تولید**: مقدار `SERVER_URL` را ویرایش کنید؛ هر URL با هاستی که در
  `shouldOverrideUrlLoading` به‌عنوان in-app شناخته شود، داخل اپ باقی می‌ماند.

## رفتار لینک‌ها (shouldOverrideUrlLoading)

| مقصد | رفتار |
|------|-------|
| `*.morabbi.nehzat128.ir` (+ هاست dev وقتی `IS_DEV=true`) | داخل WebView |
| `https://t.me/...` | Intent (تلگرام یا مرورگر) |
| `mailto:` | اپای ایمیل |
| `tel:` | اپای تلفن |
| هر چیز دیگر | مرورگر پیش‌فرض سیستم |

## ماندگاری ورود (cookie / localStorage)

- `domStorageEnabled = true` → localStorage PWA **بین سشن‌ها ماندگار** است (پاک‌سازی عمدی انجام
  نمی‌شود؛ PWA به این وابسته است).
- `CookieManager.setAcceptCookie(true)` + `flush()` در `onDestroy` → ککی‌ها روی دیسک ذخیره می‌شوند.
- `allowFileAccess = false`، کش پیش‌فرض (`LOAD_DEFAULT`)، و `mixedContentMode = COMPATIBILITY`.

## امضا برای Google Play

1. Android Studio → Build → Generate Signed App Bundle / APK
2. اگر keystore ندارید بسازید (یا `keytool -genkey -v -keystore morabbi-release.keystore -alias morabbi -keyalg RSA -keysize 2048 -validity 10000`)
3. Release build با keystore و password آن → خروجی `app-release.apk` (یا `.aab` برای Play)
4. در `app/build.gradle.kts` بخش `signingConfigs` را به بلوک `release` وصل کنید:

```kotlin
signingConfigs {
    create("release") {
        storeFile = file("../morabbi-release.keystore")
        storePassword = System.getenv("MORABBI_KEYSTORE_PASS") ?: ""
        keyAlias = "morabbi"
        keyPassword = System.getenv("MORABBI_KEY_PASS") ?: ""
    }
}
// داخل buildTypes:
getByName("release") {
    signingConfig = signingConfigs.getByName("release")
}
```

## بیلد موفق APK (بدون aapt2 / Gradle / Android Studio)

در ۲۴ نوامبر ۲۰۲۶ یک APK قابل نصب **بدون** aapt2، Gradle یا Android Studio ساخته شد — صرفاً با
JDK 17 + `javac` + `r8.jar` (D8) + `jarsigner`. دلیل: `aapt2` از هیچ منبع شبکه‌ای در دسترس نبود
(`dl.google.com` مسدود، آینه‌ها 404). چون اپ **کاملاً برنامه‌ای** است (بدون `R`، بدون androidx، بدون
`resources.arsc`)، نیازی به aapt2 نبوده است.

خروجی نهایی: `D:\morabbi-unified\build-apk\Morabbi-release.apk` (≈۷ KB، امضای v1).

### چرا بدون aapt2؟
- اَپ `android.app.Activity` ساده‌ای دارد که `setContentView` را با `WebView` **در رانت‌تایم** صدا می‌زند.
- هیچ `R.xxx`، `@string/`، `@drawable/` یا `resources.arsc` در کار نیست → aapt2 (که کارش کامپایلِ
  `res/` و `resources.arsc` است) اصلاً لازم نیست.
- `AndroidManifest.xml` به‌صورت **باینری AXML** توسط اسکریپت خودمان (`build-apk/src/AxmlWriter.java`)
  نوشته می‌شود. فرمت AXML با مقایسه بایت‌به‌بایت با مانیفست یک APK واقعی مورابی (v2.0.0) تأیید شد
  (نکتهٔ کلیدی: `charCount` استریک‌های pool از نوع `uint16` است، نه `uint32`).

### خط‌دستورهای دقیق (قابل تکرار)
```powershell
$root = "D:\morabbi-unified"; $jdk = "$root\tools\jdk\jdk-17.0.21.1+2\bin"
$work = "$root\build-apk\work"; $tools = "$root\tools"
New-Item -ItemType Directory -Force -Path "$work\classes","$work\mf","$work\dex" | Out-Null

# 1) کامپایل کلاس‌های اپ (bootclasspath = android.jar)
& "$jdk\javac.exe" -source 1.8 -target 1.8 -bootclasspath "$tools\android-35.jar" `
  -d "$work\classes" "$root\build-apk\src\MainActivity.java" "$root\build-apk\src\BuildConfig.java"

# 2) نگارش مانیفست باینری AXML + اعتبارسنجی با parser مستقل
& "$jdk\javac.exe" -d "$work\mf" "$root\build-apk\src\AxmlWriter.java" "$root\build-apk\src\AxmlDump.java"
& "$jdk\java.exe" -cp "$work\mf" AxmlWriter "$work\AndroidManifest.xml"
& "$jdk\java.exe" -cp "$work\mf" AxmlDump   "$work\AndroidManifest.xml"   # باید درخت صحیح را نشان دهد

# 3) DEX با R8/D8  (نکته: D8 8.3.37 ورودی directory نمی‌خواهد؛ کلاس‌ها را در یک jar بپیچید)
Push-Location "$work\classes"; & "$jdk\jar.exe" cf "$work\classes.jar" ir; Pop-Location
& "$jdk\java.exe" -cp "$tools\r8.jar" com.android.tools.r8.D8 `
  --lib "$tools\android-35.jar" --min-api 26 --output "$work\dex" "$work\classes.jar"

# 4) ساخت base.apk (فقط manifest + dex، بدون res)
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$fs=[System.IO.File]::Create("$work\base.apk"); $z=New-Object IO.Compression.ZipArchive($fs,[IO.Compression.ZipArchiveMode]::Create)
$m=[IO.File]::ReadAllBytes("$work\AndroidManifest.xml"); $d=[IO.File]::ReadAllBytes("$work\dex\classes.dex")
$e=$z.CreateEntry("AndroidManifest.xml");$s=$e.Open();$s.Write($m,0,$m.Length);$s.Close()
$e=$z.CreateEntry("classes.dex");$s=$e.Open();$s.Write($d,0,$d.Length);$s.Close()
$z.Dispose();$fs.Dispose()

# 5) امضای v1 + تأیید
& "$jdk\jarsigner.exe" -keystore "$root\android\morabbi-release.keystore" -storepass morabbi123 `
  -keypass morabbi123 -sigalg SHA256withRSA -digestalg SHA-256 `
  -signedjar "$root\build-apk\Morabbi-release.apk" "$work\base.apk" morabbi
& "$jdk\jarsigner.exe" -verify -verbose "$root\build-apk\Morabbi-release.apk"   # باید "signature was verified"
```

### محدودیت این APK
- **امضای v1 فقط** (zipalign / v2 ندارد). روی `minSdk 26` (Android 8+) قابل نصب و اجراست؛ برای انتشار
  در Play Store بهتر است `apksigner` (v2) + `zipalign` اضافه شود.
- **IS_DEV=false** → آدرس تولید `https://morabbi.nehzat128.ir/app/index.html`. برای تست محلی روی
  امولاتور `BuildConfig.IS_DEV=true` بگذارید تا `http://10.0.2.2:3015/app/index.html` لود شود.
- بدون آیکون لایسنس (از آیکون پیش‌فرض سیستم استفاده می‌شود) و بدون `res/`.

## معماری فایل‌ها

```
android/
├── settings.gradle.kts            نام پروژه: morabbi-shell، ماژول :app
├── build.gradle.kts               پلاگین‌ها: AGP 8.7.3 + Kotlin 2.0.20
├── gradle.properties              AndroidX، jvmargs
├── gradle/wrapper/                Gradle 8.9 (bin)
└── app/
    ├── build.gradle.kts           compileSdk 35 / minSdk 26 / targetSdk 35 / v4.0.0
    ├── proguard-rules.pro         keep ir.nehzat.morabbi.**
    └── src/main/
        ├── AndroidManifest.xml    INTERNET + ACCESS_NETWORK_STATE، RTL، cleartext برای dev
        ├── java/ir/nehzat/morabbi/MainActivity.kt
        └── res/
            ├── layout/activity_main.xml      FrameLayout + SwipeRefresh + نوار پیشرفت
            ├── values/ (strings, colors, themes — رنگ اصلی #059669)
            ├── drawable/ic_launcher_foreground.xml   حرف «ن» وکتور
            ├── mipmap-anydpi-v26/ (ic_launcher + ic_launcher_round)
            └── xml/ (network_security_config, file_paths)
```
