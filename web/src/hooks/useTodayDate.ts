import { useEffect, useState } from "react";
import { getKoreaDateKey, koreaDateKeyToDate } from "@/lib/dateUtils";

/** 한국 시간(Asia/Seoul) 기준 오늘 — 자정 지나면 자동 갱신 */
export function useKoreaToday() {
  const [dateKey, setDateKey] = useState(() => getKoreaDateKey());

  useEffect(() => {
    const syncToday = () => {
      const next = getKoreaDateKey();
      setDateKey((prev) => (prev === next ? prev : next));
    };

    syncToday();
    const timer = window.setInterval(syncToday, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    dateKey,
    date: koreaDateKeyToDate(dateKey),
  };
}
