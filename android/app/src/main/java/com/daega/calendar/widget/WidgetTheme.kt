package com.daega.calendar.widget

import androidx.compose.material3.lightColorScheme
import androidx.compose.ui.graphics.Color
import androidx.glance.material3.ColorProviders

private val widgetScheme = lightColorScheme(
    primary = Color(0xFF1A73E8),
    onPrimary = Color(0xFFFFFFFF),
    onSurface = Color(0xFF000000),
    onSurfaceVariant = Color(0xFF9AA0A6),
    error = Color(0xFFD93025),
    outline = Color(0xFFE4E6EA),
)

/** Glance ColorProviders — 칩·헤더 텍스트는 onSurface 사용 */
val WidgetColorProviders = ColorProviders(light = widgetScheme, dark = widgetScheme)
