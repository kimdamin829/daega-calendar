/** 타임라인에서 새 블록 생성 시 time 컬럼용 — 실제 예약 시간과 무관 */
export const PLACEHOLDER_TIME = "00:00:00";

export const PLACEHOLDER_GUEST = "새 예약";

export function hasRealReservationTime(time: string): boolean {
  return time !== PLACEHOLDER_TIME;
}
