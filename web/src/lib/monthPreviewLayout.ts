/** n줄 높이 = n * line + (n-1) * gap */
export function maxLinesThatFit(
  availableHeightPx: number,
  lineHeightPx: number,
  lineGapPx: number,
): number {
  if (availableHeightPx <= 0 || lineHeightPx <= 0) return 0;
  const block = lineHeightPx + lineGapPx;
  return Math.max(0, Math.floor((availableHeightPx + lineGapPx) / block));
}

/** DayCell CSS와 동일 — pt-1 pb-1, h-7, mt-0.5, min-h-[12px|13px], gap-0.5 */
export const MONTH_PREVIEW_LAYOUT = {
  cellPaddingY: 8,
  headerHeight: 28,
  previewSectionGap: 2,
  lineGap: 2,
  lineHeight: { base: 12, sm: 13 },
} as const;

export function maxPreviewLinesForRowHeight(rowHeightPx: number, compact: boolean): number {
  const { cellPaddingY, headerHeight, previewSectionGap, lineGap, lineHeight } =
    MONTH_PREVIEW_LAYOUT;
  const available = rowHeightPx - cellPaddingY - headerHeight - previewSectionGap;
  const line = compact ? lineHeight.base : lineHeight.sm;
  return maxLinesThatFit(available, line, lineGap);
}
