import type { PartyTier } from "@/lib/partyCounts";

export const BOARD_HEADER_LABELS = ["시간", "고객명", "인원", "좌석"] as const;

export const BOARD_GRID_COLS_MAIN =
  "grid-cols-[minmax(0,0.78fr)_minmax(0,1.85fr)_minmax(0,1.15fr)_minmax(0,1.1fr)]";

export const BOARD_GRID_COLS_BRANCH =
  "grid-cols-[minmax(0,0.6fr)_minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,1.1fr)]";

export interface SeatTextTiers {
  max3: string;
  max6: string;
  max8: string;
}

export const BRANCH_BOARD_SEAT_MAX = 8;

export interface BoardTableTypography {
  gridCols: string;
  headerText: string;
  cellText: string;
  timeText?: string;
  suffixText: string;
  partyText: Record<PartyTier, string>;
  seatShort: string;
  seatLong: string;
  seatTextTiers?: SeatTextTiers;
}

const BOARD_FONT = "font-bold";
const NAME_SPACED_CHARS = "inline-flex items-baseline justify-center gap-x-[0.14em]";

export const MAIN_BOARD_TYPOGRAPHY: BoardTableTypography = {
  gridCols: BOARD_GRID_COLS_MAIN,
  headerText: `text-[38px] ${BOARD_FONT}`,
  cellText: `text-[48px] ${BOARD_FONT}`,
  suffixText: `text-[38px] ${BOARD_FONT}`,
  partyText: {
    1: "text-[50px]",
    2: "text-[47px]",
    3: "text-[44px]",
  },
  seatShort: "text-[48px]",
  seatLong: "text-[42px]",
};

export const BRANCH_BOARD_TYPOGRAPHY: BoardTableTypography = {
  gridCols: BOARD_GRID_COLS_BRANCH,
  headerText: `text-[42px] ${BOARD_FONT}`,
  cellText: `text-[46px] ${BOARD_FONT}`,
  timeText: `text-[50px] ${BOARD_FONT}`,
  suffixText: `text-[36px] ${BOARD_FONT}`,
  partyText: {
    1: "text-[50px]",
    2: "text-[46px]",
    3: "text-[43px]",
  },
  seatShort: "text-[46px]",
  seatLong: "text-[42px]",
  seatTextTiers: {
    max3: "text-[46px]",
    max6: "text-[43px]",
    max8: "text-[40px]",
  },
};

export function formatBoardSeatLabel(
  seat: string | null,
  maxLength = BRANCH_BOARD_SEAT_MAX,
): string {
  const label = seat?.trim() || "-";
  return [...label].slice(0, maxLength).join("");
}

export function getSeatTextClass(seat: string | null, typography: BoardTableTypography): string {
  const label = seat?.trim() || "-";
  const len = label.length;
  const tiers = typography.seatTextTiers;

  if (tiers) {
    if (len <= 3) return tiers.max3;
    if (len <= 6) return tiers.max6;
    return tiers.max8;
  }

  return len > 6 ? typography.seatLong : typography.seatShort;
}

export { BOARD_FONT, NAME_SPACED_CHARS };
