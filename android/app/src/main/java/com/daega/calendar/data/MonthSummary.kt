package com.daega.calendar.data

object MonthSummary {
    private const val PLACEHOLDER_TIME = "00:00:00"

    fun summarizeByDate(reservations: List<Reservation>): Map<String, DaySummary> {
        val byDate = linkedMapOf<String, MutableList<Reservation>>()

        for (reservation in reservations) {
            byDate.getOrPut(reservation.date) { mutableListOf() }.add(reservation)
        }

        return byDate.mapValues { (_, dayReservations) ->
            DaySummary(previews = buildPreviews(dayReservations))
        }
    }

    private fun buildPreviews(reservations: List<Reservation>): List<ReservationPreview> {
        val valid = reservations.filter {
            ReservationDisplay.isUnparsedDraft(it) || it.time != PLACEHOLDER_TIME
        }

        return valid
            .sortedWith(::comparePreviews)
            .map { reservation ->
                ReservationPreview(
                    label = ReservationDisplay.formatLine(reservation),
                    colorId = reservation.color,
                )
            }
    }

    private fun getPreviewSortMinutes(reservation: Reservation): Int {
        return if (
            ReservationDisplay.isUnparsedDraft(reservation) || reservation.time == PLACEHOLDER_TIME
        ) {
            reservation.startMinutes
        } else {
            TimeResolve.resolveTimeToMinutes(reservation.time)
        }
    }

    private fun comparePreviews(a: Reservation, b: Reservation): Int {
        val timeDiff = getPreviewSortMinutes(a) - getPreviewSortMinutes(b)
        if (timeDiff != 0) return timeDiff

        val created = a.createdAt.compareTo(b.createdAt)
        if (created != 0) return created

        return a.id.compareTo(b.id)
    }
}
