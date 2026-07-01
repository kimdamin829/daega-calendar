package com.daega.calendar.widget

import android.content.Context
import android.content.Intent
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.TextUnit
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.Preferences
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.LocalContext
import androidx.glance.LocalSize
import androidx.glance.action.Action
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionRunCallback
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxHeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.semantics.contentDescription
import androidx.glance.semantics.semantics
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextAlign
import androidx.glance.text.TextStyle
import com.daega.calendar.MainActivity
import com.daega.calendar.R
import com.daega.calendar.data.CalendarGrid
import com.daega.calendar.data.MonthGridDay
import com.daega.calendar.data.ReservationColors
import com.daega.calendar.data.SupabaseApi
import com.daega.calendar.widget.WidgetGlanceStyle.chromeBackground
import com.daega.calendar.widget.WidgetGlanceStyle.gridCell
import com.daega.calendar.widget.WidgetGlanceStyle.todayCircle
import java.time.YearMonth
import java.time.format.DateTimeFormatter

class CalendarWidget : GlanceAppWidget() {

    override val stateDefinition = PreferencesGlanceStateDefinition

    override val sizeMode = SizeMode.Exact

    override suspend fun provideGlance(context: Context, id: androidx.glance.GlanceId) {
        WidgetMonthState.ensureInitialized(context, id)
        val month = WidgetMonthState.read(context, id)
        val summaries = WidgetReservationCache.loadForRender(context, month)
        WidgetReservationCache.scheduleFetch(context, id, month)

        provideContent {
            GlanceTheme(colors = WidgetColorProviders) {
                val displayMonth = WidgetMonthState.fromPreferences(currentState<Preferences>())
                val displaySummaries = if (displayMonth == month) {
                    summaries
                } else {
                    WidgetReservationCache.get(displayMonth).orEmpty()
                }
                val days = CalendarGrid.buildMonthDays(displayMonth, displaySummaries)

                CalendarWidgetContent(month = displayMonth, days = days)
            }
        }
    }
}

class CalendarWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget: GlanceAppWidget = CalendarWidget()

    override fun onEnabled(context: Context) {
        super.onEnabled(context)
        WidgetRefresh.scheduleNetworkSync(context)
        WidgetRefresh.ensureBackgroundSync(context)
    }
}

private data class WidgetDim(
    val headerHeight: Dp,
    val headerTopPad: Dp,
    val weekdayHeight: Dp,
    val headerGap: Dp,
    val previewGap: Dp,
    val previewLineHeight: Dp,
    val dayCircle: Dp,
    val titleSize: TextUnit,
    val brandSize: TextUnit,
    val navButtonWidth: Dp,
    val navButtonHeight: Dp,
    val navFontSize: TextUnit,
    val weekdaySize: TextUnit,
    val daySize: TextUnit,
    val previewSize: TextUnit,
)

private fun widgetDim(compact: Boolean) = if (compact) {
    WidgetDim(40.dp, 6.dp, 16.dp, 5.dp, 2.dp, 9.dp, 20.dp, 16.sp, 17.sp, 36.dp, 50.dp, 34.sp, 10.sp, 11.sp, 8.sp)
} else {
    WidgetDim(44.dp, 8.dp, 18.dp, 7.dp, 2.dp, 10.dp, 22.dp, 18.sp, 18.sp, 38.dp, 54.dp, 36.sp, 11.sp, 12.sp, 9.sp)
}

private fun WidgetDim.maxPreviewLines(rowHeight: Dp): Int {
    val reserved = dayCircle + previewGap + 2.dp
    val lineBlock = previewLineHeight + 4.dp
    val available = rowHeight - reserved
    if (available <= 0.dp) return 0
    return (available / lineBlock).toInt().coerceAtLeast(0)
}

private fun WidgetDim.chromeHeight(): Dp =
    8.dp + headerTopPad + headerHeight + headerGap + weekdayHeight

