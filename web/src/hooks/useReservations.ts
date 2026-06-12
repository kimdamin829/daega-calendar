import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import type { Reservation } from "@/types/reservation";
import { PLACEHOLDER_TIME } from "@/lib/formatReservation";
import { isOrphanPlaceholder } from "@/lib/reservationDisplay";
import type { ReservationColor } from "@/lib/reservationColors";
import {
  createReservation,
  deleteReservation,
  fetchReservationsInRange,
  updateReservation,
} from "@/lib/supabase";
import { subscribeReservations } from "@/lib/realtime";
import { toDateString } from "@/lib/dateUtils";
import { parseReservationInput, ParseError } from "@/lib/parseReservation";
import {
  EMPTY_DAY_SUMMARY,
  summarizeReservationsByDate,
  type DaySummary,
} from "@/lib/monthSummary";

export function useReservations(month: Date, selectedDate: Date) {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const monthStart = toDateString(startOfMonth(month));
  const monthEnd = toDateString(endOfMonth(month));
  const selectedDateKey = toDateString(selectedDate);

  const load = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setError(null);

    try {
      const data = await fetchReservationsInRange(monthStart, monthEnd);
      if (requestId !== requestIdRef.current) return;

      const orphans = data.filter(isOrphanPlaceholder);
      if (orphans.length > 0) {
        await Promise.all(
          orphans.map((reservation) =>
            deleteReservation(reservation.id).catch(() => undefined),
          ),
        );
      }

      setReservations(data.filter((reservation) => !isOrphanPlaceholder(reservation)));
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : "예약 데이터를 불러오지 못했습니다.");
    }
  }, [monthStart, monthEnd]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => subscribeReservations(() => void load()), [load]);

  const daySummaries = useMemo(
    () => summarizeReservationsByDate(reservations),
    [reservations],
  );

  const dayReservations = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.date === selectedDateKey)
        .sort((a, b) => a.start_minutes - b.start_minutes),
    [reservations, selectedDateKey],
  );

  const getDaySummary = useCallback(
    (dateKey: string): DaySummary => daySummaries.get(dateKey) ?? EMPTY_DAY_SUMMARY,
    [daySummaries],
  );

  const patchReservation = useCallback(
    (id: string, patch: Partial<Reservation>) => {
      setReservations((prev) =>
        prev.map((reservation) =>
          reservation.id === id ? { ...reservation, ...patch } : reservation,
        ),
      );
    },
    [],
  );

  const saveReservationContent = useCallback(
    async (draft: Reservation, raw: string) => {
      const existing = reservations.find((reservation) => reservation.id === draft.id);
      const startMinutes = draft.start_minutes;
      const durationMinutes = draft.duration_minutes;
      const color = draft.color ?? null;

      const replaceDraft = (saved: Reservation) => {
        setReservations((prev) =>
          [...prev.filter((reservation) => reservation.id !== draft.id), saved].sort(
            (a, b) => a.start_minutes - b.start_minutes,
          ),
        );
        return saved;
      };

      try {
        const parsed = parseReservationInput(raw, selectedDateKey);
        const payload = {
          time: parsed.time,
          party_size: parsed.party_size,
          guest_name: parsed.guest_name,
          seat: parsed.seat,
          memo: parsed.memo,
          start_minutes: startMinutes,
          duration_minutes: durationMinutes,
          color,
        };

        if (existing) {
          await updateReservation(draft.id, payload);
          patchReservation(draft.id, payload);
          return;
        }

        replaceDraft(await createReservation({ date: selectedDateKey, ...payload }));
      } catch (err) {
        if (!(err instanceof ParseError)) throw err;

        const payload = {
          time: PLACEHOLDER_TIME,
          party_size: 1,
          guest_name: "",
          seat: null,
          memo: raw.trim(),
          start_minutes: startMinutes,
          duration_minutes: durationMinutes,
          color,
        };

        if (existing) {
          await updateReservation(draft.id, payload);
          patchReservation(draft.id, payload);
          return;
        }

        replaceDraft(await createReservation({ date: selectedDateKey, ...payload }));
      }
    },
    [selectedDateKey, patchReservation, reservations],
  );

  const updatePosition = useCallback(
    async (id: string, startMinutes: number, durationMinutes: number) => {
      patchReservation(id, {
        start_minutes: startMinutes,
        duration_minutes: durationMinutes,
      });

      try {
        await updateReservation(id, {
          start_minutes: startMinutes,
          duration_minutes: durationMinutes,
        });
      } catch {
        await load();
      }
    },
    [patchReservation, load],
  );

  const updateColor = useCallback(
    async (id: string, color: ReservationColor | null) => {
      patchReservation(id, { color });

      try {
        await updateReservation(id, { color });
      } catch {
        await load();
      }
    },
    [patchReservation, load],
  );

  const remove = useCallback(
    async (id: string) => {
      setReservations((prev) => prev.filter((reservation) => reservation.id !== id));

      try {
        await deleteReservation(id);
      } catch {
        await load();
      }
    },
    [load],
  );

  return {
    dayReservations,
    getDaySummary,
    error,
    reload: load,
    saveReservationContent,
    updatePosition,
    updateColor,
    remove,
  };
}
