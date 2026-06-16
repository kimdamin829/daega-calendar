import { useCallback, useEffect, useMemo, useRef } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import type { Reservation } from "@/types/reservation";
import type { ReservationColor } from "@/lib/reservationColors";
import { getKoreaDateKey } from "@/lib/dateUtils";
import { compareReservationsByTime } from "@/lib/reservationSort";
import { withoutOrphanPlaceholders } from "@/lib/reservationCleanup";
import { saveReservationContentToDb, previewReservationContentFromRaw } from "@/lib/saveReservationContent";
import {
  EMPTY_DAY_SUMMARY,
  summarizeReservationsByDate,
  type DaySummary,
} from "@/lib/monthSummary";
import { deleteReservation, updateReservation } from "@/lib/supabase";
import { markLocalReservationMutation } from "@/lib/realtime";
import { pushWidgetMonthSummaries } from "@/lib/widgetBridge";
import { useReservationLoader } from "@/hooks/useReservationLoader";

function notifyWidgetAfterLocalChange() {
  markLocalReservationMutation();
}

function replaceDraftInList(
  prev: Reservation[],
  draftId: string,
  saved: Reservation,
): Reservation[] {
  return [...prev.filter((reservation) => reservation.id !== draftId), saved].sort(
    compareReservationsByTime,
  );
}

export function useReservations(month: Date, selectedDate: Date) {
  const monthStart = getKoreaDateKey(startOfMonth(month));
  const monthEnd = getKoreaDateKey(endOfMonth(month));
  const selectedDateKey = getKoreaDateKey(selectedDate);

  const { reservations, setReservations, error, load } = useReservationLoader(
    monthStart,
    monthEnd,
    withoutOrphanPlaceholders,
  );

  const reservationsRef = useRef(reservations);
  reservationsRef.current = reservations;

  const inflightSavesRef = useRef(new Map<string, Promise<void>>());

  const daySummaries = useMemo(
    () => summarizeReservationsByDate(reservations),
    [reservations],
  );

  useEffect(() => {
    pushWidgetMonthSummaries(month, daySummaries);
  }, [month, daySummaries]);

  const dayReservations = useMemo(
    () =>
      reservations
        .filter((reservation) => reservation.date === selectedDateKey)
        .sort(compareReservationsByTime),
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
    [setReservations],
  );

  const saveReservationContent = useCallback(
    (draft: Reservation, raw: string) => {
      const ongoing = inflightSavesRef.current.get(draft.id);
      if (ongoing) return ongoing;

      const promise = (async () => {
        const existing = reservationsRef.current.find((reservation) => reservation.id === draft.id);
        const optimistic = previewReservationContentFromRaw(
          draft,
          raw,
          selectedDateKey,
          existing,
        );
        setReservations((prev) => replaceDraftInList(prev, draft.id, optimistic));
        notifyWidgetAfterLocalChange();

        const saved = await saveReservationContentToDb(
          draft,
          raw,
          selectedDateKey,
          existing,
        );
        setReservations((prev) => replaceDraftInList(prev, draft.id, saved));
        notifyWidgetAfterLocalChange();
      })();

      inflightSavesRef.current.set(draft.id, promise);
      void promise.finally(() => {
        if (inflightSavesRef.current.get(draft.id) === promise) {
          inflightSavesRef.current.delete(draft.id);
        }
      });

      return promise;
    },
    [selectedDateKey, setReservations, load],
  );

  const updatePosition = useCallback(
    async (id: string, startMinutes: number, durationMinutes: number) => {
      patchReservation(id, {
        start_minutes: startMinutes,
        duration_minutes: durationMinutes,
      });
      notifyWidgetAfterLocalChange();

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
      notifyWidgetAfterLocalChange();

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
      notifyWidgetAfterLocalChange();

      try {
        await deleteReservation(id);
      } catch {
        await load();
      }
    },
    [load, setReservations],
  );

  return {
    dayReservations,
    getDaySummary,
    error,
    saveReservationContent,
    updatePosition,
    updateColor,
    remove,
  };
}
