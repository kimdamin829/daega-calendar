import { useEffect, useMemo } from "react";
import type { Reservation } from "@/types/reservation";
import { koreaDateKeyToDate } from "@/lib/dateUtils";
import { summarizeReservationsByDate } from "@/lib/monthSummary";
import { pushWidgetMonthSummaries } from "@/lib/widgetBridge";
import { useReservationLoader } from "@/hooks/useReservationLoader";

export function useStatusDisplayReservations<T>(
  dateKey: string,
  build: (reservations: Reservation[]) => T,
) {
  const { reservations, error, hasLoaded } = useReservationLoader(dateKey, dateKey);
  const data = useMemo(() => build(reservations), [reservations]);

  useEffect(() => {
    if (!hasLoaded) return;
    const month = koreaDateKeyToDate(dateKey);
    pushWidgetMonthSummaries(month, summarizeReservationsByDate(reservations), {
      merge: true,
      allowEmpty: true,
    });
  }, [dateKey, hasLoaded, reservations]);

  return { data, error };
}
