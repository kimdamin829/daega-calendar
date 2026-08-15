import { useEffect } from "react";
import { BoardView } from "@/components/BoardView";
import { BranchBoardView } from "@/components/BranchBoardView";
import { useStatusDisplayReservations } from "@/hooks/useStatusDisplayReservations";
import { useKoreaToday } from "@/hooks/useTodayDate";
import { buildBranchStatusBoard, buildStatusBoard } from "@/lib/statusBoard";
import { syncBoardUrl } from "@/lib/urlState";

function useSyncBoardUrl() {
  useEffect(() => {
    syncBoardUrl();
  }, []);
}

function MainBoardApp() {
  const { date, dateKey } = useKoreaToday();
  const { data: board, error } = useStatusDisplayReservations(dateKey, buildStatusBoard);
  useSyncBoardUrl();

  return <BoardView date={date} left={board.left} right={board.right} error={error} />;
}

function BranchBoardApp() {
  const { date, dateKey } = useKoreaToday();
  const { data: board, error } = useStatusDisplayReservations(dateKey, buildBranchStatusBoard);
  useSyncBoardUrl();

  return <BranchBoardView date={date} entries={board.left} error={error} />;
}

export function BoardApp({ branch }: { branch: boolean }) {
  if (branch) {
    return <BranchBoardApp />;
  }

  return <MainBoardApp />;
}
