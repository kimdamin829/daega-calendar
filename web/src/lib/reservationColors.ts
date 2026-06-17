export type ReservationColor = "sky" | "yellow" | "green" | "pink" | "purple" | "gray";

const SKY_BLOCK_STYLES = "border-sky-400 bg-sky-200 text-sky-950";

const DEFAULT_BLOCK_STYLES = {
  block: SKY_BLOCK_STYLES,
};

export const NO_COLOR_SWATCH = {
  id: null,
  label: "기본",
  swatch: "bg-sky-400",
  ring: "ring-sky-400",
} as const;

export const RESERVATION_COLORS: {
  id: ReservationColor;
  label: string;
  block: string;
  swatch: string;
  ring: string;
}[] = [
  {
    id: "yellow",
    label: "노랑",
    block: "border-yellow-400 bg-yellow-200 text-yellow-950",
    swatch: "bg-yellow-400",
    ring: "ring-yellow-500",
  },
  {
    id: "green",
    label: "초록",
    block: "border-green-400 bg-green-200 text-green-950",
    swatch: "bg-green-500",
    ring: "ring-green-500",
  },
  {
    id: "pink",
    label: "주황",
    block: "border-orange-400 bg-orange-200 text-orange-950",
    swatch: "bg-orange-400",
    ring: "ring-orange-500",
  },
  {
    id: "purple",
    label: "보라",
    block: "border-purple-400 bg-purple-200 text-purple-950",
    swatch: "bg-purple-500",
    ring: "ring-purple-500",
  },
  {
    id: "gray",
    label: "회색",
    block: "border-gray-500 bg-gray-300 text-gray-950",
    swatch: "bg-gray-400",
    ring: "ring-gray-400",
  },
];

export function isDefaultColor(color: ReservationColor | null): boolean {
  return color === null || color === "sky";
}

export const COLOR_SWATCHES = [NO_COLOR_SWATCH, ...RESERVATION_COLORS];

export function getColorStyles(color: ReservationColor | null) {
  if (isDefaultColor(color)) return DEFAULT_BLOCK_STYLES;
  return RESERVATION_COLORS.find((c) => c.id === color) ?? DEFAULT_BLOCK_STYLES;
}

const MONTH_CHIP_BY_COLOR: Record<ReservationColor, string> = {
  sky: "bg-sky-200 text-sky-950",
  yellow: "bg-yellow-200 text-yellow-950",
  green: "bg-green-200 text-green-950",
  pink: "bg-orange-200 text-orange-950",
  purple: "bg-purple-200 text-purple-950",
  gray: "bg-gray-100 text-gray-950",
};

export function getMonthChipClass(color: ReservationColor | null): string {
  if (!color || isDefaultColor(color)) return MONTH_CHIP_BY_COLOR.sky;
  return MONTH_CHIP_BY_COLOR[color];
}
