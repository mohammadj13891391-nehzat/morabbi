package ir.nehzat.morabbi

import android.annotation.SuppressLint
import android.content.Intent
import android.graphics.Color
import android.net.Uri
import android.os.Bundle
import android.view.View
import android.view.ViewGroup
import android.webkit.CookieManager
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.FrameLayout
import android.widget.ProgressBar
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.ViewCompat
import androidx.swiperefreshlayout.widget.SwipeRefreshLayout

class MainActivity : AppCompatActivity() {

    private lateinit var root: FrameLayout
    private lateinit var swipeRefresh: SwipeRefreshLayout
    private lateinit var progressBar: ProgressBar
    private lateinit var webView: WebView

    private var customView: View? = null
    private var customViewCallback: WebChromeClient.CustomViewCallback? = null

    private val serverUrl: String
        get() = if (BuildConfig.IS_DEV) DEV_SERVER_URL else BuildConfig.SERVER_URL

    companion object {
        private const val DEV_SERVER_URL = "http://10.0.2.2:3015/app/index.html"
        private const val IN_APP_HOST = "morabbi.nehzat128.ir"
        private const val TELEGRAM_HOST = "t.me"
        private val REFRESH_COLOR = 0xFF059669.toInt()
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        root = findViewById(R.id.root)
        swipeRefresh = findViewById(R.id.swipe_refresh)
        progressBar = findViewById(R.id.web_progress)

        ViewCompat.setLayoutDirection(root, ViewCompat.LAYOUT_DIRECTION_RTL)

        CookieManager.getInstance().setAcceptCookie(true)

        webView = WebView(this)
        swipeRefresh.addView(
            webView,
            ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        )
        configureWebView()

        swipeRefresh.setColorSchemeColors(REFRESH_COLOR)
        swipeRefresh.setProgressBackgroundColorSchemeColor(Color.WHITE)
        swipeRefresh.setOnRefreshListener { webView.loadUrl(serverUrl) }

        if (savedInstanceState == null) {
            webView.loadUrl(serverUrl)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView() {
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.allowFileAccess = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE
        settings.cacheMode = WebSettings.LOAD_DEFAULT
        settings.useWideViewPort = true
        settings.loadWithOverviewMode = true
        settings.supportZoom = true
        settings.textZoom = 100
        settings.mediaPlaybackRequiresUserGesture = false

        webView.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                return handleUrlOverride(request.url)
            }

            override fun onPageFinished(view: WebView, url: String) {
                swipeRefresh.isRefreshing = false
            }
        }

        webView.webChromeClient = object : WebChromeClient() {
            override fun onProgressChanged(view: WebView, newProgress: Int) {
                if (newProgress >= 100) {
                    progressBar.visibility = View.GONE
                } else {
                    progressBar.visibility = View.VISIBLE
                    progressBar.progress = newProgress
                }
            }

            override fun onReceivedTitle(view: WebView, title: String) {
                // No action bar — title is informational only.
            }

            override fun onShowCustomView(view: View, callback: WebChromeClient.CustomViewCallback) {
                if (customView != null) {
                    callback.onCustomViewHidden()
                    return
                }
                customView = view
                customViewCallback = callback
                root.addView(
                    view,
                    FrameLayout.LayoutParams(
                        FrameLayout.LayoutParams.MATCH_PARENT,
                        FrameLayout.LayoutParams.MATCH_PARENT
                    )
                )
                root.setBackgroundColor(Color.BLACK)
            }

            override fun onHideCustomView() {
                customView?.let { root.removeView(it) }
                customView = null
                customViewCallback?.onCustomViewHidden()
                customViewCallback = null
                root.setBackgroundColor(ContextCompat.getColor(this@MainActivity, R.color.lp_bg))
            }
        }
    }

    private fun handleUrlOverride(uri: Uri): Boolean {
        val scheme = (uri.scheme ?: "http").lowercase()
        return when (scheme) {
            "http", "https" -> {
                val host = uri.host?.lowercase() ?: return true
                if (isInAppHost(host)) {
                    false
                } else if (host == TELEGRAM_HOST || host.endsWith(".$TELEGRAM_HOST")) {
                    openIntent(Intent(Intent.ACTION_VIEW, uri))
                    true
                } else {
                    openIntent(Intent(Intent.ACTION_VIEW, uri))
                    true
                }
            }
            "mailto" -> {
                openIntent(Intent(Intent.ACTION_SENDTO, uri))
                true
            }
            "tel" -> {
                openIntent(Intent(Intent.ACTION_DIAL, uri))
                true
            }
            else -> {
                openIntent(Intent(Intent.ACTION_VIEW, uri))
                true
            }
        }
    }

    private fun isInAppHost(host: String): Boolean {
        if (host == IN_APP_HOST || host.endsWith(".$IN_APP_HOST")) return true
        val devHost = Uri.parse(DEV_SERVER_URL).host
        return devHost != null && (host == devHost || host.endsWith(".$devHost"))
    }

    private fun openIntent(intent: Intent) {
        try {
            startActivity(intent)
        } catch (_: Exception) {
            // No app to handle the intent — ignore.
        }
    }

    @Suppress("DEPRECATION")
    override fun onBackPressed() {
        if (customView != null) {
            webView.onHideCustomView()
            return
        }
        if (webView.canGoBack()) {
            webView.goBack()
        } else {
            super.onBackPressed()
        }
    }

    override fun onPause() {
        super.onPause()
        webView.onPause()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onDestroy() {
        if (customView != null) {
            customViewCallback?.onCustomViewHidden()
            root.removeView(customView)
            customView = null
            customViewCallback = null
        }
        CookieManager.getInstance().flush()
        webView.destroy()
        super.onDestroy()
    }
}
