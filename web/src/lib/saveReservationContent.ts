import type { Reservation } from "@/types/reservation";
import type { ReservationColor } from "@/lib/reservationColors";
import { PLACEHOLDER_TIME } from "@/lib/reservationConstants";
import { parseReservationInput, ParseError } from "@/lib/parseReservation";
import { DEFAULT_PARTY_COUNTS } from "@/lib/partyCounts";
import { createReservation, updateReservation } from "@/lib/supabase";

type ReservationContentPayload = {
  time: string;
  adult_count: number;
  child_count: number;
  infant_count: number;
  guest_name: string;
  seat: string | null;
  memo: string | null;
  start_minutes: number;
  duration_minutes: number;
  color: ReservationColor | null;
};

function buildPayload(draft: Reservation, content: Omit<ReservationContentPayload, "start_minutes" | "duration_minutes" | "color">): ReservationContentPayload {
  return {
    ...content,
    start_minutes: draft.start_minutes,
    duration_minutes: draft.duration_minutes,
    color: draft.color ?? null,
  };
}

async function persistPayload(
  draft: Reservation,
  dateKey: string,
  existing: Reservation | undefined,
  payload: ReservationContentPayload,
): Promise<Reservation> {
  if (existing) {
    await updateReservation(draft.id, payload);
    return { ...existing, ...payload };
  }

  return createReservation({ date: dateKey, ...payload });
}

export async function saveReservationContentToDb(
  draft: Reservation,
  raw: string,
  dateKey: string,
  existing: Reservation | undefined,
): Promise<Reservation> {
  try {
    const parsed = parseReservationInput(raw, dateKey);
    return persistPayload(
      draft,
      dateKey,
      existing,
      buildPayload(draft, {
        time: parsed.time,
        adult_count: parsed.adult_count,
        child_count: parsed.child_count,
        infant_count: parsed.infant_count,
        guest_name: parsed.guest_name,
        seat: parsed.seat,
        memo: parsed.memo,
      }),
    );
  } catch (err) {
    if (!(err instanceof ParseError)) throw err;

    return persistPayload(
      draft,
      dateKey,
      existing,
      buildPayload(draft, {
        time: PLACEHOLDER_TIME,
        ...DEFAULT_PARTY_COUNTS,
        guest_name: "",
        seat: null,
        memo: raw.trim(),
      }),
    );
  }
}
