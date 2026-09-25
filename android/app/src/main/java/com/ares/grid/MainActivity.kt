package com.ares.grid

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import android.webkit.ConsoleMessage
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.Toast
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.webkit.WebViewAssetLoader

/**
 * TRON: ARES — PROTOCOL OVERRIDE (Android shell)
 *
 * A thin native container: the game is the built WebGL/Vite bundle in
 * assets/, served over the appassets virtual origin so ES modules,
 * workers and absolute asset paths all resolve normally.
 */
class MainActivity : Activity() {

    private lateinit var webView: WebView
    private var lastBackPress = 0L

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Remote debugging for chrome://inspect while USB-attached
        WebView.setWebContentsDebuggingEnabled(true)

        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // Edge-to-edge, immersive: games should own the whole panel
        WindowCompat.setDecorFitsSystemWindows(window, false)
        WindowInsetsControllerCompat(window, window.decorView).apply {
            hide(WindowInsetsCompat.Type.systemBars())
            systemBarsBehavior =
                WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
        }

        // AssetsPathHandler(context) resolves the request path directly against
        // assets/ — so the web build lives at the assets root, not in a subdir.
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        webView = WebView(this).apply {
            setBackgroundColor(Color.BLACK)
            settings.apply {
                javaScriptEnabled = true
                domStorageEnabled = true
                mediaPlaybackRequiresUserGesture = false   // Web Audio unlocks on tap anyway
                useWideViewPort = true
                loadWithOverviewMode = true
                cacheMode = WebSettings.LOAD_DEFAULT
                allowFileAccess = false
                allowContentAccess = false
            }

            webChromeClient = object : WebChromeClient() {
                override fun onConsoleMessage(msg: ConsoleMessage): Boolean {
                    Log.i(TAG, "console: ${msg.message()} @ ${msg.sourceId()}:${msg.lineNumber()}")
                    return true
                }
            }

            webViewClient = object : WebViewClient() {
                override fun shouldInterceptRequest(
                    view: WebView,
                    request: WebResourceRequest
                ): WebResourceResponse? = assetLoader.shouldInterceptRequest(request.url)

                override fun onPageFinished(view: WebView, url: String) {
                    Log.i(TAG, "page finished: $url")
                    installDiagnostics()
                }
            }

            addJavascriptInterface(Bridge(), "AndroidBridge")
        }

        setContentView(webView)
        webView.loadUrl("https://appassets.androidplatform.net/index.html")

        // The game needs a couple of seconds to boot before hooks can attach
        webView.postDelayed({ installDiagnostics() }, 3000)
    }

    /** Forward page errors into logcat so failures are visible from adb. */
    private fun installDiagnostics() {
        val js = """
            (function () {
              if (window.__trHooks) return; window.__trHooks = true;
              var B = window.AndroidBridge;
              window.addEventListener('error', function (e) {
                B.error('JSERROR ' + (e.message || '') + ' @ ' + (e.filename || '') + ':' + (e.lineno || 0));
              });
              window.addEventListener('unhandledrejection', function (e) {
                B.error('JSREJECT ' + ((e.reason && e.reason.message) || String(e.reason)));
              });
              // Periodic state probe: makes the WebView's game state visible
              // from logcat instead of being inferred from pixels.
              setInterval(function () {
                var g = window.__TRON__;
                if (!g) { B.info('probe: game=false'); return; }
                var layer = document.getElementById('tc-layer');
                var cta = document.getElementById('btn-start-game');
                if (cta) {
                  var r = cta.getBoundingClientRect();
                  B.info('cta: x=' + Math.round(r.x) + ' y=' + Math.round(r.y) +
                         ' w=' + Math.round(r.width) + ' h=' + Math.round(r.height) +
                         ' vh=' + window.innerHeight);
                }
                B.info('probe: state=' + g.state +
                       ' mode=' + (g.vehicle && g.vehicle.mode) +
                       ' wave=' + (g.gameStats && g.gameStats.wave) +
                       ' score=' + (g.gameStats && g.gameStats.score) +
                       ' fps=' + Math.round((g.perf && g.perf.fps) || 0) +
                       ' tier=' + (g.perf && g.perf.tier) +
                       ' touchUI=' + (!!layer && !layer.classList.contains('tc-off')));
              }, 3000);
              setTimeout(function () {
                var g = window.__TRON__;
                B.info('boot: game=' + (!!g) + ' mode=' + (g && g.vehicle && g.vehicle.mode) +
                       ' touch=' + (!!(g && g.touch)) + ' webgl=' + (function () {
                         try { return !!document.querySelector('canvas'); } catch (err) { return false; }
                       })());
              }, 1500);
              B.info('diagnostics installed');
            })();
        """.trimIndent()
        webView.evaluateJavascript(js, null)
    }

    inner class Bridge {
        @JavascriptInterface
        fun info(msg: String) {
            Log.i(TAG, "JS: $msg")
        }

        @JavascriptInterface
        fun error(msg: String) {
            Log.e(TAG, "JS: $msg")
        }
    }

    /** Back = pause the grid; second press inside 2 s exits. */
    @Deprecated("Deprecated in Java")
    override fun onBackPressed() {
        val now = System.currentTimeMillis()
        if (now - lastBackPress < 2000) {
            @Suppress("DEPRECATION")
            super.onBackPressed()
            return
        }
        lastBackPress = now
        webView.evaluateJavascript(
            "window.__TRON__ && window.__TRON__.togglePause && window.__TRON__.togglePause();",
            null
        )
        Toast.makeText(this, "GRID PAUSED — press back again to exit", Toast.LENGTH_SHORT).show()
    }

    override fun onResume() {
        super.onResume()
        webView.onResume()
    }

    override fun onPause() {
        webView.onPause()
        super.onPause()
    }

    override fun onDestroy() {
        webView.destroy()
        super.onDestroy()
    }

    companion object {
        const val TAG = "TRONARES"
    }
}
