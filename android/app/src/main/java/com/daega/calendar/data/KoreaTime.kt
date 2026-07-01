package com.daega.calendar.data

import java.time.LocalDate
import java.time.YearMonth
import java.time.ZoneId

/** 식당 기준 시간대 — web dateUtils.ts Asia/Seoul 과 동일 */
object KoreaTime {
    val zone: ZoneId = ZoneId.of("Asia/Seoul")

    fun today(): LocalDate = LocalDate.now(zone)

    fun currentMonth(): YearMonth = YearMonth.now(zone)
}
