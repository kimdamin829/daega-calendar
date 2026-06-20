import type { Reservation } from "@/types/reservation";
import { hasRealReservationTime } from "@/lib/reservationConstants";
import {
  isPlaceholderReservation,
  isUnparsedDraft,
} from "@/lib/reservationDisplay";

function hasValidReservationContent(reservation: Reservation): boolean {
  if (isPlaceholderReservation(reservation)) return false;
  if (isUnparsedDraft(reservation)) return false;
  if (!hasRealReservationTime(reservation.time)) return false;
  return true;
}

export function isEligibleForTodaySummary(reservation: Reservation): boolean {
  return hasValidReservationContent(reservation);
}

export function isEligibleForStatusDisplay(reservation: Reservation): boolean {
  return hasValidReservationContent(reservation) && reservation.color !== "gray";
}
