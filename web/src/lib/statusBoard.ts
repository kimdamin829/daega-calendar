import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { Reservation } from "@/types/reservation";
import { isEligibleForStatusDisplay } from "@/lib/statusEligibility";
import { maskGuestName } from "@/lib/maskGuestName";
import { getBoardPartyParts } from "@/lib/partyCounts";
import { formatBoardDisplayTime, resolveTimeToMinutes } from "@/lib/timeResolve";

export interface BoardEntry {
  time: string;
  guestNameChars: string[];
  partyParts: string[];
  seat: string | null;
}

interface StatusBoardColumns {
  left: BoardEntry[];
  right: BoardEntry[];
}

const BOARD_TEAM_LIMIT = 20;
export const BOARD_COLUMN_SIZE = 10;

/** 2호점 세로형 현황판 — 단일 컬럼 최대 18팀 */
export const BRANCH_BOARD_COLUMN_SIZE = 18;

function formatStatusDateTitle(date: Date, suffix: string): string {
  const dateLabel = format(date, "M월 d일", { locale: ko });
  const weekday = format(date, "EEE", { locale: ko });
  return `${dateLabel}(${weekday}) ${suffix}`;
}

export function formatBoardTitle(date: Date): string {
  return formatStatusDateTitle(date, "예약 현황");
}

export function formatTodayTitle(date: Date): string {
  return formatStatusDateTitle(date, "예약");
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

function formatBoardGuestName(raw: string): string[] {
  const masked = maskGuestName(raw);
  return [...masked].slice(0, BOARD_GUEST_NAME_MAX);
}

function toBoardEntry(reservation: Reservation): BoardEntry {
  return {
    time: formatBoardDisplayTime(reservation.time),
    guestNameChars: formatBoardGuestName(reservation.guest_name),
    partyParts: getBoardPartyParts(reservation),
    seat: reservation.seat,
  };
}

function buildBoardEntries(reservations: Reservation[], limit: number): BoardEntry[] {
  return reservations
    .filter(isEligibleForStatusDisplay)
    .sort(compareBoardReservations)
    .slice(0, limit)
    .map(toBoardEntry);
}

export function buildStatusBoard(reservations: Reservation[]): StatusBoardColumns {
  const entries = buildBoardEntries(reservations, BOARD_TEAM_LIMIT);

  return {
    left: entries.slice(0, BOARD_COLUMN_SIZE),
    right: entries.slice(BOARD_COLUMN_SIZE, BOARD_TEAM_LIMIT),
  };
}

export function buildBranchStatusBoard(reservations: Reservation[]): StatusBoardColumns {
  return {
    left: buildBoardEntries(reservations, BRANCH_BOARD_COLUMN_SIZE),
    right: [],
  };
}
