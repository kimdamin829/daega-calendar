package com.daega.calendar.widget

import android.content.Context
import android.webkit.JavascriptInterface
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

/** WebView PWA → 위젯 즉시 동기화 */
class WidgetBridge(private val context: Context) {
    @JavascriptInterface
    fun refreshWidget() {
        WidgetRefresh.refreshNow(context)
    }

    @JavascriptInterface
    fun pushMonthSummaries(json: String) {
        val appContext = context.applicationContext
        bridgeScope.launch {
            WidgetReservationCache.applyFromWebAndRefresh(appContext, json)
        }
    }

    private companion object {
        private val bridgeScope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    }
}
