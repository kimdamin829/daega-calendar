import { useCallback, useMemo, useRef } from "react";

export function useRafValue(setter: (value: number) => void) {
  const rafRef = useRef<number | null>(null);
  const pendingRef = useRef(0);
  const setterRef = useRef(setter);
  setterRef.current = setter;

  const schedule = useCallback((value: number) => {
    pendingRef.current = value;
    if (rafRef.current !== null) return;

    rafRef.current = requestAnimationFrame(() => {
      setterRef.current(pendingRef.current);
      rafRef.current = null;
    });
  }, []);

  const cancel = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    pendingRef.current = 0;
  }, []);

  return useMemo(() => ({ schedule, cancel, pendingRef }), [schedule, cancel]);
}
