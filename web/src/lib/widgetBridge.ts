import { startOfMonth } from "date-fns";
import type { Reservation } from "@/types/reservation";
import { getKoreaDateKey } from "@/lib/dateUtils";
import {
  summarizeReservationsByDate,
  type DaySummary,
} from "@/lib/monthSummary";

declare global {
  interface Window {
    DaegaCalendarAndroid?: {
      /** 앱에 없는 월 데이터만 백그라운드 동기화 */
      refreshWidget(): void;
      /** 월별 요약을 위젯 캐시에 즉시 반영 */
      pushMonthSummaries(json: string): void;
    };
  }
}

function monthPartsFromDate(viewMonth: Date): { year: number; month: number } {
  const monthKey = getKoreaDateKey(startOfMonth(viewMonth));
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month };
}

function serializeDays(daySummaries: Map<string, DaySummary>): Record<string, { label: string; color: string | null }[]> {
  const days: Record<string, { label: string; color: string | null }[]> = {};
  for (const [date, summary] of daySummaries) {
    days[date] = summary.previews.map((preview) => ({
      label: preview.label,
      color: preview.color,
    }));
  }
  return days;
}

/** 예약 목록에서 위젯으로 즉시 push (저장/삭제 직후 호출) */
export function syncWidgetFromReservations(
  viewMonth: Date,
  reservations: Reservation[],
  options?: { merge?: boolean },
): void {
  pushWidgetMonthSummaries(
    viewMonth,
    summarizeReservationsByDate(reservations),
    options,
  );
}

/** 앱에 이미 있는 월별 요약을 위젯 캐시에 즉시 반영 */
export function pushWidgetMonthSummaries(
  viewMonth: Date,
  daySummaries: Map<string, DaySummary>,
  options?: { merge?: boolean },
): void {
  try {
    const { year, month } = monthPartsFromDate(viewMonth);
    window.DaegaCalendarAndroid?.pushMonthSummaries(
      JSON.stringify({
        year,
        month,
        merge: options?.merge ?? false,
        days: serializeDays(daySummaries),
      }),
    );
  } catch {
    // WebView 브릿지 없음
  }
}
