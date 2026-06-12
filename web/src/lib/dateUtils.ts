import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  setMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ko } from "date-fns/locale";

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
  return isToday(day);
}

export function isFutureDate(day: Date): boolean {
  return isAfter(startOfDay(day), startOfDay(new Date()));
}

export function isTodayMonth(month: Date): boolean {
  return isSameMonth(month, new Date());
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
