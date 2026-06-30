import { useEffect, useState, type RefObject } from "react";

export function useBoardScale(
  containerRef: RefObject<HTMLDivElement | null>,
  designWidth: number,
  designHeight: number,
) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      setScale(
        Math.min(container.clientWidth / designWidth, container.clientHeight / designHeight),
      );
    };

    updateScale();

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef, designWidth, designHeight]);

  return scale;
}
