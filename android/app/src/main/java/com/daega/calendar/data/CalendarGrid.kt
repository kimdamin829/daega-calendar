package com.daega.calendar.data

import java.time.DayOfWeek
import java.time.LocalDate
import java.time.YearMonth
import java.time.format.DateTimeFormatter
import java.time.temporal.TemporalAdjusters

object CalendarGrid {
    private val dateFormatter = DateTimeFormatter.ISO_LOCAL_DATE

    fun formatTitle(month: YearMonth): String =
        "${month.year}년 ${month.monthValue}월"

    fun buildMonthDays(
        month: YearMonth,
        summaries: Map<String, DaySummary>,
        today: LocalDate = KoreaTime.today(),
    ): List<MonthGridDay> {
        val monthStart = month.atDay(1)
        val monthEnd = month.atEndOfMonth()
        val gridStart = monthStart.with(TemporalAdjusters.previousOrSame(DayOfWeek.SUNDAY))
        val gridEnd = monthEnd.with(TemporalAdjusters.nextOrSame(DayOfWeek.SATURDAY))

        val days = mutableListOf<MonthGridDay>()
        var cursor = gridStart
        while (!cursor.isAfter(gridEnd)) {
            val dateKey = cursor.format(dateFormatter)
            val inMonth = cursor.month == month.month
            val summary = if (inMonth) {
                summaries[dateKey] ?: DaySummary()
            } else {
                DaySummary()
            }

            days.add(
                MonthGridDay(
                    dateKey = dateKey,
                    dayOfMonth = cursor.dayOfMonth,
                    inCurrentMonth = inMonth,
                    isToday = cursor == today,
                    summary = summary,
                ),
            )
            cursor = cursor.plusDays(1)
        }
        return days
    }
}
