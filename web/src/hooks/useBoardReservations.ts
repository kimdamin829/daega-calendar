import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Reservation } from "@/types/reservation";
import { buildStatusBoard } from "@/lib/statusBoard";
import { subscribeReservations } from "@/lib/realtime";
import { fetchReservationsInRange } from "@/lib/supabase";

export function useBoardReservations(dateKey: string) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);

    try {
      const data = await fetchReservationsInRange(dateKey, dateKey);
      if (requestId !== requestIdRef.current) return;
      setReservations(data);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "예약 데이터를 불러오지 못했습니다.");
    }
  }, [dateKey]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeReservations(() => void load()), [load]);

  const board = useMemo(() => buildStatusBoard(reservations), [reservations]);

  return { board, error, dateKey };
}
