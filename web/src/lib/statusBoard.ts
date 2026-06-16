import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Reservation } from "@/types/reservation";
import { PLACEHOLDER_TIME } from "@/lib/reservationConstants";
import { maskGuestName } from "@/lib/maskGuestName";
import { formatBoardPartyLabel, getPartyTier, type PartyTier } from "@/lib/partyCounts";
import {
  isPlaceholderReservation,
  isUnparsedDraft,
} from "@/lib/reservationDisplay";
import { formatBoardDisplayTime, resolveTimeToMinutes } from "@/lib/timeResolve";

export interface BoardEntry {
  time: string;
  guestName: string;
  partySize: string;
  partyTier: PartyTier;
  seat: string | null;
}

interface StatusBoardColumns {
  left: BoardEntry[];
  right: BoardEntry[];
}

const BOARD_TEAM_LIMIT = 20;
export const BOARD_COLUMN_SIZE = 10;

export function formatBoardTitle(date: Date): string {
  const dateLabel = format(date, "M월 d일", { locale: ko });
  const weekday = format(date, "EEE", { locale: ko });
  return `${dateLabel}(${weekday}) 예약 현황`;
}

function isEligibleForBoard(reservation: Reservation): boolean {
  if (reservation.color === "gray") return false;
  if (isPlaceholderReservation(reservation)) return false;
  if (isUnparsedDraft(reservation)) return false;
  if (reservation.time === PLACEHOLDER_TIME) return false;
  return true;
}

function compareBoardReservations(a: Reservation, b: Reservation): number {
  const timeDiff = resolveTimeToMinutes(a.time) - resolveTimeToMinutes(b.time);
  if (timeDiff !== 0) return timeDiff;

  const nameDiff = a.guest_name.localeCompare(b.guest_name, "ko");
  if (nameDiff !== 0) return nameDiff;

  const createdDiff = a.created_at.localeCompare(b.created_at);
  if (createdDiff !== 0) return createdDiff;

  return a.id.localeCompare(b.id);
}

const BOARD_GUEST_NAME_MAX = 6;

function formatBoardGuestName(raw: string): string {
  const masked = maskGuestName(raw);
  const chars = [...masked];
  return chars.slice(0, BOARD_GUEST_NAME_MAX).join("");
}

function toBoardEntry(reservation: Reservation): BoardEntry {
  return {
    time: formatBoardDisplayTime(reservation.time),
    guestName: formatBoardGuestName(reservation.guest_name),
    partySize: formatBoardPartyLabel(reservation),
    partyTier: getPartyTier(reservation),
    seat: reservation.seat,
  };
}

export function buildStatusBoard(reservations: Reservation[]): StatusBoardColumns {
  const entries = reservations
    .filter(isEligibleForBoard)
    .sort(compareBoardReservations)
    .slice(0, BOARD_TEAM_LIMIT)
    .map(toBoardEntry);

  return {
    left: entries.slice(0, BOARD_COLUMN_SIZE),
    right: entries.slice(BOARD_COLUMN_SIZE, BOARD_TEAM_LIMIT),
  };
}
