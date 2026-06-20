import { buildTodaySummary } from "@/lib/todaySummary";
import { useStatusDisplayReservations } from "@/hooks/useStatusDisplayReservations";

export function useTodayReservations(dateKey: string) {
  const { data: summary, error } = useStatusDisplayReservations(dateKey, buildTodaySummary);
  return { summary, error };
}
