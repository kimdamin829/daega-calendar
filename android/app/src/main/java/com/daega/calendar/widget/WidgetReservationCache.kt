package com.daega.calendar.widget

import android.content.Context
import android.content.SharedPreferences
import androidx.glance.GlanceId
import androidx.glance.appwidget.GlanceAppWidgetManager
import com.daega.calendar.BuildConfig
import com.daega.calendar.data.DaySummary
import com.daega.calendar.data.MonthSummary
import com.daega.calendar.data.ReservationPreview
import com.daega.calendar.data.SupabaseApi
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlinx.coroutines.withTimeoutOrNull
import org.json.JSONArray
import org.json.JSONObject
import java.time.YearMonth
import java.util.concurrent.ConcurrentHashMap

/** 월별 예약 요약 캐시 — 앱 push 즉시 반영, 네트워크는 보조 */
object WidgetReservationCache {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val cache = ConcurrentHashMap<String, Map<String, DaySummary>>()
    private val cacheUpdatedAt = ConcurrentHashMap<String, Long>()
    private val inFlight = ConcurrentHashMap.newKeySet<String>()
    /** 네트워크로 "예약 없음" 확인된 달 */
    private val confirmedEmptyMonths = ConcurrentHashMap.newKeySet<String>()
    @Volatile
    private var lastUserActionPushAtMs: Long = 0L
    private const val USER_ACTION_PRIORITY_WINDOW_MS = 3_000L
    private const val PREFS_NAME = "widget_month_cache"
    private const val PERSIST_KEY_PREFIX = "month_json:"
    private const val PERSIST_TS_PREFIX = "month_ts:"
    private const val STALE_MS = 30_000L

    fun get(month: YearMonth): Map<String, DaySummary>? = cache[month.cacheKey()]

    /** 캐시 → 디스크 → 필요 시 동기 fetch */
    suspend fun loadForRender(context: Context, month: YearMonth): Map<String, DaySummary> {
        val cached = getForRender(context, month)
        if (cached.isNotEmpty() || !SupabaseApi.isConfigured) return cached

        ensureMonthCached(context.applicationContext, month, force = true)
        return getForRender(context, month)
    }

    /** WebView → 캐시 즉시 반영 + 위젯 redraw (동기) */
    suspend fun applyFromWebAndRefresh(appContext: Context, json: String) {
        val payload = parsePayload(json) ?: return
        val key = payload.cacheKey
        val now = System.currentTimeMillis()
        val isMountPush = payload.reason == "mount"
        val isUserActionPush = isUserActionReason(payload.reason)
        if (isMountPush && now - lastUserActionPushAtMs < USER_ACTION_PRIORITY_WINDOW_MS) {
            return
        }
        if (isUserActionPush) {
            lastUserActionPushAtMs = now
        }
        when {
            payload.merge -> {
                val merged = mergeMonthSummaries(cache[key].orEmpty(), payload.summaries)
                putMonthSummaries(appContext, key, merged, fromNetwork = false)
                confirmedEmptyMonths.remove(key)
            }
            payload.summaries.isEmpty() -> {
                if (payload.allowEmpty) {
                    putMonthSummaries(appContext, key, emptyMap(), fromNetwork = false)
                    confirmedEmptyMonths.add(key)
                } else {
                    cache.remove(key)
                    cacheUpdatedAt.remove(key)
                    removePersistedMonth(appContext, key)
                    confirmedEmptyMonths.remove(key)
                }
            }
            else -> {
                putMonthSummaries(appContext, key, payload.summaries, fromNetwork = false)
                confirmedEmptyMonths.remove(key)
            }
        }

        updateAllCalendarWidgets(appContext)
    }

    fun scheduleFetch(context: Context, glanceId: GlanceId, month: YearMonth) {
        prefetchAround(context, center = month, glanceId = glanceId)
    }

    /** 월 이동 버튼용: 선택 월 우선 fetch, 인접 월은 지연 보정 */
    fun scheduleFetchAfterNavigation(context: Context, glanceId: GlanceId, month: YearMonth) {
        if (!SupabaseApi.isConfigured) return
        val appContext = context.applicationContext
        fetchMonth(appContext, month, glanceId, force = true)
        scope.launch {
            delay(1_500)
            fetchMonth(appContext, month.minusMonths(1), glanceId = null, force = false)
            fetchMonth(appContext, month.plusMonths(1), glanceId = null, force = false)
        }
    }

