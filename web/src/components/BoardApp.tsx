import { useEffect, useMemo } from "react";
import { BoardView } from "@/components/BoardView";
import { BranchBoardView } from "@/components/BranchBoardView";
import { useStatusDisplayReservations } from "@/hooks/useStatusDisplayReservations";
import { useKoreaToday } from "@/hooks/useTodayDate";
import { getMockBranchBoardReservations } from "@/lib/mockBranchBoardReservations";
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

function BranchBoardAppLive() {
  const { date, dateKey } = useKoreaToday();
  const { data: board, error } = useStatusDisplayReservations(dateKey, buildBranchStatusBoard);
  useSyncBoardUrl();

  return <BranchBoardView date={date} entries={board.left} error={error} />;
}

function BranchBoardAppMock() {
  const { date, dateKey } = useKoreaToday();
  const entries = useMemo(
    () => buildBranchStatusBoard(getMockBranchBoardReservations(dateKey)).left,
    [dateKey],
  );
  useSyncBoardUrl();

  return <BranchBoardView date={date} entries={entries} error={null} />;
}

export function BoardApp({ branch }: { branch: boolean }) {
  if (branch) {
    return import.meta.env.DEV ? <BranchBoardAppMock /> : <BranchBoardAppLive />;
  }

  return <MainBoardApp />;
}
