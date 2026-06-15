import { useEffect, useRef, useState } from "react";
import type { PartyTier } from "@/lib/partyCounts";
import { BOARD_COLUMN_SIZE, formatBoardTitle, type BoardEntry } from "@/lib/statusBoard";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const BOARD_BG = "#f0ebf8";
const BOARD_TEXT = "font-bold tabular-nums text-[#1a1a1a]";
const TIME_CELL = `text-[52px] leading-none ${BOARD_TEXT} tracking-tight`;

const COL_TIME = 180;
const COL_NAME = 290;
const COL_PARTY = 220;

const PARTY_TEXT: Record<PartyTier, string> = {
  1: "text-[52px] leading-none",
  2: "text-[49px] leading-none",
  3: "text-[44px] leading-none",
};

interface BoardViewProps {
  date: Date;
  left: BoardEntry[];
  right: BoardEntry[];
  error: string | null;
}

function seatTextClass(length: number): string {
  return length > 6 ? "text-[40px] leading-tight" : "text-[48px] leading-none";
}

function BoardSeat({ seat }: { seat: string | null }) {
  const label = seat?.trim() || "-";

  return (
    <span
      className={[
        "min-w-0 flex-1 shrink whitespace-normal break-all text-right",
        BOARD_TEXT,
        seatTextClass(label.length),
      ].join(" ")}
    >
      {label}
    </span>
  );
}

function BoardRow({ entry }: { entry: BoardEntry | null }) {
  const cellClass = `text-[52px] leading-none ${BOARD_TEXT}`;
  const suffixClass = `text-[38px] leading-none ${BOARD_TEXT}`;

  if (!entry) {
    return <div className="min-h-0 flex-1 px-8" />;
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 items-center overflow-hidden px-8">
      <span className={`${TIME_CELL} shrink-0 truncate`} style={{ width: COL_TIME }}>
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
        className={`flex shrink-0 items-baseline ${BOARD_TEXT}`}
        style={{ width: COL_PARTY }}
      >
        <span className={PARTY_TEXT[entry.partyTier]}>{entry.partySize}</span>
        <span className={suffixClass}>명</span>
      </span>
      <BoardSeat seat={entry.seat} />
    </div>
  );
}

function BoardColumn({ entries }: { entries: BoardEntry[] }) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 basis-0 flex-col overflow-hidden py-6">
      {Array.from({ length: BOARD_COLUMN_SIZE }, (_, index) => (
        <BoardRow key={index} entry={entries[index] ?? null} />
      ))}
    </div>
  );
}

export function BoardView({ date, left, right, error }: BoardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateScale = () => {
      setScale(
        Math.min(container.clientWidth / DESIGN_WIDTH, container.clientHeight / DESIGN_HEIGHT),
      );
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
          <h1 className={`text-[60px] tracking-tight ${BOARD_TEXT}`}>
            {formatBoardTitle(date)}
          </h1>
        </header>

        <div className="mx-8 mb-10 flex min-h-0 flex-1 flex-col">
          <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden rounded-[32px] bg-white shadow-md">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-no-repeat opacity-25"
              style={{
                backgroundImage: "url(/reservation-bg.png)",
                backgroundSize: "100% 100%",
              }}
            />
            <div className="relative z-10 flex min-h-0 min-w-0 flex-1">
              <BoardColumn entries={left} />
              <div className="w-[2px] shrink-0 flex-none self-stretch bg-[#e4e6ea]" />
              <BoardColumn entries={right} />
            </div>
          </div>

          {error && (
            <p className="mt-4 text-center text-[22px] text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
