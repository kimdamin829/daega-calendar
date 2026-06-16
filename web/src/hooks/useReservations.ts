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
import { syncWidgetFromReservations } from "@/lib/widgetBridge";
import { useReservationLoader } from "@/hooks/useReservationLoader";

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

  const monthRef = useRef(month);
  monthRef.current = month;

  const { reservations, setReservations, error, load, hasLoaded } = useReservationLoader(
    monthStart,
    monthEnd,
    withoutOrphanPlaceholders,
  );

  const reservationsRef = useRef(reservations);
  reservationsRef.current = reservations;

  const inflightSavesRef = useRef(new Map<string, Promise<void>>());

  const pushWidgetNow = useCallback((nextReservations: Reservation[]) => {
    syncWidgetFromReservations(monthRef.current, nextReservations, { allowEmpty: true });
  }, []);

  const applyLocalChange = useCallback(
    (updater: (prev: Reservation[]) => Reservation[]) => {
      markLocalReservationMutation();
      setReservations((prev) => {
        const next = updater(prev);
        pushWidgetNow(next);
        return next;
      });
    },
    [pushWidgetNow, setReservations],
  );

  const daySummaries = useMemo(
    () => summarizeReservationsByDate(reservations),
    [reservations],
  );

  // 서버 로드·realtime 후 위젯 동기화 (로드 전 빈 push 금지)
  useEffect(() => {
    if (!hasLoaded) return;
    syncWidgetFromReservations(month, reservations, { allowEmpty: true });
  }, [hasLoaded, month, reservations]);

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
        applyLocalChange((prev) => replaceDraftInList(prev, draft.id, optimistic));

        const saved = await saveReservationContentToDb(
          draft,
          raw,
          selectedDateKey,
          existing,
        );
        applyLocalChange((prev) => replaceDraftInList(prev, draft.id, saved));
      })();

      inflightSavesRef.current.set(draft.id, promise);
      void promise.finally(() => {
        if (inflightSavesRef.current.get(draft.id) === promise) {
          inflightSavesRef.current.delete(draft.id);
        }
      });

      return promise;
    },
    [applyLocalChange, selectedDateKey],
  );

  const updatePosition = useCallback(
    async (id: string, startMinutes: number, durationMinutes: number) => {
      applyLocalChange((prev) =>
        prev.map((reservation) =>
          reservation.id === id
            ? { ...reservation, start_minutes: startMinutes, duration_minutes: durationMinutes }
            : reservation,
        ),
      );

      try {
        await updateReservation(id, {
          start_minutes: startMinutes,
          duration_minutes: durationMinutes,
        });
      } catch {
        await load();
      }
    },
    [applyLocalChange, load],
  );

  const updateColor = useCallback(
    async (id: string, color: ReservationColor | null) => {
      applyLocalChange((prev) =>
        prev.map((reservation) =>
          reservation.id === id ? { ...reservation, color } : reservation,
        ),
      );

      try {
        await updateReservation(id, { color });
      } catch {
        await load();
      }
    },
    [applyLocalChange, load],
  );

  const remove = useCallback(
    async (id: string) => {
      applyLocalChange((prev) => prev.filter((reservation) => reservation.id !== id));

      try {
        await deleteReservation(id);
      } catch {
        await load();
      }
    },
    [applyLocalChange, load],
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
