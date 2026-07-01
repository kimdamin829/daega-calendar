package com.daega.calendar.data

data class Reservation(
    val id: String,
    val date: String,
    val time: String,
    val guestName: String,
    val adultCount: Int,
    val childCount: Int,
    val infantCount: Int,
    val partySeparator: String?,
    val seat: String?,
    val memo: String?,
    val color: String?,
    val startMinutes: Int,
    val durationMinutes: Int,
    val createdAt: String,
)

data class ReservationPreview(
    val label: String,
    val colorId: String?,
)

data class DaySummary(
    val previews: List<ReservationPreview> = emptyList(),
)

data class MonthGridDay(
    val dateKey: String,
    val dayOfMonth: Int,
    val inCurrentMonth: Boolean,
    val isToday: Boolean,
    val summary: DaySummary,
)
