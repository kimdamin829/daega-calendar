import { useEffect, useRef, useState, type RefObject } from "react";
import { maxLinesThatFit } from "@/lib/monthPreviewLayout";

const PREVIEW_LINE_GAP = 2;
const FALLBACK_LINE_HEIGHT = 12;

export function useDayCellPreviewLimit(
  previewAreaRef: RefObject<HTMLElement | null>,
  previewCount: number,
) {
  const cellRef = useRef<HTMLButtonElement>(null);
  const [maxPreviewLines, setMaxPreviewLines] = useState(previewCount);

  useEffect(() => {
    setMaxPreviewLines(previewCount);
  }, [previewCount]);

  useEffect(() => {
    const cell = cellRef.current;
    if (!cell || previewCount === 0) return;

    const update = () => {
      const previewArea = previewAreaRef.current;
      const sampleLine = previewArea?.querySelector("p");

      let available = previewArea?.clientHeight ?? 0;
      if (available <= 0) {
        const styles = getComputedStyle(cell);
        const paddingY =
          Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
        const headerHeight = cell.firstElementChild?.clientHeight ?? 28;
        available = cell.clientHeight - paddingY - headerHeight - 2;
      }
      if (available <= 0) return;

      const lineHeight = sampleLine?.getBoundingClientRect().height ?? FALLBACK_LINE_HEIGHT;
      const next = maxLinesThatFit(available, lineHeight, PREVIEW_LINE_GAP);

      setMaxPreviewLines((current) => (current === next ? current : next));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(cell);
    if (previewAreaRef.current) observer.observe(previewAreaRef.current);

    return () => observer.disconnect();
  }, [previewAreaRef, previewCount]);

  return { cellRef, maxPreviewLines };
}
