import { useEffect, useRef, useState } from "react";
import {
  getMonthPreviewLineHeight,
  maxMonthPreviewLines,
} from "@/lib/monthPreviewLayout";

export function useMonthGridMetrics(weekCount: number) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(64);
  const [compact, setCompact] = useState(
    () => !window.matchMedia("(min-width: 640px)").matches,
  );

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const onChange = () => setCompact(!media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;

    const update = () => {
      const nextRowHeight = grid.clientHeight / weekCount;
      if (nextRowHeight > 0) {
        setRowHeight(nextRowHeight);
      }
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [weekCount]);

  const lineHeight = getMonthPreviewLineHeight(compact);
  const maxPreviewLines = maxMonthPreviewLines(rowHeight, lineHeight);

  return { gridRef, maxPreviewLines };
}
