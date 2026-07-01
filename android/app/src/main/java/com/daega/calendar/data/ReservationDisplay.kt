package com.daega.calendar.data

object ReservationDisplay {
    private const val PLACEHOLDER_TIME = "00:00:00"
    private const val PLACEHOLDER_GUEST = "새 예약"

    fun isPlaceholder(reservation: Reservation): Boolean {
        return reservation.guestName.isBlank() || reservation.guestName == PLACEHOLDER_GUEST
    }

    fun formatLine(reservation: Reservation): String {
        if (isUnparsedDraft(reservation)) {
            return reservation.memo.orEmpty()
        }
        if (isPlaceholder(reservation)) {
            return formatPartialLine(reservation)
        }
        return formatFullLine(reservation)
    }

    fun isUnparsedDraft(reservation: Reservation): Boolean {
        return isPlaceholder(reservation) && !reservation.memo.isNullOrBlank()
    }

    private fun shouldShowPartyLabel(reservation: Reservation): Boolean {
        return reservation.childCount > 0 ||
            reservation.infantCount > 0 ||
            reservation.adultCount > 1
    }

    private fun formatPartyLabel(reservation: Reservation): String {
        if (reservation.childCount == 0 && reservation.infantCount == 0) {
            return "${reservation.adultCount}명"
        }

        val parts = mutableListOf(reservation.adultCount, reservation.childCount)
        if (reservation.infantCount > 0) {
            parts.add(reservation.infantCount)
        }
        val separator = reservation.partySeparator ?: "."
        return "${parts.joinToString(separator)}명"
    }

    private fun formatPartialLine(reservation: Reservation): String {
        val parts = mutableListOf<String>()
        if (reservation.time != PLACEHOLDER_TIME) {
            parts.add(formatTime(reservation.time))
        }
        if (shouldShowPartyLabel(reservation)) {
            parts.add(formatPartyLabel(reservation))
        }
        return parts.joinToString(" ")
    }

    private fun formatFullLine(reservation: Reservation): String {
        val segments = mutableListOf<String>()
        if (reservation.time != PLACEHOLDER_TIME) {
            segments.add(formatTime(reservation.time))
        }
        if (reservation.guestName.isNotBlank()) {
            if (shouldShowPartyLabel(reservation)) {
                segments.add(formatPartyLabel(reservation))
            }
            segments.add(reservation.guestName)
        } else if (shouldShowPartyLabel(reservation)) {
            segments.add(formatPartyLabel(reservation))
        }

        val base = segments.joinToString(" ")
        return listOfNotNull(base, reservation.seat, reservation.memo)
            .filter { it.isNotBlank() }
            .joinToString(" ")
    }

    private fun formatTime(time: String): String {
        val parts = time.split(":")
        val hour = parts.getOrNull(0)?.toIntOrNull() ?: 0
        val minute = parts.getOrNull(1)?.toIntOrNull() ?: 0
        return "$hour:${minute.toString().padStart(2, '0')}"
    }
}
