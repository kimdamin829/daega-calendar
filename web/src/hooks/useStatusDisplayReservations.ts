import { useMemo } from "react";
import type { Reservation } from "@/types/reservation";
import { useReservationLoader } from "@/hooks/useReservationLoader";
import { useWidgetMonthSync } from "@/hooks/useWidgetMonthSync";

export function useStatusDisplayReservations<T>(
  dateKey: string,
  build: (reservations: Reservation[]) => T,
) {
  const { reservations, error } = useReservationLoader(dateKey, dateKey);
  useWidgetMonthSync(dateKey);

  const data = useMemo(() => build(reservations), [build, reservations]);

  return { data, error };
}
