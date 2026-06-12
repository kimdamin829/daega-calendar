import type { Reservation } from "@/types/reservation";

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

function compareReservations(a: Reservation, b: Reservation): number {
  const startDiff = a.start_minutes - b.start_minutes;
  if (startDiff !== 0) return startDiff;

  const created = a.created_at.localeCompare(b.created_at);
  if (created !== 0) return created;

  return a.id.localeCompare(b.id);
}

function getOverlapGroups(reservations: Reservation[]): Reservation[][] {
  const sorted = [...reservations].sort(compareReservations);
  const visited = new Set<string>();
  const groups: Reservation[][] = [];

  for (const event of sorted) {
    if (visited.has(event.id)) continue;

    const group: Reservation[] = [];
    const stack = [event];

    while (stack.length > 0) {
      const current = stack.pop()!;
      if (visited.has(current.id)) continue;

      visited.add(current.id);
      group.push(current);

      for (const other of sorted) {
        if (!visited.has(other.id) && overlapsTimeline(current, other)) {
          stack.push(other);
        }
      }
    }

    groups.push(group);
  }

  return groups;
}

export function layoutReservations(reservations: Reservation[]): Map<string, BlockLayout> {
  const layouts = new Map<string, BlockLayout>();

  for (const group of getOverlapGroups(reservations)) {
    const groupSorted = [...group].sort(compareReservations);
    const totalColumns = groupSorted.length;

    groupSorted.forEach((event, column) => {
      layouts.set(event.id, { column, totalColumns });
    });
  }

  return layouts;
}
