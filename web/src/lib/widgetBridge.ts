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
      refreshWidget(): void;
      pushMonthSummaries(json: string): void;
    };
  }
}

export type WidgetPushOptions = {
  /** true면 기존 캐시에 날짜별로 합침 (현황판 등) */
  merge?: boolean;
  /** true면 예약 0건인 달도 위젯 캐시를 비움 (로드 완료 후에만) */
  allowEmpty?: boolean;
};

function monthPartsFromDate(viewMonth: Date): { year: number; month: number } {
  const monthKey = getKoreaDateKey(startOfMonth(viewMonth));
  const [year, month] = monthKey.split("-").map(Number);
  return { year, month };
}

function serializeDays(
  daySummaries: Map<string, DaySummary>,
): Record<string, { label: string; color: string | null }[]> {
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
  options?: WidgetPushOptions,
): void {
  pushWidgetMonthSummaries(
    viewMonth,
    summarizeReservationsByDate(reservations),
    options,
  );
}

/** 앱 월별 요약 → 위젯 캐시 즉시 반영 */
export function pushWidgetMonthSummaries(
  viewMonth: Date,
  daySummaries: Map<string, DaySummary>,
  options?: WidgetPushOptions,
): void {
  try {
    const bridge = window.DaegaCalendarAndroid;
    if (!bridge) return;

    const days = serializeDays(daySummaries);
    const merge = options?.merge ?? false;
    const allowEmpty = options?.allowEmpty ?? false;

    // 로드 전 빈 push가 위젯 캐시를 막아버리는 것 방지
    if (!merge && !allowEmpty && Object.keys(days).length === 0) {
      return;
    }

    const { year, month } = monthPartsFromDate(viewMonth);
    bridge.pushMonthSummaries(
      JSON.stringify({
        year,
        month,
        merge,
        allowEmpty,
        days,
      }),
    );
    // JS bridge push가 누락되는 기기에서 네트워크 동기화를 보조로 트리거
    bridge.refreshWidget();
  } catch {
    // WebView 브릿지 없음
  }
}
