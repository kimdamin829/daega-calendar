package com.daega.calendar.widget

import android.content.Context
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.updateAll

internal suspend fun updateAllCalendarWidgets(context: Context) {
    val appContext = context.applicationContext
    val manager = GlanceAppWidgetManager(appContext)
    val widget = CalendarWidget()
    val ids = manager.getGlanceIds(CalendarWidget::class.java)
    ids.forEach { glanceId ->
        WidgetMonthState.bumpRenderNonce(appContext, glanceId)
        widget.update(appContext, glanceId)
    }
    widget.updateAll(appContext)
}
