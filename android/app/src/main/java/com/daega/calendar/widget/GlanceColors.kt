package com.daega.calendar.widget

import androidx.glance.GlanceModifier
import androidx.glance.ImageProvider
import androidx.glance.background
import com.daega.calendar.R

object WidgetGlanceStyle {
    val surface = ImageProvider(R.drawable.widget_surface)
    val todayCircle = ImageProvider(R.drawable.widget_today_circle)
    val gridCell = ImageProvider(R.drawable.widget_grid_cell)

    fun GlanceModifier.chromeBackground(): GlanceModifier = background(surface)

    fun GlanceModifier.gridCell(): GlanceModifier = background(gridCell)
}
