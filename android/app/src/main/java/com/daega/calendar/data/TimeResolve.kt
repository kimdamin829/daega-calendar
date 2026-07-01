package com.daega.calendar.data

object TimeResolve {
    private fun inferHour24(hour: Int): Int {
        if (hour >= 13) return hour
        if (hour == 10 || hour == 11) return hour
        if (hour == 12) return 12
        if (hour in 1..9) return hour + 12
        return hour
    }

    fun resolveTimeToMinutes(time: String): Int {
        val parts = time.split(":")
        val hours = parts.getOrNull(0)?.toIntOrNull() ?: 0
        val minutes = parts.getOrNull(1)?.toIntOrNull() ?: 0
        return inferHour24(hours) * 60 + minutes
    }
}
