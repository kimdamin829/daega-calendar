import { useEffect, useRef, useState } from "react";
import {
  getMonthPreviewLineHeight,
  maxMonthPreviewLines,
} from "@/lib/monthPreviewLayout";

export function useDayCellPreviewLimit() {
  const cellRef = useRef<HTMLButtonElement>(null);
  const [maxPreviewLines, setMaxPreviewLines] = useState(1);
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
    const cell = cellRef.current;
    if (!cell) return;

    const update = () => {
      const lineHeight = getMonthPreviewLineHeight(compact);
      setMaxPreviewLines(maxMonthPreviewLines(cell.clientHeight, lineHeight));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(cell);
    return () => observer.disconnect();
  }, [compact]);

  return { cellRef, maxPreviewLines };
}
