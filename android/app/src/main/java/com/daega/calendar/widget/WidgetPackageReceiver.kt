package com.daega.calendar.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/** APK 업데이트/재설치 후 위젯 데이터 갱신 */
class WidgetPackageReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_MY_PACKAGE_REPLACED) {
            WidgetRefresh.scheduleNetworkSync(context)
            WidgetRefresh.ensureBackgroundSync(context)
        }
    }
}
