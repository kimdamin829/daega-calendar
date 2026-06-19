export type ReservationColor = "sky" | "yellow" | "green" | "pink" | "purple" | "gray";

const TEXT = "text-[#2a1c14]";

const SKY_CHIP = `bg-[#88b8eb] ${TEXT}`;
const SKY_BLOCK = `border-[#6aa0d6] bg-[#88b8eb] ${TEXT}`;

const DEFAULT_COLOR_STYLE = {
  block: SKY_BLOCK,
  chip: SKY_CHIP,
};

export const NO_COLOR_SWATCH = {
  id: null,
  label: "기본",
  swatch: "bg-[#88b8eb]",
  ring: "ring-[#6aa0d6]",
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
    block: `border-[#e0be68] bg-[#f5d684] ${TEXT}`,
    chip: `bg-[#f5d684] ${TEXT}`,
    swatch: "bg-[#f5d684]",
    ring: "ring-[#e0be68]",
  },
  {
    id: "green",
    label: "초록",
    block: `border-[#6fa87a] bg-[#80b28a] ${TEXT}`,
    chip: `bg-[#80b28a] ${TEXT}`,
    swatch: "bg-[#80b28a]",
    ring: "ring-[#6fa87a]",
  },
  {
    id: "pink",
    label: "분홍",
    block: `border-[#d08d83] bg-[#e8a99f] ${TEXT}`,
    chip: `bg-[#e8a99f] ${TEXT}`,
    swatch: "bg-[#e8a99f]",
    ring: "ring-[#d08d83]",
  },
  {
    id: "purple",
    label: "보라",
    block: `border-[#9058a6] bg-[#a86bbd] ${TEXT}`,
    chip: `bg-[#a86bbd] ${TEXT}`,
    swatch: "bg-[#a86bbd]",
    ring: "ring-[#9058a6]",
  },
  {
    id: "gray",
    label: "회색",
    block: "border-gray-600 bg-gray-400 text-gray-950",
    chip: "bg-gray-400 text-gray-950",
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
