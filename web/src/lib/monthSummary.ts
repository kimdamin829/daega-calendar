import type { Reservation } from "@/types/reservation";
import type { ReservationColor } from "@/lib/reservationColors";
import { PLACEHOLDER_TIME } from "@/lib/formatReservation";
import {
  formatReservationDisplay,
  isPlaceholderReservation,
  isUnparsedDraft,
} from "@/lib/reservationDisplay";
import { resolveTimeToMinutes } from "@/lib/timeResolve";

export interface MonthPreview {
  label: string;
  color: ReservationColor | null;
}

export interface DaySummary {
  previews: MonthPreview[];
}

export const EMPTY_DAY_SUMMARY: DaySummary = { previews: [] };

function getMonthPreviewSortMinutes(reservation: Reservation): number {
  if (isUnparsedDraft(reservation) || reservation.time === PLACEHOLDER_TIME) {
    return reservation.start_minutes;
  }

  return resolveTimeToMinutes(reservation.time);
}

function compareMonthPreviews(a: Reservation, b: Reservation): number {
  const timeDiff = getMonthPreviewSortMinutes(a) - getMonthPreviewSortMinutes(b);
  if (timeDiff !== 0) return timeDiff;

  const created = a.created_at.localeCompare(b.created_at);
  if (created !== 0) return created;

  return a.id.localeCompare(b.id);
}

function buildMonthPreviews(reservations: Reservation[]): MonthPreview[] {
  const valid = reservations.filter(
    (reservation) =>
      isUnparsedDraft(reservation) ||
      (!isPlaceholderReservation(reservation) && reservation.time !== PLACEHOLDER_TIME),
  );

  return [...valid].sort(compareMonthPreviews).map((reservation) => ({
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