    suspend fun syncMissingMonths(
        context: Context,
        forceRefreshVisible: Boolean = false,
        updateAfterSync: Boolean = true,
    ) {
        if (!SupabaseApi.isConfigured) {
            if (updateAfterSync) updateAllCalendarWidgets(context.applicationContext)
            return
        }

        val appContext = context.applicationContext
        val glanceIds = GlanceAppWidgetManager(appContext).getGlanceIds(CalendarWidget::class.java)
        if (glanceIds.isEmpty()) return

        val visibleMonths = glanceIds.map { WidgetMonthState.read(appContext, it) }.toSet()
        val fetchTargets = mutableListOf<YearMonth>()
        for (month in visibleMonths) {
            val key = month.cacheKey()
            val shouldFetch = if (forceRefreshVisible) true else !isMonthResolved(key)
            if (shouldFetch) fetchTargets.add(month)
        }

        if (fetchTargets.isEmpty()) {
            if (updateAfterSync) updateAllCalendarWidgets(appContext)
            return
        }

        withContext(Dispatchers.IO) {
            fetchTargets.forEach { month ->
                ensureMonthCached(
                    appContext = appContext,
                    month = month,
                    force = forceRefreshVisible,
                )
            }
        }

        if (updateAfterSync) updateAllCalendarWidgets(appContext)

        val neighbors = visibleMonths
            .flatMap { month -> listOf(month.minusMonths(1), month.plusMonths(1)) }
            .toSet() - visibleMonths

        scope.launch {
            neighbors.forEach { month ->
                ensureMonthCached(appContext = appContext, month = month, force = false)
            }
        }
    }

    suspend fun getForRender(context: Context, month: YearMonth): Map<String, DaySummary> {
        val key = month.cacheKey()
        val current = cache[key]
        if (current != null && !isStale(key)) return current

        val persisted = readPersistedMonth(context.applicationContext, key)
        if (persisted != null) {
            cache[key] = persisted
            cacheUpdatedAt[key] = readPersistedTimestamp(context.applicationContext, key)
            return persisted
        }

        return current.orEmpty()
    }

    private fun isMonthResolved(key: String): Boolean {
        if (cache[key]?.isNotEmpty() == true) return true
        return confirmedEmptyMonths.contains(key)
    }

    private fun isStale(key: String): Boolean {
        val updatedAt = cacheUpdatedAt[key] ?: return true
        return System.currentTimeMillis() - updatedAt > STALE_MS
    }

    private fun mergeMonthSummaries(
        existing: Map<String, DaySummary>,
        updates: Map<String, DaySummary>,
    ): Map<String, DaySummary> {
        val merged = existing.toMutableMap()
        for ((dateKey, summary) in updates) {
            if (summary.previews.isEmpty()) {
                merged.remove(dateKey)
            } else {
                merged[dateKey] = summary
            }
        }
        return merged
    }

    private fun parsePayload(json: String): WebMonthPayload? {
        return try {
            val root = JSONObject(json)
            val year = root.getInt("year")
            val month = root.getInt("month")
            val merge = root.optBoolean("merge", false)
            val allowEmpty = root.optBoolean("allowEmpty", false)
            val daysObj = root.getJSONObject("days")
            val summaries = mutableMapOf<String, DaySummary>()

            val dateKeys = daysObj.keys()
            while (dateKeys.hasNext()) {
                val dateKey = dateKeys.next()
                summaries[dateKey] = DaySummary(previews = parsePreviews(daysObj.getJSONArray(dateKey)))
            }

            WebMonthPayload(
                cacheKey = cacheKey(year, month),
                merge = merge,
                allowEmpty = allowEmpty,
                reason = root.optString("reason", ""),
                summaries = summaries,
            )
        } catch (_: Exception) {
            null
        }
    }

    private fun isUserActionReason(reason: String): Boolean =
        reason.startsWith("delete:") ||
            reason.startsWith("save:") ||
            reason.startsWith("position:") ||
            reason.startsWith("color:")

    private fun prefetchAround(
        context: Context,
        center: YearMonth,
        glanceId: GlanceId?,
    ) {
        if (!SupabaseApi.isConfigured) return

        val appContext = context.applicationContext
        fetchMonth(appContext, center, glanceId, force = false)
        fetchMonth(appContext, center.minusMonths(1), glanceId = null, force = false)
        fetchMonth(appContext, center.plusMonths(1), glanceId = null, force = false)
    }

    private fun fetchMonth(
        appContext: Context,
        month: YearMonth,
        glanceId: GlanceId?,
        force: Boolean,
    ) {
        val key = month.cacheKey()
        if (!force && isMonthResolved(key) && !isStale(key)) return
        if (!inFlight.add(key)) return

        scope.launch {
            try {
                ensureMonthCached(appContext = appContext, month = month, force = force)
                if (glanceId != null) {
                    withContext(Dispatchers.Main.immediate) {
                        CalendarWidget().update(appContext, glanceId)
                    }
                }
            } catch (_: Exception) {
            } finally {
                inFlight.remove(key)
            }
        }
    }

