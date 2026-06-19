import type { Reservation } from "@/types/reservation";
import { hasRealReservationTime } from "@/lib/reservationConstants";
import { isUnparsedDraft } from "@/lib/reservationDisplay";
import { resolveTimeToMinutes } from "@/lib/timeResolve";

function getReservationSortMinutes(reservation: Reservation): number {
  if (isUnparsedDraft(reservation) || !hasRealReservationTime(reservation.time)) {
    return reservation.start_minutes;
  }

  return resolveTimeToMinutes(reservation.time);
}

export function compareReservationsByTime(a: Reservation, b: Reservation): number {
  const timeDiff = getReservationSortMinutes(a) - getReservationSortMinutes(b);
  if (timeDiff !== 0) return timeDiff;

  const created = a.created_at.localeCompare(b.created_at);
  if (created !== 0) return created;

  return a.id.localeCompare(b.id);
}
