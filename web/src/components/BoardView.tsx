import { useEffect, useRef, useState, type RefObject } from "react";
import type { PartyTier } from "@/lib/partyCounts";
import { BOARD_COLUMN_SIZE, formatBoardTitle, type BoardEntry } from "@/lib/statusBoard";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const BG_OPACITY = 0.16;

const CREAM = "#f8f4ee";
const BROWN = "#2a1c14";
const HEADER_BG = "#ebe3d6";
const FRAME_BORDER = "#c4a882";

const GRID_COLS =
  "grid-cols-[minmax(0,0.9fr)_minmax(0,1.5fr)_minmax(0,1.25fr)_minmax(0,1.15fr)]";
const BOARD_FONT = "font-extrabold";
const HEADER_TEXT = `text-[38px] ${BOARD_FONT}`;
const CELL_TEXT = `text-[48px] ${BOARD_FONT}`;
const TITLE_TEXT = `text-[62px] ${BOARD_FONT}`;
const ROW_CLASS = `grid ${GRID_COLS} min-h-[78px] items-center px-10 text-center`;
const COLUMN_CLASS = "min-w-0 flex-1";
const SUFFIX_TEXT = HEADER_TEXT;
const TABLE_BODY_CLASS = "divide-y divide-[#f0ebe3]";

const PARTY_TEXT: Record<PartyTier, string> = {
  1: "text-[50px]",
  2: "text-[47px]",
  3: "text-[44px]",
};

const HEADER_LABELS = ["시간", "고객명", "인원", "좌석"] as const;

const ROW_INDICES = Array.from({ length: BOARD_COLUMN_SIZE }, (_, index) => index);

interface BoardViewProps {
  date: Date;
  left: BoardEntry[];
  right: BoardEntry[];
  error: string | null;
}

function TitleDivider() {
  return (
    <div className="flex shrink-0 items-center justify-center px-32 pb-5">
      <div className="h-px flex-1" style={{ backgroundColor: FRAME_BORDER }} />
      <div
        className="mx-4 h-2 w-2 rotate-45"
        style={{ backgroundColor: FRAME_BORDER }}
      />
      <div className="h-px flex-1" style={{ backgroundColor: FRAME_BORDER }} />
    </div>
  );
}

function BoardTableBackground({ centered }: { centered: boolean }) {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-white" />
      <img
        src="/reservation-bg.png"
        alt=""
        aria-hidden
        className={`pointer-events-none absolute inset-0 h-full w-full object-cover ${centered ? "object-center" : "object-right"}`}
        style={{ opacity: BG_OPACITY }}
      />
    </>
  );
}

function BoardTableHeader({ className = "" }: { className?: string }) {
  return (
    <div
      className={`grid ${GRID_COLS} px-10 py-4 text-center ${HEADER_TEXT} tracking-wide ${className}`}
      style={{ backgroundColor: HEADER_BG, color: BROWN }}
    >
      {HEADER_LABELS.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}

function BoardSplitDivider() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2"
      style={{ backgroundColor: FRAME_BORDER }}
    />
  );
}

function BoardPartyLabel({ partySize, partyTier }: { partySize: string; partyTier: PartyTier }) {
  const parts = partySize.split("&");

  return (
    <span className={BOARD_FONT}>
      {parts.map((part, index) => (
        <span key={index}>
          {index > 0 && <span className={SUFFIX_TEXT}>&</span>}
          <span className={PARTY_TEXT[partyTier]}>{part}</span>
        </span>
      ))}
      <span className={SUFFIX_TEXT}>명</span>
    </span>
  );
}

function BoardTableRow({
  entry,
  className = "",
}: {
  entry: BoardEntry | null;
  className?: string;
}) {
  if (!entry) {
    return <div className={`${ROW_CLASS} ${className}`} />;
  }

  const seatLabel = entry.seat?.trim() || "-";
  const seatSize = seatLabel.length > 6 ? "text-[42px]" : "text-[48px]";

  return (
    <div className={`${ROW_CLASS} ${className}`} style={{ color: BROWN }}>
      <span className={`${CELL_TEXT} tabular-nums`}>{entry.time}</span>
      <span className={CELL_TEXT}>
        {entry.guestName}
        <span className={SUFFIX_TEXT}>님</span>
      </span>
      <BoardPartyLabel partySize={entry.partySize} partyTier={entry.partyTier} />
      <span className={`${seatSize} ${BOARD_FONT} break-all`}>{seatLabel}</span>
    </div>
  );
}

function BoardTableBody({
  left,
  right,
  isSplit,
}: {
  left: BoardEntry[];
  right: BoardEntry[];
  isSplit: boolean;
}) {
  return (
    <div className={TABLE_BODY_CLASS}>
      {ROW_INDICES.map((index) =>
        isSplit ? (
          <div key={index} className="flex">
            <BoardTableRow entry={left[index] ?? null} className={COLUMN_CLASS} />
            <BoardTableRow entry={right[index] ?? null} className={COLUMN_CLASS} />
          </div>
        ) : (
          <BoardTableRow key={index} entry={left[index] ?? null} />
        ),
      )}
    </div>
  );
}

function BoardTable({
  left,
  right,
}: {
  left: BoardEntry[];
  right: BoardEntry[];
}) {
  const isSplit = right.length > 0;

  return (
    <div
      className={`relative overflow-hidden rounded-[20px] shadow-[0_4px_24px_rgba(42,28,20,0.08)] ${isSplit ? "w-full" : "w-[1320px]"}`}
    >
      <BoardTableBackground centered={!isSplit} />
      <div className="relative z-10">
        {isSplit ? (
          <div className="relative">
            <BoardSplitDivider />
            <div className="flex">
              <BoardTableHeader className={COLUMN_CLASS} />
              <BoardTableHeader className={COLUMN_CLASS} />
            </div>
            <BoardTableBody left={left} right={right} isSplit />
          </div>
        ) : (
          <>
            <BoardTableHeader />
            <BoardTableBody left={left} right={right} isSplit={false} />
          </>
        )}
      </div>
    </div>
  );
}

function useBoardScale(containerRef: RefObject<HTMLDivElement | null>) {
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

    const observer = new ResizeObserver(updateScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [containerRef]);

  return scale;
}

export function BoardView({ date, left, right, error }: BoardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useBoardScale(containerRef);

  return (
    <div
      ref={containerRef}
      className="flex h-dvh w-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: CREAM }}
    >
      <div
        className="relative flex shrink-0 flex-col"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          color: BROWN,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-6 rounded-sm border"
          style={{ borderColor: FRAME_BORDER }}
        />

        <header className="relative z-10 flex shrink-0 flex-col items-center pt-14">
          <h1 className={`${TITLE_TEXT} tracking-tight`}>
            {formatBoardTitle(date)}
          </h1>
        </header>

        <TitleDivider />

        <main className="relative z-10 mx-auto -mt-2 w-full shrink-0 px-12">
          <div className="flex w-full justify-center">
            <BoardTable left={left} right={right} />
          </div>
        </main>

        {error && (
          <p className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 text-center text-[22px] text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
