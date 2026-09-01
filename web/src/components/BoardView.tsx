import { useRef } from "react";
import { BoardGuestNameCell, BoardPartyLabel, BoardTableError } from "@/components/board/BoardTableCells";
import { BoardHolidayFooterNotice } from "@/components/board/BoardHolidayFooterNotice";
import { StatusTitleDivider } from "@/components/StatusTitleDivider";
import { useBoardScale } from "@/hooks/useBoardScale";
import {
  BOARD_FONT,
  BOARD_HEADER_LABELS,
  getSeatTextClass,
  MAIN_BOARD_TYPOGRAPHY,
} from "@/lib/boardTableTheme";
import { BOARD_COLUMN_SIZE, formatBoardTitle, type BoardEntry } from "@/lib/statusBoard";
import {
  STATUS_BROWN,
  STATUS_CREAM,
  STATUS_FRAME_BORDER,
  STATUS_HEADER_BG,
} from "@/lib/statusDisplayTheme";

const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const BG_OPACITY = 0.24;
const TYPO = MAIN_BOARD_TYPOGRAPHY;

const ROW_CLASS = `grid ${TYPO.gridCols} min-h-[72px] items-center px-10 text-center`;
const COLUMN_CLASS = "min-w-0 flex-1";
const TITLE_TEXT = `text-[62px] ${BOARD_FONT}`;
const TABLE_BODY_CLASS = "divide-y divide-[#f0ebe3]";

const ROW_INDICES = Array.from({ length: BOARD_COLUMN_SIZE }, (_, index) => index);

interface BoardViewProps {
  date: Date;
  left: BoardEntry[];
  right: BoardEntry[];
  error: string | null;
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
      className={`grid ${TYPO.gridCols} px-10 py-3 text-center ${TYPO.headerText} tracking-wide ${className}`}
      style={{ backgroundColor: STATUS_HEADER_BG, color: STATUS_BROWN }}
    >
      {BOARD_HEADER_LABELS.map((label) => (
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
      style={{ backgroundColor: STATUS_FRAME_BORDER }}
    />
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

  const seatClass = getSeatTextClass(entry.seat, TYPO);

  return (
    <div className={`${ROW_CLASS} ${className}`} style={{ color: STATUS_BROWN }}>
      <span className={`${TYPO.cellText} tabular-nums`}>{entry.time}</span>
      <BoardGuestNameCell guestNameChars={entry.guestNameChars} typography={TYPO} />
      <BoardPartyLabel partyParts={entry.partyParts} typography={TYPO} />
      <span className={`${seatClass} ${BOARD_FONT} break-all`}>{entry.seat?.trim() || "-"}</span>
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

function BoardTable({ left, right }: { left: BoardEntry[]; right: BoardEntry[] }) {
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

export function BoardView({ date, left, right, error }: BoardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scale = useBoardScale(containerRef, DESIGN_WIDTH, DESIGN_HEIGHT);

  return (
    <div
      ref={containerRef}
      className="flex h-dvh w-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: STATUS_CREAM }}
    >
      <div
        className="relative flex shrink-0 flex-col"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          color: STATUS_BROWN,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-6 rounded-sm border"
          style={{ borderColor: STATUS_FRAME_BORDER }}
        />

        <header className="relative z-10 flex shrink-0 flex-col items-center pt-10">
          <h1 className={`${TITLE_TEXT} tracking-tight`}>{formatBoardTitle(date)}</h1>
        </header>

        <StatusTitleDivider className="pb-2" />

        <main className="relative z-10 mx-auto -mt-3 w-full shrink-0 px-12">
          <div className="flex w-full justify-center">
            <BoardTable left={left} right={right} />
          </div>
        </main>

        <footer className="relative z-10 flex shrink-0 flex-col items-center px-12 pt-3 pb-8 text-center">
          <BoardHolidayFooterNotice />
        </footer>

        <BoardTableError error={error} />
      </div>
    </div>
  );
}
