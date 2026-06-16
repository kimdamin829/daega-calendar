import { useEffect, useMemo } from "react";
import { koreaDateKeyToDate } from "@/lib/dateUtils";
import { buildStatusBoard } from "@/lib/statusBoard";
import { summarizeReservationsByDate } from "@/lib/monthSummary";
import { pushWidgetMonthSummaries } from "@/lib/widgetBridge";
import { useReservationLoader } from "@/hooks/useReservationLoader";

export function useBoardReservations(dateKey: string) {
  const { reservations, error } = useReservationLoader(dateKey, dateKey);
  const board = useMemo(() => buildStatusBoard(reservations), [reservations]);

  useEffect(() => {
    const viewMonth = koreaDateKeyToDate(dateKey);
    pushWidgetMonthSummaries(
      viewMonth,
      summarizeReservationsByDate(reservations),
      { merge: true },
    );
  }, [dateKey, reservations]);

  return { board, error };
}
