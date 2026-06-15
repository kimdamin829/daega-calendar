import type { ReservationContent } from "@/types/reservation";
import { parsePartyCounts, PartyCountParseError } from "@/lib/partyCounts";

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ParseError";
  }
}

/** 입력란 시각 그대로 저장 (7:00 → 07:00:00) */
function normalizeTime(raw: string): string {
  const trimmed = raw.trim();

  const colonMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (colonMatch) {
    const hour = Number(colonMatch[1]);
    const minutes = Number(colonMatch[2]);
    if (hour < 0 || hour > 23 || minutes < 0 || minutes > 59) {
      throw new ParseError("시간 형식이 올바르지 않습니다. (예: 10:00)");
    }
    return `${String(hour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`;
  }

  const hourOnly = trimmed.match(/^(\d{1,2})시?$/);
  if (hourOnly) {
    const hour = Number(hourOnly[1]);
    if (hour < 0 || hour > 23) {
      throw new ParseError("시간 형식이 올바르지 않습니다. (예: 10:00)");
    }
    return `${String(hour).padStart(2, "0")}:00:00`;
  }

  throw new ParseError("시간 형식이 올바르지 않습니다. (예: 10:00)");
}

function parsePartyCountsField(raw: string) {
  try {
    return parsePartyCounts(raw);
  } catch (err) {
    if (err instanceof PartyCountParseError) {
      throw new ParseError(err.message);
    }
    throw err;
  }
}

export function parseReservationInput(raw: string, date: string): ReservationContent {
  const parts = raw.trim().split(/\s+/).filter(Boolean);

  if (parts.length < 2) {
    throw new ParseError(
      "형식: 시간 인원 [이름] [좌석] [메모…]\n예: 7:00 4명 김다민, 7:00 10.2명 김다민",
    );
  }

  const time = normalizeTime(parts[0]);
  const partyCounts = parsePartyCountsField(parts[1]);
  const guest_name = parts[2] ?? "";
  const seat = parts[3] ?? null;
  const memo = parts.length > 4 ? parts.slice(4).join(" ") : null;

  return {
    date,
    time,
    ...partyCounts,
    guest_name,
    seat,
    memo,
  };
}
