import type { Reservation } from "@/types/reservation";
import type { ReservationColor } from "@/lib/reservationColors";
import { hasRealReservationTime } from "@/lib/reservationConstants";
import {
  formatReservationDisplay,
  isUnparsedDraft,
} from "@/lib/reservationDisplay";
import { compareReservationsByTime } from "@/lib/reservationSort";

interface MonthPreview {
  label: string;
  color: ReservationColor | null;
}

export interface DaySummary {
  previews: MonthPreview[];
}

export const EMPTY_DAY_SUMMARY: DaySummary = { previews: [] };

function shouldShowInMonthPreview(reservation: Reservation): boolean {
  return isUnparsedDraft(reservation) || hasRealReservationTime(reservation.time);
}

function buildMonthPreviews(reservations: Reservation[]): MonthPreview[] {
  const valid = reservations.filter(shouldShowInMonthPreview);

  return [...valid].sort(compareReservationsByTime).map((reservation) => ({
    label: formatReservationDisplay(reservation),
    color: reservation.color,
  }));
}

export function summarizeReservationsByDate(
  reservations: Reservation[],
): Map<string, DaySummary> {
  const byDate = new Map<string, Reservation[]>();

  for (const reservation of reservations) {
    const dayReservations = byDate.get(reservation.date) ?? [];
    dayReservations.push(reservation);
    byDate.set(reservation.date, dayReservations);
  }

  return new Map(
    [...byDate.entries()].map(([date, dayReservations]) => [
      date,
      { previews: buildMonthPreviews(dayReservations) },
    ]),
  );
}
