import { useEffect } from "react";
import { BoardView } from "@/components/BoardView";
import { BranchBoardView } from "@/components/BranchBoardView";
import { useStatusDisplayReservations } from "@/hooks/useStatusDisplayReservations";
import { useKoreaToday } from "@/hooks/useTodayDate";
import { buildBranchStatusBoard, buildStatusBoard } from "@/lib/statusBoard";
import { syncBoardUrl } from "@/lib/urlState";

/** 잠시 동안만 true — 끝나면 false로 되돌리면 기존 현황판 복구 */
const SHOW_BRANCH_BOARD_POSTER = false;

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

function BranchBoardPoster() {
  useSyncBoardUrl();

  return (
    <div className="flex h-dvh w-full items-center justify-center overflow-hidden bg-black">
      <img
        src="/branch-board-poster.png"
        alt=""
        width={1080}
        height={1920}
        className="h-full w-full object-contain"
      />
    </div>
  );
}

function BranchBoardApp() {
  const { date, dateKey } = useKoreaToday();
  const { data: board, error } = useStatusDisplayReservations(dateKey, buildBranchStatusBoard);
  useSyncBoardUrl();

  return <BranchBoardView date={date} entries={board.left} error={error} />;
}

export function BoardApp({ branch }: { branch: boolean }) {
  if (branch) {
    if (SHOW_BRANCH_BOARD_POSTER) {
      return <BranchBoardPoster />;
    }
    return <BranchBoardApp />;
  }

  return <MainBoardApp />;
}
