import { buildStatusBoard } from "@/lib/statusBoard";
import { useStatusDisplayReservations } from "@/hooks/useStatusDisplayReservations";

export function useBoardReservations(dateKey: string) {
  const { data: board, error } = useStatusDisplayReservations(dateKey, buildStatusBoard);
  return { board, error };
}
