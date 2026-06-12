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
