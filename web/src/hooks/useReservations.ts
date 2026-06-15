import { useCallback, useMemo } from "react";
import { endOfMonth, startOfMonth } from "date-fns";
import type { Reservation } from "@/types/reservation";
import { PLACEHOLDER_TIME } from "@/lib/formatReservation";
import { isOrphanPlaceholder } from "@/lib/reservationDisplay";
import type { ReservationColor } from "@/lib/reservationColors";
import {
  createReservation,
  deleteReservation,
  updateReservation,
} from "@/lib/supabase";
import { toDateString } from "@/lib/dateUtils";
import { parseReservationInput, ParseError } from "@/lib/parseReservation";
import { DEFAULT_PARTY_COUNTS } from "@/lib/partyCounts";
import { compareReservationsByTime } from "@/lib/reservationSort";
import {
  EMPTY_DAY_SUMMARY,
  summarizeReservationsByDate,
  type DaySummary,
} from "@/lib/monthSummary";
import { useReservationLoader } from "@/hooks/useReservationLoader";

export function useReservations(month: Date, selectedDate: Date) {
  const monthStart = toDateString(startOfMonth(month));
  const monthEnd = toDateString(endOfMonth(month));
  const selectedDateKey = toDateString(selectedDate);

  const processLoaded = useCallback(async (data: Reservation[]) => {
    const orphans = data.filter(isOrphanPlaceholder);
    if (orphans.length > 0) {
      await Promise.all(
        orphans.map((reservation) =>
          deleteReservation(reservation.id).catch(() => undefined),
        ),
      );
    }
    return data.filter((reservation) => !isOrphanPlaceholder(reservation));
  }, []);

  const { reservations, setReservations, error, load } = useReservationLoader(
    monthStart,
    monthEnd,
    processLoaded,
  );

  const daySummaries = useMemo(
    () => summarizeReservationsByDate(reservations),
    [reservations],
  );

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
    async (draft: Reservation, raw: string) => {
      const existing = reservations.find((reservation) => reservation.id === draft.id);
      const startMinutes = draft.start_minutes;
      const durationMinutes = draft.duration_minutes;
      const color = draft.color ?? null;

      const replaceDraft = (saved: Reservation) => {
        setReservations((prev) =>
          [...prev.filter((reservation) => reservation.id !== draft.id), saved].sort(
            compareReservationsByTime,
          ),
        );
        return saved;
      };

      try {
        const parsed = parseReservationInput(raw, selectedDateKey);
        const payload = {
          time: parsed.time,
          adult_count: parsed.adult_count,
          child_count: parsed.child_count,
          infant_count: parsed.infant_count,
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
          ...DEFAULT_PARTY_COUNTS,
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
    [selectedDateKey, patchReservation, reservations, setReservations],
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
