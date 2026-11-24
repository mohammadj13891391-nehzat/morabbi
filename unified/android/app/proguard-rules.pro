# Keep the app package (reflection-free, but safe against R8 class merging surprises).
-keep class ir.nehzat.morabbi.** { *; }

# WebView JavaScript interface methods (if any are added later).
-keepclassmembers class ir.nehzat.morabbi.** {
    @android.webkit.JavascriptInterface <methods>;
}
