/** 10·11시는 오전, 1–9시는 오후, 12시는 정오. 13시 이상은 24시간 그대로 */
function inferHour24(hour: number): number {
  if (hour >= 13) return hour;
  if (hour === 10 || hour === 11) return hour;
  if (hour === 12) return 12;
  if (hour >= 1 && hour <= 9) return hour + 12;
  return hour;
}

/** 저장된 time 문자열을 실제 시각(분)으로 해석 — 표시 형식과 무관하게 점심/저녁·타임라인에 사용 */
export function resolveTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return inferHour24(hours ?? 0) * 60 + (minutes ?? 0);
}
