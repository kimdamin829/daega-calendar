import type { ReservationDisplaySource } from "@/types/reservation";
import { formatPartyLabel, shouldShowPartyLabel } from "@/lib/partyCounts";
import { hasRealReservationTime } from "@/lib/reservationConstants";

export function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  return `${hour}:${String(minute).padStart(2, "0")}`;
}

export function formatReservationLine(reservation: ReservationDisplaySource): string {
  const segments: string[] = [];

  if (hasRealReservationTime(reservation.time)) {
    segments.push(formatTime(reservation.time));
  }

  if (reservation.guest_name) {
    if (shouldShowPartyLabel(reservation)) {
      segments.push(formatPartyLabel(reservation, reservation.party_separator));
    }
    segments.push(reservation.guest_name);
  } else if (shouldShowPartyLabel(reservation)) {
    segments.push(formatPartyLabel(reservation, reservation.party_separator));
  }

  const base = segments.join(" ");
  return [base, reservation.seat, reservation.memo].filter(Boolean).join(" ");
}
