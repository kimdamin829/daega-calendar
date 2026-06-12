export type ReservationColor = "sky" | "yellow" | "green" | "pink" | "purple";

const SKY_BLOCK_STYLES = "border-sky-300 bg-sky-100 text-sky-950";

export const DEFAULT_BLOCK_STYLES = {
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
    block: "border-yellow-300 bg-yellow-100 text-yellow-950",
    swatch: "bg-yellow-300",
    ring: "ring-yellow-400",
  },
  {
    id: "green",
    label: "초록",
    block: "border-green-300 bg-green-100 text-green-950",
    swatch: "bg-green-400",
    ring: "ring-green-400",
  },
  {
    id: "pink",
    label: "분홍",
    block: "border-pink-300 bg-pink-100 text-pink-950",
    swatch: "bg-pink-300",
    ring: "ring-pink-400",
  },
  {
    id: "purple",
    label: "보라",
    block: "border-purple-300 bg-purple-100 text-purple-950",
    swatch: "bg-purple-400",
    ring: "ring-purple-400",
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
  sky: "bg-sky-100 text-sky-950",
  yellow: "bg-yellow-100 text-yellow-950",
  green: "bg-green-100 text-green-950",
  pink: "bg-pink-100 text-pink-950",
  purple: "bg-purple-100 text-purple-950",
};

export function getMonthChipClass(color: ReservationColor | null): string {
  if (!color || isDefaultColor(color)) return MONTH_CHIP_BY_COLOR.sky;
  return MONTH_CHIP_BY_COLOR[color];
}
