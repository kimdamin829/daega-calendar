import type { Reservation } from "@/types/reservation";
import { clampMinutes, DEFAULT_DURATION } from "@/lib/dayGrid";
import { newId } from "@/lib/newId";
import { PLACEHOLDER_TIME } from "@/lib/formatReservation";
import { DEFAULT_PARTY_COUNTS } from "@/lib/partyCounts";

export function createPendingReservation(
  date: string,
  startMinutes: number,
  durationMinutes = DEFAULT_DURATION,
): Reservation {
  const clampedStart = clampMinutes(startMinutes, durationMinutes);
  const now = new Date().toISOString();

  return {
    id: newId(),
    date,
    time: PLACEHOLDER_TIME,
    ...DEFAULT_PARTY_COUNTS,
    guest_name: "",
    seat: null,
    memo: null,
    start_minutes: clampedStart,
    duration_minutes: durationMinutes,
    color: null,
    created_at: now,
    updated_at: now,
  };
}
