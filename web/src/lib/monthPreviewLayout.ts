/** 월별 셀 미리보기 줄 수 — DayCell / 위젯과 동일한 기준 */
export const MONTH_PREVIEW_LAYOUT = {
  cellPaddingY: 8,
  dayNumberHeight: 28,
  previewSectionGap: 2,
  previewLineGap: 2,
  lineHeight: { base: 17, sm: 15 },
} as const;

export function getMonthPreviewLineHeight(compact: boolean): number {
  return compact
    ? MONTH_PREVIEW_LAYOUT.lineHeight.base
    : MONTH_PREVIEW_LAYOUT.lineHeight.sm;
}

export function maxMonthPreviewLines(cellHeightPx: number, lineHeightPx: number): number {
  const { cellPaddingY, dayNumberHeight, previewSectionGap, previewLineGap } =
    MONTH_PREVIEW_LAYOUT;
  const reserved = cellPaddingY + dayNumberHeight + previewSectionGap;
  const lineBlock = lineHeightPx + previewLineGap;
  const available = cellHeightPx - reserved;

  if (available <= 0 || lineBlock <= 0) return 0;

  return Math.floor(available / lineBlock);
}
