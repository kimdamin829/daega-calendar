package com.daega.calendar.widget

import android.content.Context
import android.os.Handler
import android.os.Looper
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import java.util.concurrent.TimeUnit

/** 위젯 데이터 갱신 — 캐시 즉시 반영 + 필요 시에만 네트워크 동기화 */
object WidgetRefresh {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Default)
    private val handler = Handler(Looper.getMainLooper())
    private var networkSyncRunnable: Runnable? = null
    private var delayedUpdateJob: Job? = null
    @Volatile
    private var isImmediateSyncRunning = false

    private const val NETWORK_SYNC_DEBOUNCE_MS = 400L
    private const val POLL_INTERVAL_MINUTES = 5L
    private const val PERIODIC_INTERVAL_MINUTES = 15L

    /** 캐시만으로 위젯 UI 갱신 (네트워크 없음) */
    fun updateUi(context: Context) {
        val appContext = context.applicationContext
        scope.launch {
            try {
                updateAllCalendarWidgets(appContext)
            } catch (_: Exception) {
            }
        }
    }

    /** 백그라운드에서 빠진 월만 네트워크로 채움 (debounce) */
    fun scheduleNetworkSync(context: Context) {
        val appContext = context.applicationContext
        networkSyncRunnable?.let { handler.removeCallbacks(it) }
        val runnable = Runnable {
            networkSyncRunnable = null
            scope.launch {
                try {
                    WidgetReservationCache.syncMissingMonths(appContext)
                } catch (_: Exception) {
                }
            }
        }
        networkSyncRunnable = runnable
        handler.postDelayed(runnable, NETWORK_SYNC_DEBOUNCE_MS)
    }

    /** 저장/수정/삭제 직후: 즉시 UI 갱신 + 즉시 네트워크 동기화 */
    fun refreshNow(context: Context) {
        val appContext = context.applicationContext
        updateUi(appContext)
        if (isImmediateSyncRunning) return
        isImmediateSyncRunning = true
        scope.launch {
            try {
                WidgetReservationCache.syncMissingMonths(
                    context = appContext,
                    forceRefreshVisible = false,
                    updateAfterSync = false,
                )
                updateUi(appContext)
            } catch (_: Exception) {
            } finally {
                isImmediateSyncRunning = false
            }
        }
    }

    fun ensureBackgroundSync(context: Context) {
        val appContext = context.applicationContext
        val constraints = Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build()

        val periodic = PeriodicWorkRequestBuilder<WidgetRefreshWorker>(
            PERIODIC_INTERVAL_MINUTES,
            TimeUnit.MINUTES,
        )
            .setConstraints(constraints)
            .build()

        WorkManager.getInstance(appContext).enqueueUniquePeriodicWork(
            "widget_periodic_refresh",
            ExistingPeriodicWorkPolicy.KEEP,
            periodic,
        )

        schedulePoll(appContext)
    }

    /** 나머지 위젯 인스턴스는 약간 늦게 갱신 */
    fun scheduleUpdateAllDelayed(context: Context, delayMs: Long = 1_200L) {
        val appContext = context.applicationContext
        delayedUpdateJob?.cancel()
        delayedUpdateJob = scope.launch {
            delay(delayMs)
            try {
                updateAllCalendarWidgets(appContext)
            } catch (_: Exception) {
            }
        }
    }

    internal fun schedulePoll(context: Context) {
        val request = OneTimeWorkRequestBuilder<WidgetPollWorker>()
            .setInitialDelay(POLL_INTERVAL_MINUTES, TimeUnit.MINUTES)
            .setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build(),
            )
            .build()

        WorkManager.getInstance(context).enqueueUniqueWork(
            "widget_poll",
            ExistingWorkPolicy.REPLACE,
            request,
        )
    }
}

class WidgetRefreshWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        return try {
            WidgetReservationCache.syncMissingMonths(applicationContext)
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}

class WidgetPollWorker(
    context: Context,
    params: WorkerParameters,
) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        return try {
            WidgetReservationCache.syncMissingMonths(applicationContext)
            WidgetRefresh.schedulePoll(applicationContext)
            Result.success()
        } catch (_: Exception) {
            Result.retry()
        }
    }
}
