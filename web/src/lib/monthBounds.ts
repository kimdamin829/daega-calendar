import { endOfMonth, startOfMonth } from "date-fns";
import { getKoreaDateKey, koreaDateKeyToDate } from "@/lib/dateUtils";

export function getMonthBounds(dateKey: string) {
  const monthDate = koreaDateKeyToDate(dateKey);
  return {
    monthDate,
    monthStart: getKoreaDateKey(startOfMonth(monthDate)),
    monthEnd: getKoreaDateKey(endOfMonth(monthDate)),
    viewMonth: startOfMonth(monthDate),
  };
}
