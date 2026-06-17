import { useCallback, useEffect, useRef, useState } from "react";
import type { Reservation } from "@/types/reservation";
import { subscribeReservations } from "@/lib/realtime";
import { fetchReservationsInRange } from "@/lib/supabase";

const LOAD_ERROR = "예약 데이터를 불러오지 못했습니다.";
const REFRESH_COOLDOWN_MS = 30_000;

type ReservationTransform = (data: Reservation[]) => Reservation[] | Promise<Reservation[]>;

export function useReservationLoader(
  start: string,
  end: string,
  transform?: ReservationTransform,
) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const requestIdRef = useRef(0);
  const transformRef = useRef(transform);
  const lastLoadAtRef = useRef(0);
  transformRef.current = transform;

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);

    try {
      const data = await fetchReservationsInRange(start, end);
      if (requestId !== requestIdRef.current) return;

      const next = transformRef.current ? await transformRef.current(data) : data;
      if (requestId !== requestIdRef.current) return;
      setReservations(next);
      setHasLoaded(true);
      lastLoadAtRef.current = Date.now();
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : LOAD_ERROR);
      setHasLoaded(true);
    }
  }, [start, end]);

  useEffect(() => {
    setHasLoaded(false);
    void load();
  }, [load]);

  useEffect(() => subscribeReservations(() => void load()), [load]);

  useEffect(() => {
    const refreshIfStale = () => {
      if (Date.now() - lastLoadAtRef.current < REFRESH_COOLDOWN_MS) return;
      void load();
    };

    const onOnline = () => {
      // Network recovery should reconcile missed realtime events immediately.
      void load();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      refreshIfStale();
    };

    window.addEventListener("online", onOnline);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("online", onOnline);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [load]);

  return { reservations, setReservations, error, load, hasLoaded };
}
