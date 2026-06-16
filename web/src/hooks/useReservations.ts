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
import {
  refreshWidgetInBackground,
  syncWidgetFromReservations,
} from "@/lib/widgetBridge";
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
  const lastMountPushAtRef = useRef(0);
  const blockMountPushUntilRef = useRef(0);
  const MOUNT_PUSH_THROTTLE_MS = 10_000;

  const pushWidgetNow = useCallback((nextReservations: Reservation[], reason: string, focusDate?: string) => {
    if (
      reason.startsWith("delete:") ||
      reason.startsWith("save:") ||
      reason.startsWith("position:") ||
      reason.startsWith("color:")
    ) {
      blockMountPushUntilRef.current = Date.now() + 3_000;
    }
    syncWidgetFromReservations(monthRef.current, nextReservations, {
      allowEmpty: true,
      focusDate,
      reason,
    });
  }, []);

  const setAndPushNow = useCallback(
    (nextReservations: Reservation[], reason: string, focusDate?: string) => {
      markLocalReservationMutation();
      reservationsRef.current = nextReservations;
      setReservations(nextReservations);
      pushWidgetNow(nextReservations, reason, focusDate);
    },
    [pushWidgetNow, setReservations],
  );

  const applyLocalChange = useCallback(
    (updater: (prev: Reservation[]) => Reservation[], reason: string, focusDate?: string) => {
      markLocalReservationMutation();
      setReservations((prev) => {
        const next = updater(prev);
        reservationsRef.current = next;
        pushWidgetNow(next, reason, focusDate);
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
    if (Date.now() < blockMountPushUntilRef.current) return;
    if (Date.now() - lastMountPushAtRef.current < MOUNT_PUSH_THROTTLE_MS) return;
    syncWidgetFromReservations(month, reservations, { allowEmpty: true, reason: "mount" });
    lastMountPushAtRef.current = Date.now();
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
        applyLocalChange((prev) => replaceDraftInList(prev, draft.id, optimistic), "save:optimistic", selectedDateKey);

        const saved = await saveReservationContentToDb(
          draft,
          raw,
          selectedDateKey,
          existing,
        );
        const base = reservationsRef.current;
        const nextAfterSave = replaceDraftInList(base, draft.id, saved);
        setAndPushNow(nextAfterSave, "save:success", saved.date);
        refreshWidgetInBackground();
      })();

      inflightSavesRef.current.set(draft.id, promise);
      void promise.finally(() => {
        if (inflightSavesRef.current.get(draft.id) === promise) {
          inflightSavesRef.current.delete(draft.id);
        }
      });

      return promise;
    },
    [applyLocalChange, selectedDateKey, setAndPushNow],
  );

  const updatePosition = useCallback(
    async (id: string, startMinutes: number, durationMinutes: number) => {
      applyLocalChange((prev) =>
        prev.map((reservation) =>
          reservation.id === id
            ? { ...reservation, start_minutes: startMinutes, duration_minutes: durationMinutes }
            : reservation,
        ),
      "position:optimistic");

      try {
        const updated = await updateReservation(id, {
          start_minutes: startMinutes,
          duration_minutes: durationMinutes,
        });
        const base = reservationsRef.current;
        const nextAfterSave = base.map((reservation) =>
          reservation.id === id ? { ...reservation, ...updated } : reservation,
        );
        setAndPushNow(nextAfterSave, "position:success", updated.date);
        refreshWidgetInBackground();
      } catch {
        await load();
      }
    },
    [applyLocalChange, load, setAndPushNow],
  );

  const updateColor = useCallback(
    async (id: string, color: ReservationColor | null) => {
      applyLocalChange((prev) =>
        prev.map((reservation) =>
          reservation.id === id ? { ...reservation, color } : reservation,
        ),
      "color:optimistic");

      try {
        const updated = await updateReservation(id, { color });
        const base = reservationsRef.current;
        const nextAfterSave = base.map((reservation) =>
          reservation.id === id ? { ...reservation, ...updated } : reservation,
        );
        setAndPushNow(nextAfterSave, "color:success", updated.date);
        refreshWidgetInBackground();
      } catch {
        await load();
      }
    },
    [applyLocalChange, load, setAndPushNow],
  );

  const remove = useCallback(
    async (id: string) => {
      const target = reservationsRef.current.find((reservation) => reservation.id === id);
      applyLocalChange((prev) => prev.filter((reservation) => reservation.id !== id), "delete:optimistic", target?.date);

      try {
        await deleteReservation(id);
        const nextAfterDelete = reservationsRef.current.filter((reservation) => reservation.id !== id);
        setAndPushNow(nextAfterDelete, "delete:success", target?.date);
        refreshWidgetInBackground();
      } catch {
        await load();
      }
    },
    [applyLocalChange, load, setAndPushNow],
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
