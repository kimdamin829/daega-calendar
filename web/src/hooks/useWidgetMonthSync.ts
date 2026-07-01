import { useEffect } from "react";
import { summarizeReservationsByDate } from "@/lib/monthSummary";
import { getMonthBounds } from "@/lib/monthBounds";
import { pushWidgetMonthSummaries } from "@/lib/widgetBridge";
import { useReservationLoader } from "@/hooks/useReservationLoader";

/** 화면과 별도로 위젯 캐시에 해당 월 전체 예약·색상을 push */
export function useWidgetMonthSync(dateKey: string) {
  const { monthStart, monthEnd, viewMonth } = getMonthBounds(dateKey);
  const { reservations, hasLoaded } = useReservationLoader(monthStart, monthEnd);

  useEffect(() => {
    if (!hasLoaded) return;
    pushWidgetMonthSummaries(viewMonth, summarizeReservationsByDate(reservations), {
      allowEmpty: true,
      reason: "status-display",
    });
  }, [hasLoaded, viewMonth, reservations]);
}
