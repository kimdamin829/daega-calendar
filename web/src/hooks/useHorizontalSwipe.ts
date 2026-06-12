import { useCallback, useRef } from "react";

const DEFAULT_THRESHOLD = 50;

interface UseHorizontalSwipeOptions {
  threshold?: number;
  onSwipeLeft: () => void | Promise<void>;
  onSwipeRight: () => void | Promise<void>;
  shouldIgnore?: () => boolean;
}

export function useHorizontalSwipe({
  threshold = DEFAULT_THRESHOLD,
  onSwipeLeft,
  onSwipeRight,
  shouldIgnore,
}: UseHorizontalSwipeOptions) {
  const swipeRef = useRef({ x: 0, y: 0, active: false });
  const onSwipeLeftRef = useRef(onSwipeLeft);
  const onSwipeRightRef = useRef(onSwipeRight);
  const shouldIgnoreRef = useRef(shouldIgnore);

  onSwipeLeftRef.current = onSwipeLeft;
  onSwipeRightRef.current = onSwipeRight;
  shouldIgnoreRef.current = shouldIgnore;

  const onPointerDown = useCallback((event: React.PointerEvent) => {
    if (event.button !== 0) return;
    if (shouldIgnoreRef.current?.()) return;
    swipeRef.current = { x: event.clientX, y: event.clientY, active: true };
  }, []);

  const onPointerUp = useCallback(async (event: React.PointerEvent) => {
    if (!swipeRef.current.active) return;
    swipeRef.current.active = false;

    const dx = event.clientX - swipeRef.current.x;
    const dy = event.clientY - swipeRef.current.y;
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;
    if (shouldIgnoreRef.current?.()) return;

    if (dx > 0) {
      await onSwipeRightRef.current();
    } else {
      await onSwipeLeftRef.current();
    }
  }, [threshold]);

  const onPointerCancel = useCallback(() => {
    swipeRef.current.active = false;
  }, []);

  return { onPointerDown, onPointerUp, onPointerCancel };
}
