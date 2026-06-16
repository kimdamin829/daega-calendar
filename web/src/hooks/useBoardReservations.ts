import { useEffect, useMemo } from "react";
import { koreaDateKeyToDate } from "@/lib/dateUtils";
import { buildStatusBoard } from "@/lib/statusBoard";
import { summarizeReservationsByDate } from "@/lib/monthSummary";
import { pushWidgetMonthSummaries } from "@/lib/widgetBridge";
import { useReservationLoader } from "@/hooks/useReservationLoader";

export function useBoardReservations(dateKey: string) {
  const { reservations, error, hasLoaded } = useReservationLoader(dateKey, dateKey);
  const board = useMemo(() => buildStatusBoard(reservations), [reservations]);

  useEffect(() => {
    if (!hasLoaded) return;
    pushWidgetMonthSummaries(
      koreaDateKeyToDate(dateKey),
      summarizeReservationsByDate(reservations),
      { merge: true, allowEmpty: true },
    );
  }, [dateKey, hasLoaded, reservations]);

  return { board, error };
}
