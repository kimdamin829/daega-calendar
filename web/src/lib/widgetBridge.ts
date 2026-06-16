import type { DaySummary } from "@/lib/monthSummary";

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

/** 앱에 이미 있는 월별 요약을 위젯 캐시에 즉시 반영 */
export function pushWidgetMonthSummaries(viewMonth: Date, daySummaries: Map<string, DaySummary>): void {
  try {
    const days: Record<string, { label: string; color: string | null }[]> = {};
    for (const [date, summary] of daySummaries) {
      days[date] = summary.previews.map((preview) => ({
        label: preview.label,
        color: preview.color,
      }));
    }

    window.DaegaCalendarAndroid?.pushMonthSummaries(
      JSON.stringify({
        year: viewMonth.getFullYear(),
        month: viewMonth.getMonth() + 1,
        days,
      }),
    );
  } catch {
    // WebView 브릿지 없음
  }
}
