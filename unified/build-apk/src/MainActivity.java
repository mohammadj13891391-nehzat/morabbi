package ir.nehzat.morabbi;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ProgressBar;

public class MainActivity extends Activity {

    private FrameLayout root;
    private ProgressBar progressBar;
    private WebView webView;

    private View customView;
    private WebChromeClient.CustomViewCallback customViewCallback;

    private static final String DEV_SERVER_URL = "http://10.0.2.2:3015/app/index.html";
    private static final String IN_APP_HOST = "morabbi.nehzat128.ir";
    private static final String TELEGRAM_HOST = "t.me";
    private static final int REFRESH_COLOR = 0xFF059669;

    private String serverUrl() {
        return BuildConfig.IS_DEV ? DEV_SERVER_URL : BuildConfig.SERVER_URL;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE);
        setTheme(android.R.style.Theme_Material_Light_NoActionBar);

        root = new FrameLayout(this);
        root.setBackgroundColor(0xFFF7F7F5);
        root.setLayoutDirection(View.LAYOUT_DIRECTION_RTL);

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        FrameLayout.LayoutParams plp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(3));
        plp.gravity = Gravity.TOP;
        progressBar.setMax(100);
        progressBar.setProgress(0);
        progressBar.setIndeterminate(false);
        progressBar.getProgressDrawable().setTint(REFRESH_COLOR);
        progressBar.setVisibility(View.GONE);

        CookieManager.getInstance().setAcceptCookie(true);

        webView = new WebView(this);
        configureWebView();

        root.addView(webView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        root.addView(progressBar, plp);
        setContentView(root);

        if (savedInstanceState == null) {
            webView.loadUrl(serverUrl());
        }
    }

    private int dp(int v) {
        float d = getResources().getDisplayMetrics().density;
        return Math.max(1, Math.round(v * d));
    }

    @SuppressLint("SetJavaScriptEnabled")
    private void configureWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        settings.setCacheMode(WebSettings.LOAD_DEFAULT);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(true);
        settings.setSupportZoom(true);
        settings.setTextZoom(100);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return handleUrlOverride(request.getUrl());
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                // no-op
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                if (newProgress >= 100) {
                    progressBar.setVisibility(View.GONE);
                } else {
                    progressBar.setVisibility(View.VISIBLE);
                    progressBar.setProgress(newProgress);
                }
            }

            @Override
            public void onShowCustomView(View view, CustomViewCallback callback) {
                if (customView != null) {
                    callback.onCustomViewHidden();
                    return;
                }
                customView = view;
                customViewCallback = callback;
                root.addView(view, new FrameLayout.LayoutParams(
                        ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
                root.setBackgroundColor(Color.BLACK);
            }

            @Override
            public void onHideCustomView() {
                if (customView != null) {
                    root.removeView(customView);
                }
                customView = null;
                if (customViewCallback != null) {
                    customViewCallback.onCustomViewHidden();
                    customViewCallback = null;
                }
                root.setBackgroundColor(0xFFF7F7F5);
            }
        });
    }

    private boolean handleUrlOverride(Uri uri) {
        String scheme = (uri.getScheme() == null) ? "http" : uri.getScheme().toLowerCase();
        if (scheme.equals("http") || scheme.equals("https")) {
            String host = uri.getHost();
            if (host == null) {
                return true;
            }
            host = host.toLowerCase();
            if (isInAppHost(host)) {
                return false;
            } else if (host.equals(TELEGRAM_HOST) || host.endsWith("." + TELEGRAM_HOST)) {
                openIntent(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            } else {
                openIntent(new Intent(Intent.ACTION_VIEW, uri));
                return true;
            }
        } else if (scheme.equals("mailto")) {
            openIntent(new Intent(Intent.ACTION_SENDTO, uri));
            return true;
        } else if (scheme.equals("tel")) {
            openIntent(new Intent(Intent.ACTION_DIAL, uri));
            return true;
        } else {
            openIntent(new Intent(Intent.ACTION_VIEW, uri));
            return true;
        }
    }

    private boolean isInAppHost(String host) {
        if (host.equals(IN_APP_HOST) || host.endsWith("." + IN_APP_HOST)) {
            return true;
        }
        String devHost = Uri.parse(DEV_SERVER_URL).getHost();
        return devHost != null && (host.equals(devHost) || host.endsWith("." + devHost));
    }

    private void openIntent(Intent intent) {
        try {
            startActivity(intent);
        } catch (Exception ignored) {
        }
    }

    @Override
    public void onBackPressed() {
        if (customView != null) {
            if (customViewCallback != null) {
                customViewCallback.onCustomViewHidden();
                customViewCallback = null;
            }
            root.removeView(customView);
            customView = null;
            root.setBackgroundColor(0xFFF7F7F5);
            return;
        }
        if (webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (webView != null) {
            webView.onPause();
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
        }
    }

    @Override
    protected void onDestroy() {
        if (customView != null) {
            if (customViewCallback != null) {
                customViewCallback.onCustomViewHidden();
            }
            root.removeView(customView);
            customView = null;
            customViewCallback = null;
        }
        CookieManager.getInstance().flush();
        if (webView != null) {
            webView.destroy();
        }
        super.onDestroy();
    }
}
