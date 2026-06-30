import { useEffect } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import { getKoreaDateKey, koreaDateKeyToDate } from "@/lib/dateUtils";
import { summarizeReservationsByDate } from "@/lib/monthSummary";
import { pushWidgetMonthSummaries } from "@/lib/widgetBridge";
import { useReservationLoader } from "@/hooks/useReservationLoader";

/** 화면과 별도로 위젯 캐시에 해당 월 전체 예약·색상을 push */
export function useWidgetMonthSync(dateKey: string) {
  const monthDate = koreaDateKeyToDate(dateKey);
  const monthStart = getKoreaDateKey(startOfMonth(monthDate));
  const monthEnd = getKoreaDateKey(endOfMonth(monthDate));

  const { reservations, hasLoaded } = useReservationLoader(monthStart, monthEnd);

  useEffect(() => {
    if (!hasLoaded) return;
    pushWidgetMonthSummaries(startOfMonth(monthDate), summarizeReservationsByDate(reservations), {
      allowEmpty: true,
      reason: "status-display",
    });
  }, [hasLoaded, monthDate, reservations]);
}
