import type { PartyCounts } from "@/lib/partyCounts";
import { getPartySize } from "@/lib/partyCounts";

/** 타임라인에서 새 블록 생성 시 time 컬럼용 — 실제 예약 시간과 무관 */
export const PLACEHOLDER_TIME = "00:00:00";

export function formatTime(time: string): string {
  const [hourStr, minuteStr] = time.split(":");
  const hour = Number(hourStr);
  const minute = Number(minuteStr);

  return `${hour}:${String(minute).padStart(2, "0")}`;
}

function hasRealTime(time: string): boolean {
  return time !== PLACEHOLDER_TIME;
}

export function formatReservationLine(
  reservation: PartyCounts & {
    time: string;
    guest_name: string;
    seat: string | null;
    memo: string | null;
  },
): string {
  const partySize = getPartySize(reservation);
  const segments: string[] = [];

  if (hasRealTime(reservation.time)) {
    segments.push(formatTime(reservation.time));
  }

  if (reservation.guest_name) {
    if (partySize > 1) {
      segments.push(`${partySize}명`);
    }
    segments.push(reservation.guest_name);
  } else if (partySize > 1) {
    segments.push(`${partySize}명`);
  }

  const base = segments.join(" ");
  return [base, reservation.seat, reservation.memo].filter(Boolean).join(" ");
}
