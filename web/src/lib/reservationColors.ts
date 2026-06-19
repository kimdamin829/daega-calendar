export type ReservationColor = "sky" | "yellow" | "green" | "pink" | "purple" | "gray";

const TEXT = "text-[#2a1c14]";

const SKY_CHIP = `bg-[#78ace5] ${TEXT}`;
const SKY_BLOCK = `border-[#5a94d0] bg-[#78ace5] ${TEXT}`;

const DEFAULT_COLOR_STYLE = {
  block: SKY_BLOCK,
  chip: SKY_CHIP,
};

export const NO_COLOR_SWATCH = {
  id: null,
  label: "기본",
  swatch: "bg-[#78ace5]",
  ring: "ring-[#5a94d0]",
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
    block: `border-[#d8b35a] bg-[#f2cd74] ${TEXT}`,
    chip: `bg-[#f2cd74] ${TEXT}`,
    swatch: "bg-[#f2cd74]",
    ring: "ring-[#d8b35a]",
  },
  {
    id: "green",
    label: "초록",
    block: `border-[#4f7f58] bg-[#62976b] ${TEXT}`,
    chip: `bg-[#62976b] ${TEXT}`,
    swatch: "bg-[#62976b]",
    ring: "ring-[#4f7f58]",
  },
  {
    id: "pink",
    label: "분홍",
    block: `border-[#c87f75] bg-[#e19b91] ${TEXT}`,
    chip: `bg-[#e19b91] ${TEXT}`,
    swatch: "bg-[#e19b91]",
    ring: "ring-[#c87f75]",
  },
  {
    id: "purple",
    label: "보라",
    block: `border-[#824a98] bg-[#9b5db3] ${TEXT}`,
    chip: `bg-[#9b5db3] ${TEXT}`,
    swatch: "bg-[#9b5db3]",
    ring: "ring-[#824a98]",
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
