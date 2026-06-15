import { useEffect, useRef, useState } from "react";
import type { BoardEntry } from "@/lib/statusBoard";
import { formatBoardTitle } from "@/lib/statusBoard";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const BOARD_BG = "#f0ebf8";

/** 각 칸(왼/오) 안에서 시간 · 이름 · 인원 너비 (1920px 기준). 좌석은 나머지 */
const COL_TIME = 170;
const COL_NAME = 300;
const COL_PARTY = 220;

interface BoardViewProps {
  date: Date;
  left: BoardEntry[];
  right: BoardEntry[];
  error: string | null;
}

function seatTextClass(seat: string): string {
  if (seat.length > 6) return "text-[42px] leading-tight";
  return "text-[50px] leading-none";
}

function BoardSeat({ seat }: { seat: string | null }) {
  if (!seat) {
    return <span className="min-w-0 flex-1 shrink" />;
  }

  return (
    <span
      className={[
        "min-w-0 flex-1 shrink font-bold text-[#3c4043]",
        "whitespace-normal break-all text-right",
        seatTextClass(seat),
      ].join(" ")}
    >
      {seat}
    </span>
  );
}

function BoardRow({ entry }: { entry: BoardEntry | null }) {
  const cellClass =
    "text-[54px] leading-none font-bold text-[#3c4043]";
  const suffixClass = "text-[40px] font-bold leading-none text-[#3c4043]";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 items-center overflow-hidden px-8">
      {entry ? (
        <>
          <span className={`${cellClass} shrink-0 truncate`} style={{ width: COL_TIME }}>
            {entry.time}
          </span>
          <span
            className={`${cellClass} flex shrink-0 min-w-0 items-baseline`}
            style={{ width: COL_NAME }}
          >
            <span>{entry.guestName}</span>
            <span className={`${suffixClass} shrink-0`}>님</span>
          </span>
          <span
            className={`${cellClass} flex shrink-0 items-baseline`}
            style={{ width: COL_PARTY }}
          >
            {entry.partySize}
            <span className={suffixClass}>명</span>
          </span>
          <BoardSeat seat={entry.seat} />
        </>
      ) : null}
    </div>
  );
}

function BoardColumn({ entries }: { entries: BoardEntry[] }) {
  const slots = Array.from({ length: 10 }, (_, index) => entries[index] ?? null);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden py-6">
      {slots.map((entry, index) => (
        <BoardRow key={index} entry={entry} />
      ))}
    </div>
  );
}

export function BoardView({ date, left, right, error }: BoardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current;
      if (!container) return;

      const nextScale = Math.min(
        container.clientWidth / DESIGN_WIDTH,
        container.clientHeight / DESIGN_HEIGHT,
      );
      setScale(nextScale);
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex h-dvh w-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: BOARD_BG }}
    >
      <div
        className="flex shrink-0 flex-col"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          backgroundColor: BOARD_BG,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
        }}
      >
        <header className="flex shrink-0 items-center justify-center pt-10 pb-6">
          <h1 className="text-[64px] font-bold tracking-tight text-[#3c4043]">
            {formatBoardTitle(date)}
          </h1>
        </header>

        <div className="mx-8 mb-10 flex min-h-0 flex-1 flex-col">
          <div className="flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[32px] border border-[#ddd6f3] bg-white shadow-md">
            <BoardColumn entries={left} />
            <div className="w-[2px] shrink-0 flex-none self-stretch bg-[#e4e6ea]" />
            <BoardColumn entries={right} />
          </div>

          {error && (
            <p className="mt-4 text-center text-[24px] text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