    private suspend fun ensureMonthCached(
        appContext: Context,
        month: YearMonth,
        force: Boolean,
    ) {
        val key = month.cacheKey()
        if (!force && isMonthResolved(key) && !isStale(key)) return

        try {
            val reservations = withTimeoutOrNull(4_000) {
                SupabaseApi.fetchReservationsForMonth(month)
            } ?: return

            val fetched = MonthSummary.summarizeByDate(reservations)
            if (fetched.isEmpty()) {
                // WebView push로 채워 둔 캐시는 유지
                if (cache[key]?.isNotEmpty() == true) {
                    cacheUpdatedAt[key] = System.currentTimeMillis()
                    confirmedEmptyMonths.remove(key)
                    return
                }
                // 네트워크 0건은 확정하지 않음 — 잘못된 빈 응답·설정 오류 후에도 재시도 가능
                confirmedEmptyMonths.remove(key)
            } else {
                putMonthSummaries(appContext, key, fetched, fromNetwork = true)
                confirmedEmptyMonths.remove(key)
            }
        } catch (_: Exception) {
            // 네트워크 오류 — 기존 캐시 유지
        }
    }

    private fun putMonthSummaries(
        context: Context,
        monthKey: String,
        summaries: Map<String, DaySummary>,
        fromNetwork: Boolean,
    ) {
        cache[monthKey] = summaries
        cacheUpdatedAt[monthKey] = System.currentTimeMillis()
        persistMonth(context, monthKey, summaries, cacheUpdatedAt[monthKey] ?: System.currentTimeMillis())
        if (fromNetwork && summaries.isEmpty()) {
            confirmedEmptyMonths.add(monthKey)
        }
    }

    private fun prefs(context: Context): SharedPreferences =
        context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private fun persistMonth(
        context: Context,
        monthKey: String,
        summaries: Map<String, DaySummary>,
        updatedAt: Long,
    ) {
        val json = serializeSummaries(summaries).toString()
        prefs(context).edit()
            .putString("$PERSIST_KEY_PREFIX$monthKey", json)
            .putLong("$PERSIST_TS_PREFIX$monthKey", updatedAt)
            .apply()
    }

    private fun readPersistedMonth(context: Context, monthKey: String): Map<String, DaySummary>? {
        val raw = prefs(context).getString("$PERSIST_KEY_PREFIX$monthKey", null) ?: return null
        return parseSummaries(raw)
    }

    private fun readPersistedTimestamp(context: Context, monthKey: String): Long =
        prefs(context).getLong("$PERSIST_TS_PREFIX$monthKey", 0L)

    private fun removePersistedMonth(context: Context, monthKey: String) {
        prefs(context).edit()
            .remove("$PERSIST_KEY_PREFIX$monthKey")
            .remove("$PERSIST_TS_PREFIX$monthKey")
            .apply()
    }

    private fun serializeSummaries(summaries: Map<String, DaySummary>): JSONObject {
        val root = JSONObject()
        for ((dateKey, daySummary) in summaries) {
            val arr = JSONArray()
            daySummary.previews.forEach { preview ->
                val item = JSONObject().put("label", preview.label)
                if (preview.colorId != null) {
                    item.put("color", preview.colorId)
                } else {
                    item.put("color", JSONObject.NULL)
                }
                arr.put(item)
            }
            root.put(dateKey, arr)
        }
        return root
    }

    private fun parseSummaries(raw: String): Map<String, DaySummary> {
        val root = JSONObject(raw)
        val out = mutableMapOf<String, DaySummary>()
        val keys = root.keys()
        while (keys.hasNext()) {
            val dateKey = keys.next()
            val arr = root.getJSONArray(dateKey)
            out[dateKey] = DaySummary(previews = parsePreviews(arr))
        }
        return out
    }

    private fun YearMonth.cacheKey(): String = cacheKey(year, monthValue)

    private fun cacheKey(year: Int, month: Int): String = "${BuildConfig.STORE_ID}-$year-$month"

    private fun parsePreviews(arr: JSONArray): List<ReservationPreview> {
        val previews = ArrayList<ReservationPreview>(arr.length())
        for (i in 0 until arr.length()) {
            val item = arr.getJSONObject(i)
            previews.add(
                ReservationPreview(
                    label = item.optString("label"),
                    colorId = item.previewColorId(),
                ),
            )
        }
        return previews
    }

    private fun JSONObject.previewColorId(): String? {
        if (isNull("color")) return null
        return optString("color").takeIf { it.isNotBlank() && !it.equals("null", ignoreCase = true) }
    }

    private data class WebMonthPayload(
        val cacheKey: String,
        val merge: Boolean,
        val allowEmpty: Boolean,
        val reason: String,
        val summaries: Map<String, DaySummary>,
    )
}
