import { useMemo } from "react";
import { buildStatusBoard } from "@/lib/statusBoard";
import { useReservationLoader } from "@/hooks/useReservationLoader";

export function useBoardReservations(dateKey: string) {
  const { reservations, error } = useReservationLoader(dateKey, dateKey);
  const board = useMemo(() => buildStatusBoard(reservations), [reservations]);

  return { board, error };
}
