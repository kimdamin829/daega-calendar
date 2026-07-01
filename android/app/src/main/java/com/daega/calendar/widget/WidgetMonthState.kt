package com.daega.calendar.widget

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.intPreferencesKey
import androidx.datastore.preferences.core.longPreferencesKey
import androidx.datastore.preferences.core.preferencesOf
import androidx.glance.GlanceId
import androidx.glance.appwidget.action.ActionCallback
import androidx.glance.appwidget.state.getAppWidgetState
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition
import com.daega.calendar.data.KoreaTime
import java.time.YearMonth

object WidgetMonthState {
    private val yearKey = intPreferencesKey("widget_year")
    private val monthKey = intPreferencesKey("widget_month")
    private val renderNonceKey = longPreferencesKey("render_nonce")

    fun fromPreferences(prefs: Preferences): YearMonth {
        val year = prefs[yearKey]
        val month = prefs[monthKey]
        return if (year != null && month != null) {
            YearMonth.of(year, month)
        } else {
            KoreaTime.currentMonth()
        }
    }

    suspend fun read(context: Context, glanceId: GlanceId): YearMonth {
        val prefs = getAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId)
        return fromPreferences(prefs)
    }

    suspend fun ensureInitialized(context: Context, glanceId: GlanceId) {
        val prefs = getAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId)
        if (prefs[yearKey] != null && prefs[monthKey] != null) return

        val now = KoreaTime.currentMonth()
        updateAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId) {
            preferencesOf(
                yearKey to now.year,
                monthKey to now.monthValue,
            )
        }
    }

    suspend fun shift(context: Context, glanceId: GlanceId, deltaMonths: Int) {
        updateAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId) { prefs ->
            val next = fromPreferences(prefs).plusMonths(deltaMonths.toLong())
            preferencesOf(
                yearKey to next.year,
                monthKey to next.monthValue,
                renderNonceKey to System.currentTimeMillis(),
            )
        }
    }

    /** Glance가 동일 트리로 최적화할 때 강제로 recomposition 유도 */
    suspend fun bumpRenderNonce(context: Context, glanceId: GlanceId) {
        updateAppWidgetState(context, PreferencesGlanceStateDefinition, glanceId) { prefs ->
            preferencesOf(
                yearKey to fromPreferences(prefs).year,
                monthKey to fromPreferences(prefs).monthValue,
                renderNonceKey to System.currentTimeMillis(),
            )
        }
    }
}

class MonthPrevAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: androidx.glance.action.ActionParameters,
    ) {
        WidgetMonthState.shift(context, glanceId, -1)
        val month = WidgetMonthState.read(context, glanceId)
        // 1) 클릭된 위젯만 즉시 갱신 (캐시 우선)
        CalendarWidget().update(context, glanceId)
        // 2) 월 전환 후 백그라운드 보정 fetch
        WidgetReservationCache.scheduleFetchAfterNavigation(context, glanceId, month)
        // 3) 다른 위젯 인스턴스는 지연 갱신
        WidgetRefresh.scheduleUpdateAllDelayed(context, delayMs = 1_200)
    }
}

class MonthNextAction : ActionCallback {
    override suspend fun onAction(
        context: Context,
        glanceId: GlanceId,
        parameters: androidx.glance.action.ActionParameters,
    ) {
        WidgetMonthState.shift(context, glanceId, 1)
        val month = WidgetMonthState.read(context, glanceId)
        // 1) 클릭된 위젯만 즉시 갱신 (캐시 우선)
        CalendarWidget().update(context, glanceId)
        // 2) 월 전환 후 백그라운드 보정 fetch
        WidgetReservationCache.scheduleFetchAfterNavigation(context, glanceId, month)
        // 3) 다른 위젯 인스턴스는 지연 갱신
        WidgetRefresh.scheduleUpdateAllDelayed(context, delayMs = 1_200)
    }
}
