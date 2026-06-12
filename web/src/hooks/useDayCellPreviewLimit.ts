import { useLayoutEffect, useRef, useState } from "react";
import { maxLinesThatFit } from "@/lib/monthPreviewLayout";

const PREVIEW_SECTION_GAP = 2;
const PREVIEW_LINE_GAP = 2;
const LINE_HEIGHT = { base: 12, sm: 13 };

function getPreviewLineHeight(): number {
  return window.matchMedia("(min-width: 640px)").matches
    ? LINE_HEIGHT.sm
    : LINE_HEIGHT.base;
}

function measurePreviewLimit(cell: HTMLButtonElement, previewCount: number): number {
  if (previewCount === 0 || cell.clientHeight <= 0) return 0;

  const styles = getComputedStyle(cell);
  const paddingY =
    Number.parseFloat(styles.paddingTop) + Number.parseFloat(styles.paddingBottom);
  const headerHeight = cell.firstElementChild?.clientHeight ?? 28;
  const available = cell.clientHeight - paddingY - headerHeight - PREVIEW_SECTION_GAP;

  return maxLinesThatFit(available, getPreviewLineHeight(), PREVIEW_LINE_GAP);
}

export function useDayCellPreviewLimit(previewCount: number) {
  const cellRef = useRef<HTMLButtonElement>(null);
  const [maxPreviewLines, setMaxPreviewLines] = useState(() => previewCount);

  useLayoutEffect(() => {
    const cell = cellRef.current;
    if (!cell) return;

    const update = () => {
      const next = measurePreviewLimit(cell, previewCount);
      if (next > 0) {
        setMaxPreviewLines(next);
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(cell);

    window.visualViewport?.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [previewCount]);

  return {
    cellRef,
    maxPreviewLines: previewCount === 0 ? 0 : maxPreviewLines,
  };
}
