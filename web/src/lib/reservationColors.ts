export type ReservationColor = "sky" | "yellow" | "green" | "pink" | "purple" | "gray";

const SKY_CHIP = "bg-sky-400 text-sky-950";
const SKY_BLOCK = `border-sky-600 ${SKY_CHIP}`;

const DEFAULT_COLOR_STYLE = {
  block: SKY_BLOCK,
  chip: SKY_CHIP,
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
  chip: string;
  swatch: string;
  ring: string;
}[] = [
  {
    id: "yellow",
    label: "노랑",
    block: "border-yellow-600 bg-yellow-400 text-yellow-950",
    chip: "bg-yellow-400 text-yellow-950",
    swatch: "bg-yellow-400",
    ring: "ring-yellow-500",
  },
  {
    id: "green",
    label: "초록",
    block: "border-green-600 bg-green-400 text-green-950",
    chip: "bg-green-400 text-green-950",
    swatch: "bg-green-500",
    ring: "ring-green-500",
  },
  {
    id: "pink",
    label: "주황",
    block: "border-orange-600 bg-orange-400 text-orange-950",
    chip: "bg-orange-400 text-orange-950",
    swatch: "bg-orange-400",
    ring: "ring-orange-500",
  },
  {
    id: "purple",
    label: "보라",
    block: "border-purple-600 bg-purple-400 text-purple-950",
    chip: "bg-purple-400 text-purple-950",
    swatch: "bg-purple-500",
    ring: "ring-purple-500",
  },
  {
    id: "gray",
    label: "회색",
    block: "border-gray-700 bg-gray-500 text-gray-950",
    chip: "bg-gray-500 text-gray-950",
    swatch: "bg-gray-400",
    ring: "ring-gray-400",
  },
];

export function isDefaultColor(color: ReservationColor | null): boolean {
  return color === null || color === "sky";
}

export const COLOR_SWATCHES = [NO_COLOR_SWATCH, ...RESERVATION_COLORS];

export function getColorStyles(color: ReservationColor | null) {
  if (isDefaultColor(color)) return DEFAULT_COLOR_STYLE;
  return RESERVATION_COLORS.find((c) => c.id === color) ?? DEFAULT_COLOR_STYLE;
}

export function getMonthChipClass(color: ReservationColor | null): string {
  if (!color || isDefaultColor(color)) return DEFAULT_COLOR_STYLE.chip;
  return RESERVATION_COLORS.find((c) => c.id === color)?.chip ?? DEFAULT_COLOR_STYLE.chip;
}
