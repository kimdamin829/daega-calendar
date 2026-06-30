import { useRef } from "react";
import {
  BoardGuestNameCell,
  BoardPartyLabel,
  BoardTableError,
} from "@/components/board/BoardTableCells";
import { useBoardScale } from "@/hooks/useBoardScale";
import {
  BOARD_FONT,
  BOARD_HEADER_LABELS,
  BRANCH_BOARD_TYPOGRAPHY,
  getSeatTextClass,
} from "@/lib/boardTableTheme";
import { BRANCH_BOARD_COLUMN_SIZE, formatBoardTitle, type BoardEntry } from "@/lib/statusBoard";
import {
  BRANCH_HEADER_BG,
  BRANCH_HEADER_TEXT,
  BRANCH_ROW_DIVIDER,
  STATUS_BROWN,
  STATUS_CREAM,
  STATUS_FRAME_BORDER,
} from "@/lib/statusDisplayTheme";

const DESIGN_WIDTH = 1080;
const DESIGN_HEIGHT = 1920;
const BRANCH_TABLE_WIDTH = 920;
const TYPO = BRANCH_BOARD_TYPOGRAPHY;
const TITLE_TEXT = `text-[58px] ${BOARD_FONT} tracking-tight`;
const TABLE_BODY_CLASS = "flex flex-1 flex-col bg-white";

const ROW_INDICES = Array.from({ length: BRANCH_BOARD_COLUMN_SIZE }, (_, index) => index);

interface BranchBoardViewProps {
  date: Date;
  entries: BoardEntry[];
  error: string | null;
}

function BranchBoardCorner({ className }: { className?: string }) {
  return (
    <svg aria-hidden className={className} viewBox="0 0 48 48" fill="none">
      <path
        d="M4 28 Q4 4 28 4"
        stroke={STATUS_FRAME_BORDER}
        strokeWidth="1.5"
        fill="none"
      />
      <circle cx="28" cy="4" r="2" fill={STATUS_FRAME_BORDER} />
    </svg>
  );
}

function BranchBoardFrame() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-8">
      <div
        className="absolute inset-0 rounded-sm border"
        style={{ borderColor: STATUS_FRAME_BORDER }}
      />
      <BranchBoardCorner className="absolute top-0 left-0 h-12 w-12" />
      <BranchBoardCorner className="absolute top-0 right-0 h-12 w-12 -scale-x-100" />
      <BranchBoardCorner className="absolute bottom-0 left-0 h-12 w-12 -scale-y-100" />
      <BranchBoardCorner className="absolute right-0 bottom-0 h-12 w-12 -scale-100" />
    </div>
  );
}

function BoardTableHeader() {
  return (
    <div
      className={`grid shrink-0 ${TYPO.gridCols} px-10 py-3 text-center ${TYPO.headerText} tracking-wide`}
      style={{ backgroundColor: BRANCH_HEADER_BG, color: BRANCH_HEADER_TEXT }}
    >
      {BOARD_HEADER_LABELS.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}

function BoardTableRow({
  entry,
  showDivider,
}: {
  entry: BoardEntry | null;
  showDivider: boolean;
}) {
  const rowClass = `grid ${TYPO.gridCols} flex-1 min-h-0 items-center px-10 text-center`;
  const dividerStyle = showDivider ? { borderBottom: `1px solid ${BRANCH_ROW_DIVIDER}` } : undefined;

  if (!entry) {
    return <div className={rowClass} style={dividerStyle} />;
  }

  const seatClass = getSeatTextClass(entry.seat, TYPO);

  return (
    <div className={rowClass} style={{ color: STATUS_BROWN, ...dividerStyle }}>
      <span className={`${TYPO.cellText} tabular-nums`}>{entry.time}</span>
      <BoardGuestNameCell guestNameChars={entry.guestNameChars} typography={TYPO} />
      <BoardPartyLabel partyParts={entry.partyParts} typography={TYPO} />
      <span className={`${seatClass} ${BOARD_FONT} break-all`}>{entry.seat?.trim() || "-"}</span>
    </div>
  );
}

function BoardTable({ entries }: { entries: BoardEntry[] }) {
  return (
    <div
      className="relative flex h-full flex-col overflow-hidden rounded-[20px] shadow-[0_4px_24px_rgba(42,28,20,0.1)]"
      style={{ width: BRANCH_TABLE_WIDTH }}
    >
      <BoardTableHeader />
      <div className={TABLE_BODY_CLASS}>
        {ROW_INDICES.map((index) => (
          <BoardTableRow
            key={index}
            entry={entries[index] ?? null}
            showDivider={index < BRANCH_BOARD_COLUMN_SIZE - 1}
          />
        ))}
      </div>
    </div>
  );
}

export function BranchBoardView({ date, entries, error }: BranchBoardViewProps) {
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
        <BranchBoardFrame />

        <header className="relative z-10 flex shrink-0 flex-col items-center px-16 pt-20 pb-6">
          <h1 className={`${TITLE_TEXT} text-center`}>{formatBoardTitle(date)}</h1>
        </header>

        <main
          className="relative z-10 mx-auto mt-3 flex min-h-0 flex-1 flex-col items-center pb-6"
          style={{ width: BRANCH_TABLE_WIDTH, maxWidth: "100%" }}
        >
          <BoardTable entries={entries} />
        </main>

        <footer className="relative z-10 flex shrink-0 flex-col items-center px-16 pt-4 pb-14 text-center">
          <p className="text-[35px] leading-snug font-medium">
            오늘도 소중한 시간을 함께해 주셔서 감사합니다.
          </p>
        </footer>

        <BoardTableError error={error} />
      </div>
    </div>
  );
}
