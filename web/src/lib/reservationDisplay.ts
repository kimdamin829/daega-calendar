import { formatReservationLine, formatTime, PLACEHOLDER_TIME } from "@/lib/formatReservation";

export function isPlaceholderReservation(reservation: { guest_name: string }): boolean {
  return !reservation.guest_name || reservation.guest_name === "새 예약";
}

/** 형식 오류로 memo에 통째로 저장된 미파싱 입력 */
export function isUnparsedDraft(reservation: { guest_name: string; memo: string | null }): boolean {
  return isPlaceholderReservation(reservation) && Boolean(reservation.memo?.trim());
}

/** DB에만 남은 빈 블록 — 입력 없이 생성됐다가 UI에서 사라진 경우 */
export function isOrphanPlaceholder(reservation: {
  guest_name: string;
  time: string;
  memo: string | null;
}): boolean {
  return (
    isPlaceholderReservation(reservation) &&
    !isUnparsedDraft(reservation) &&
    reservation.time === PLACEHOLDER_TIME
  );
}

/** 일별 타임라인에 블록으로 표시할지 (빈 새 블록만 숨김) */
export function shouldShowOnDayTimeline(
  reservation: { id: string; guest_name: string; time: string; memo: string | null },
  editingId: string | null,
): boolean {
  if (reservation.id === editingId) return true;
  if (isUnparsedDraft(reservation)) return true;
  if (!isPlaceholderReservation(reservation)) return true;
  if (reservation.time !== PLACEHOLDER_TIME) return true;
  return false;
}

function formatPartialReservationLine(reservation: {
  time: string;
  party_size: number;
}): string {
  const parts: string[] = [];
  if (reservation.time !== PLACEHOLDER_TIME) {
    parts.push(formatTime(reservation.time));
  }
  if (reservation.party_size > 1) {
    parts.push(`${reservation.party_size}명`);
  }
  return parts.join(" ");
}

function formatReservationDisplay(reservation: {
  time: string;
  party_size: number;
  guest_name: string;
  seat: string | null;
  memo: string | null;
}): string {
  if (isUnparsedDraft(reservation)) {
    return reservation.memo ?? "";
  }
  if (isPlaceholderReservation(reservation)) {
    return formatPartialReservationLine(reservation);
  }
  return formatReservationLine(reservation);
}

export { formatReservationDisplay };