private fun WidgetDim.gridRowHeight(weekCount: Int, totalHeight: Dp): Dp {
    val minRow = 24.dp
    val available = (totalHeight - chromeHeight()).coerceAtLeast(minRow * weekCount)
    return (available / weekCount).coerceAtLeast(minRow)
}

private fun Context.openCalendarAction(date: String, view: String): Action =
    actionStartActivity(
        Intent(this, MainActivity::class.java).apply {
            putExtra(MainActivity.EXTRA_DATE, date)
            putExtra(MainActivity.EXTRA_VIEW, view)
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
        },
    )

@Composable
private fun CalendarWidgetContent(month: YearMonth, days: List<MonthGridDay>) {
    val colors = GlanceTheme.colors
    val weeks = days.chunked(7)
    val dim = widgetDim(LocalSize.current.height < 320.dp)

    Column(
        modifier = GlanceModifier
            .fillMaxSize()
            .appWidgetBackground()
            .chromeBackground()
            .padding(vertical = 4.dp),
    ) {
        WidgetHeader(month, dim)

        if (!SupabaseApi.isConfigured) {
            Text(
                text = LocalContext.current.getString(R.string.widget_setup_required),
                style = TextStyle(color = colors.onSurfaceVariant, fontSize = 12.sp),
                modifier = GlanceModifier
                    .padding(horizontal = 6.dp)
                    .padding(top = 8.dp),
            )
            return@Column
        }

        Spacer(modifier = GlanceModifier.height(dim.headerGap))
        WeekdayRow(dim)

        val weekCount = weeks.size
        val rowHeight = dim.gridRowHeight(weekCount, LocalSize.current.height)
        val gridHeight = rowHeight * weekCount

        Column(
            modifier = GlanceModifier
                .height(gridHeight)
                .fillMaxWidth()
                .background(colors.outline)
                .padding(start = 0.5.dp),
        ) {
            for (week in weeks) {
                Row(
                    modifier = GlanceModifier
                        .height(rowHeight)
                        .fillMaxWidth(),
                ) {
                    val cellModifier = GlanceModifier.defaultWeight().fillMaxHeight()
                    for (day in week) {
                        DayCell(
                            day = day,
                            dim = dim,
                            rowHeight = rowHeight,
                            modifier = cellModifier,
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun WidgetHeader(month: YearMonth, dim: WidgetDim) {
    val colors = GlanceTheme.colors
    val context = LocalContext.current
    val monthDateKey = month.atDay(1).format(DateTimeFormatter.ISO_LOCAL_DATE)

    Row(
        modifier = GlanceModifier
            .fillMaxWidth()
            .height(dim.headerHeight)
            .chromeBackground()
            .padding(top = dim.headerTopPad)
            .padding(horizontal = 8.dp),
        verticalAlignment = Alignment.Vertical.CenterVertically,
    ) {
        Text(
            text = CalendarGrid.formatTitle(month),
            modifier = GlanceModifier.clickable(context.openCalendarAction(monthDateKey, "month")),
            style = TextStyle(
                fontSize = dim.titleSize,
                fontWeight = FontWeight.Medium,
                color = colors.onSurface,
            ),
        )
        Spacer(modifier = GlanceModifier.defaultWeight())
        MonthNavButton(
            label = "‹",
            description = context.getString(R.string.widget_prev_month),
            action = actionRunCallback<MonthPrevAction>(),
            dim = dim,
        )
        Spacer(modifier = GlanceModifier.width(8.dp))
        MonthNavButton(
            label = "›",
            description = context.getString(R.string.widget_next_month),
            action = actionRunCallback<MonthNextAction>(),
            dim = dim,
        )
        Text(
            text = context.getString(R.string.widget_brand_name),
            modifier = GlanceModifier.padding(start = 8.dp),
            style = TextStyle(
                fontSize = dim.brandSize,
                fontWeight = FontWeight.Medium,
                color = colors.onSurface,
                textAlign = TextAlign.End,
            ),
        )
    }
}

@Composable
private fun MonthNavButton(
    label: String,
    description: String,
    action: Action,
    dim: WidgetDim,
) {
    val colors = GlanceTheme.colors

    Box(
        modifier = GlanceModifier
            .size(width = dim.navButtonWidth, height = dim.navButtonHeight)
            .padding(start = 2.dp, end = 2.dp, bottom = 5.dp)
            .clickable(action)
            .semantics { contentDescription = description },
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = label,
            style = TextStyle(
                fontSize = dim.navFontSize,
                fontWeight = FontWeight.Normal,
                color = colors.onSurface,
                textAlign = TextAlign.Center,
            ),
        )
    }
}

@Composable
private fun WeekdayRow(dim: WidgetDim) {
    val colors = GlanceTheme.colors
    val labels = listOf("일", "월", "화", "수", "목", "금", "토")

    Row(
        modifier = GlanceModifier
            .fillMaxWidth()
            .height(dim.weekdayHeight)
            .chromeBackground(),
        verticalAlignment = Alignment.Vertical.CenterVertically,
    ) {
        val cellModifier = GlanceModifier.defaultWeight().fillMaxHeight()
        for (index in labels.indices) {
            val color = when (index) {
                0 -> colors.error
                6 -> colors.primary
                else -> colors.onSurface
            }
            Box(
                modifier = cellModifier,
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = labels[index],
                    style = TextStyle(
                        fontSize = dim.weekdaySize,
                        fontWeight = FontWeight.Medium,
                        color = color,
                        textAlign = TextAlign.Center,
                    ),
                )
            }
        }
    }
}

@Composable
private fun DayCell(
    day: MonthGridDay,
    dim: WidgetDim,
    rowHeight: Dp,
    modifier: GlanceModifier = GlanceModifier,
) {
    val colors = GlanceTheme.colors
    val context = LocalContext.current
    val previews = day.summary.previews.take(dim.maxPreviewLines(rowHeight))
    val dayColor = when {
        !day.inCurrentMonth -> colors.onSurfaceVariant
        day.isToday -> colors.onPrimary
        else -> colors.onSurface
    }

    Column(
        modifier = modifier
            .gridCell()
            .clickable(context.openCalendarAction(day.dateKey, "day"))
            .padding(vertical = 1.dp),
        horizontalAlignment = Alignment.Horizontal.Start,
        verticalAlignment = Alignment.Vertical.Top,
    ) {
        Box(
            modifier = GlanceModifier
                .fillMaxWidth()
                .height(dim.dayCircle),
            contentAlignment = Alignment.Center,
        ) {
            Box(
                modifier = GlanceModifier
                    .size(dim.dayCircle)
                    .then(
                        if (day.isToday) {
                            GlanceModifier.background(todayCircle)
                        } else {
                            GlanceModifier
                        },
                    ),
                contentAlignment = Alignment.Center,
            ) {
                Text(
                    text = day.dayOfMonth.toString(),
                    style = TextStyle(
                        fontSize = dim.daySize,
                        fontWeight = if (day.isToday) FontWeight.Bold else FontWeight.Medium,
                        color = dayColor,
                        textAlign = TextAlign.Center,
                    ),
                )
            }
        }

        if (previews.isNotEmpty()) {
            Spacer(modifier = GlanceModifier.height(dim.previewGap))
            for (preview in previews) {
                Box(
                    modifier = GlanceModifier
                        .fillMaxWidth()
                        .background(
                            ReservationColors.chipBackground(
                                preview.colorId,
                                day.inCurrentMonth,
                            ),
                        )
                        .padding(horizontal = 2.dp, vertical = 1.dp),
                    contentAlignment = Alignment.CenterStart,
                ) {
                    Text(
                        text = preview.label,
                        maxLines = 1,
                        style = TextStyle(
                            fontSize = dim.previewSize,
                            fontWeight = FontWeight.Medium,
                            color = if (day.inCurrentMonth) colors.onSurface else colors.onSurfaceVariant,
                        ),
                    )
                }
            }
        }
    }
}
