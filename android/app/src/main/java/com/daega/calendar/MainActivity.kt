package com.daega.calendar

import android.annotation.SuppressLint
import android.content.Intent
import android.os.Bundle
import android.webkit.CookieManager
import android.webkit.ServiceWorkerController
import android.webkit.WebChromeClient
import android.webkit.WebStorage
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.core.view.WindowCompat
import com.daega.calendar.widget.WidgetBridge
import com.daega.calendar.widget.WidgetRefresh
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView
    private var lastLoadedUrl: String? = null
    private var pwaReady = false
    private val cacheBuster = System.currentTimeMillis().toString()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, true)

        webView = WebView(this)
        setContentView(webView)
        configureWebView(webView)
        resetWebViewCaches(webView)
        WidgetRefresh.ensureBackgroundSync(this)
        loadFromIntent(intent)

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) {
                        webView.goBack()
                    } else {
                        isEnabled = false
                        onBackPressedDispatcher.onBackPressed()
                    }
                }
            },
        )
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        lastLoadedUrl = null
        loadFromIntent(intent)
    }

    @SuppressLint("SetJavaScriptEnabled")
    private fun configureWebView(view: WebView) {
        view.setBackgroundColor(ContextCompat.getColor(this, R.color.app_background))
        view.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = false
            setSupportZoom(true)
            builtInZoomControls = false
            cacheMode = WebSettings.LOAD_NO_CACHE
        }
        view.webViewClient = object : WebViewClient() {
            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val host = request.url.host.orEmpty()
                val allowed = BuildConfig.PWA_BASE_URL
                if (host.isNotBlank() && allowed.contains(host)) {
                    return false
                }
                return true
            }

            override fun onPageFinished(view: WebView?, url: String?) {
                val base = BuildConfig.PWA_BASE_URL.trimEnd('/')
                if (url != null && url.startsWith(base)) {
                    pwaReady = true
                }
            }
        }
        view.webChromeClient = WebChromeClient()
        view.addJavascriptInterface(WidgetBridge(applicationContext), "DaegaCalendarAndroid")
    }

    private fun loadFromIntent(intent: Intent?) {
        val target = parseNavigateTarget(intent)
        val targetWithBuster = withCacheBuster(target.url)

        if (pwaReady && target.date != null) {
            lastLoadedUrl = targetWithBuster
            navigateInApp(target.date, target.view)
            return
        }

        if (targetWithBuster == lastLoadedUrl) return
        lastLoadedUrl = targetWithBuster
        pwaReady = false
        webView.loadUrl(targetWithBuster)
    }

    private fun navigateInApp(date: String, view: String) {
        val script = """
            window.dispatchEvent(new CustomEvent('app-navigate', {
              detail: { date: ${JSONObject.quote(date)}, view: ${JSONObject.quote(view)} }
            }));
        """.trimIndent()
        webView.evaluateJavascript(script, null)
    }

    private fun parseNavigateTarget(intent: Intent?): NavigateTarget {
        val base = BuildConfig.PWA_BASE_URL.trimEnd('/')
        val date = intent?.getStringExtra(EXTRA_DATE)?.takeIf { it.isNotBlank() }
        if (date == null) return NavigateTarget(base, null, "month")

        val view = when (intent.getStringExtra(EXTRA_VIEW)) {
            "month" -> "month"
            else -> "day"
        }
        val url = if (view == "day") "$base/?date=$date&view=day" else "$base/?date=$date"
        return NavigateTarget(url, date, view)
    }

    private fun withCacheBuster(url: String): String {
        val delimiter = if (url.contains("?")) "&" else "?"
        return "$url${delimiter}v=$cacheBuster"
    }

    private fun resetWebViewCaches(view: WebView) {
        try {
            view.clearCache(true)
            view.clearHistory()
            WebStorage.getInstance().deleteAllData()
            CookieManager.getInstance().removeAllCookies(null)
            CookieManager.getInstance().flush()
            runCatching {
                ServiceWorkerController.getInstance()
                    .serviceWorkerWebSettings
                    .setCacheMode(WebSettings.LOAD_NO_CACHE)
            }
        } catch (_: Exception) {
        }
    }

    private data class NavigateTarget(
        val url: String,
        val date: String?,
        val view: String,
    )

    companion object {
        const val EXTRA_DATE = "date"
        const val EXTRA_VIEW = "view"
    }
}
