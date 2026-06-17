import type { Reservation } from "@/types/reservation";
import { compareReservationsByTime } from "@/lib/reservationSort";

export interface BlockLayout {
  column: number;
  totalColumns: number;
}

function overlapsTimeline(a: Reservation, b: Reservation): boolean {
  return (
    a.start_minutes < b.start_minutes + b.duration_minutes &&
    b.start_minutes < a.start_minutes + a.duration_minutes
  );
}

function endMinutes(reservation: Reservation): number {
  return reservation.start_minutes + reservation.duration_minutes;
}

function splitConnectedGroups(sorted: Reservation[]): Reservation[][] {
  const groups: Reservation[][] = [];
  let current: Reservation[] = [];
  let currentEnd = -1;

  for (const reservation of sorted) {
    if (current.length === 0 || reservation.start_minutes < currentEnd) {
      current.push(reservation);
      currentEnd = Math.max(currentEnd, endMinutes(reservation));
      continue;
    }

    groups.push(current);
    current = [reservation];
    currentEnd = endMinutes(reservation);
  }

  if (current.length > 0) groups.push(current);
  return groups;
}

function layoutGroup(group: Reservation[], layouts: Map<string, BlockLayout>) {
  const sorted = [...group].sort(compareReservationsByTime);
  const activeByColumn: (Reservation | null)[] = [];
  const columnById = new Map<string, number>();
  let maxColumns = 0;

  for (const reservation of sorted) {
    let placedColumn = -1;

    for (let col = 0; col < activeByColumn.length; col += 1) {
      const active = activeByColumn[col];
      if (!active || !overlapsTimeline(active, reservation)) {
        placedColumn = col;
        break;
      }
    }

    if (placedColumn === -1) {
      placedColumn = activeByColumn.length;
      activeByColumn.push(null);
    }

    activeByColumn[placedColumn] = reservation;
    columnById.set(reservation.id, placedColumn);
    maxColumns = Math.max(maxColumns, placedColumn + 1);
  }

  for (const reservation of sorted) {
    layouts.set(reservation.id, {
      column: columnById.get(reservation.id) ?? 0,
      totalColumns: maxColumns,
    });
  }
}

export function layoutReservations(reservations: Reservation[]): Map<string, BlockLayout> {
  const layouts = new Map<string, BlockLayout>();
  const sorted = [...reservations].sort(compareReservationsByTime);

  for (const group of splitConnectedGroups(sorted)) {
    layoutGroup(group, layouts);
  }

  return layouts;
}
