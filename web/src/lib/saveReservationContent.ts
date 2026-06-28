import type { Reservation, ReservationContentPayload } from "@/types/reservation";
import { PLACEHOLDER_TIME } from "@/lib/reservationConstants";
import { parseReservationInput, ParseError } from "@/lib/parseReservation";
import { DEFAULT_PARTY_COUNTS } from "@/lib/partyCounts";
import { createReservation, updateReservation } from "@/lib/supabase";

type ParsedContentFields = Omit<
  ReservationContentPayload,
  "start_minutes" | "duration_minutes" | "color"
>;

function buildPayload(
  draft: Reservation,
  content: ParsedContentFields,
): ReservationContentPayload {
  return {
    ...content,
    start_minutes: draft.start_minutes,
    duration_minutes: draft.duration_minutes,
    color: draft.color ?? null,
  };
}

function parseContentFromRaw(raw: string, dateKey: string): ParsedContentFields {
  try {
    const parsed = parseReservationInput(raw, dateKey);
    return {
      time: parsed.time,
      adult_count: parsed.adult_count,
      child_count: parsed.child_count,
      infant_count: parsed.infant_count,
      party_separator: parsed.party_separator,
      guest_name: parsed.guest_name,
      seat: parsed.seat,
      memo: parsed.memo,
    };
  } catch (err) {
    if (!(err instanceof ParseError)) throw err;

    return {
      time: PLACEHOLDER_TIME,
      ...DEFAULT_PARTY_COUNTS,
      party_separator: null,
      guest_name: "",
      seat: null,
      memo: raw.trim(),
    };
  }
}

async function persistPayload(
  draft: Reservation,
  dateKey: string,
  existing: Reservation | undefined,
  payload: ReservationContentPayload,
): Promise<Reservation> {
  if (existing) {
    const saved = await updateReservation(draft.id, payload);
    return saved;
  }

  return createReservation({ id: draft.id, date: dateKey, ...payload });
}

/** DB 저장 전 월별뷰·위젯에 바로 반영할 낙관적 예약 */
export function previewReservationContentFromRaw(
  draft: Reservation,
  raw: string,
  dateKey: string,
  existing: Reservation | undefined,
): Reservation {
  const base = existing ?? draft;
  const payload = buildPayload(draft, parseContentFromRaw(raw, dateKey));
  return { ...base, ...payload, date: dateKey };
}

export async function saveReservationContentToDb(
  draft: Reservation,
  raw: string,
  dateKey: string,
  existing: Reservation | undefined,
): Promise<Reservation> {
  return persistPayload(
    draft,
    dateKey,
    existing,
    buildPayload(draft, parseContentFromRaw(raw, dateKey)),
  );
}
