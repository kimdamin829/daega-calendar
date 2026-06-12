import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { maxPreviewLinesForRowHeight } from "@/lib/monthPreviewLayout";

export function useMonthGridPreviewLimit(weekCount: number, enabled: boolean) {
  const gridRef = useRef<HTMLDivElement>(null);
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

  useLayoutEffect(() => {
    if (!enabled) return;

    const grid = gridRef.current;
    if (!grid || weekCount === 0) return;

    const update = () => {
      if (grid.clientHeight <= 0) return;
      const next = maxPreviewLinesForRowHeight(grid.clientHeight / weekCount, compact);
      if (next > 0) setMaxPreviewLines(next);
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(grid);
    return () => observer.disconnect();
  }, [weekCount, compact, enabled]);

  return { gridRef, maxPreviewLines: enabled ? maxPreviewLines : 0 };
}
