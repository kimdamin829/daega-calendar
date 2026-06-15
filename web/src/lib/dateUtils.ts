import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  parseISO,
  setMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";

/** 식당 기준 시간대 — 예약 날짜·현황판·오늘 표시 */
export const KOREA_TIMEZONE = "Asia/Seoul";

/** 현재 시각 기준 한국 날짜 (yyyy-MM-dd) */
export function getKoreaDateKey(reference: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KOREA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(reference);
}

/** 한국 날짜 키 → 달력/제목 표시용 Date (해당 일자 로컬 자정) */
export function koreaDateKeyToDate(dateKey: string): Date {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function getKoreaTodayDate(): Date {
  return koreaDateKeyToDate(getKoreaDateKey());
}

export function toDateString(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function formatMonthTitle(date: Date): string {
  return format(date, "yyyy년 M월", { locale: ko });
}

export function formatSelectedDateTitle(date: Date): string {
  return format(date, "M월 d일 (EEE)", { locale: ko });
}

export function formatShortMonth(date: Date): string {
  return format(date, "M월", { locale: ko });
}

export function getMonthsInYear(year: number): Date[] {
  return Array.from({ length: 12 }, (_, index) =>
    startOfMonth(setMonth(new Date(year, 0, 1), index)),
  );
}

export function syncMonthToDate(date: Date, month: Date): Date | null {
  return isSameMonth(date, month) ? null : startOfMonth(date);
}

export function getCalendarDays(month: Date): Date[] {
  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  return eachDayOfInterval({ start: gridStart, end: gridEnd });
}

export function isCurrentMonth(day: Date, month: Date): boolean {
  return isSameMonth(day, month);
}

export function isTodayDate(day: Date): boolean {
  return toDateString(day) === getKoreaDateKey();
}

export function isFutureDate(day: Date): boolean {
  return toDateString(day) > getKoreaDateKey();
}

export function isTodayMonth(month: Date): boolean {
  return isSameMonth(month, getKoreaTodayDate());
}

export function isSameDate(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

export function parseDateParam(value: string | null): Date | null {
  if (!value) return null;

  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

export function shiftMonth(month: Date, delta: number): Date {
  return addMonths(month, delta);
}

export const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"] as const;
