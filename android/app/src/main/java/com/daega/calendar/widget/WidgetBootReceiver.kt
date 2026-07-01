package com.daega.calendar.widget

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

class WidgetBootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent?) {
        if (intent?.action == Intent.ACTION_BOOT_COMPLETED) {
            WidgetRefresh.scheduleNetworkSync(context)
            WidgetRefresh.ensureBackgroundSync(context)
        }
    }
}
