import { StatusTitleDivider } from "@/components/StatusTitleDivider";
import { formatTodayTitle } from "@/lib/statusBoard";
import {
  STATUS_BROWN,
  STATUS_CARD_SHADOW,
  STATUS_CREAM,
  STATUS_HEADER_BG,
  TODAY_SLOT_GRID,
} from "@/lib/statusDisplayTheme";
import type { TodayPeriodSummary, TodaySummary } from "@/lib/todaySummary";

const PERIOD_SECTIONS = [
  { key: "lunch", label: "점심", emptyLabel: "점심 예약이 없습니다" },
  { key: "dinner", label: "저녁", emptyLabel: "저녁 예약이 없습니다" },
] as const;

const SLOT_GRID_CLASS = `grid ${TODAY_SLOT_GRID}`;

interface TodayViewProps {
  date: Date;
  summary: TodaySummary;
  error: string | null;
}

function CountWithUnit({ value, unit }: { value: number; unit: string }) {
  return (
    <span className="text-2xl font-bold tabular-nums">
      {value}
      <span className="text-lg">{unit}</span>
    </span>
  );
}

function PeriodSummaryCard({
  label,
  teamCount,
  guestCount,
}: {
  label: string;
  teamCount: number;
  guestCount: number;
}) {
  return (
    <div
      className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl ${STATUS_CARD_SHADOW}`}
      style={{ color: STATUS_BROWN }}
    >
      <div
        className="px-3 py-3 text-center text-lg font-bold tracking-wide"
        style={{ backgroundColor: STATUS_HEADER_BG }}
      >
        {label}
      </div>
      <div className="grid grid-cols-2 gap-2 bg-white px-3 py-4">
        <p className="text-center whitespace-nowrap">
          <CountWithUnit value={teamCount} unit="팀" />
        </p>
        <p className="text-center whitespace-nowrap">
          <CountWithUnit value={guestCount} unit="명" />
        </p>
      </div>
    </div>
  );
}

function TodaySlotRow({
  time,
  teamCount,
  guestCount,
}: {
  time: string;
  teamCount: number;
  guestCount: number;
}) {
  return (
    <div
      className={`${SLOT_GRID_CLASS} items-center bg-white px-5 py-4 text-center font-bold`}
      style={{ color: STATUS_BROWN }}
    >
      <span className="text-2xl tabular-nums">{time}</span>
      <CountWithUnit value={teamCount} unit="팀" />
      <CountWithUnit value={guestCount} unit="명" />
    </div>
  );
}

function PeriodSlotTable({
  period,
  emptyLabel,
}: {
  period: TodayPeriodSummary;
  emptyLabel: string;
}) {
  return (
    <div className={`overflow-hidden rounded-2xl ${STATUS_CARD_SHADOW}`}>
      <div
        className={`${SLOT_GRID_CLASS} px-5 py-3 text-center text-lg font-bold tracking-wide`}
        style={{ backgroundColor: STATUS_HEADER_BG, color: STATUS_BROWN }}
      >
        <span>시간</span>
        <span>팀</span>
        <span>인원</span>
      </div>

      {period.slots.length > 0 ? (
        <div className="divide-y divide-[#f0ebe3] bg-white">
          {period.slots.map((slot) => (
            <TodaySlotRow
              key={slot.timeMinutes}
              time={slot.time}
              teamCount={slot.teamCount}
              guestCount={slot.guestCount}
            />
          ))}
        </div>
      ) : (
        <p className="bg-white px-5 py-10 text-center text-base font-semibold opacity-70">
          {emptyLabel}
        </p>
      )}
    </div>
  );
}

export function TodayView({ date, summary, error }: TodayViewProps) {
  return (
    <div
      className="flex min-h-dvh flex-col"
      style={{ backgroundColor: STATUS_CREAM, color: STATUS_BROWN }}
    >
      <header className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))]">
        <h1 className="text-center text-2xl font-bold tracking-tight">
          {formatTodayTitle(date)}
        </h1>
      </header>

      <StatusTitleDivider variant="today" />

      <main className="flex flex-col gap-5 px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex gap-3">
          {PERIOD_SECTIONS.map(({ key, label }) => (
            <PeriodSummaryCard
              key={key}
              label={label}
              teamCount={summary[key].teamCount}
              guestCount={summary[key].guestCount}
            />
          ))}
        </div>

        {PERIOD_SECTIONS.map(({ key, emptyLabel }) => (
          <PeriodSlotTable key={key} period={summary[key]} emptyLabel={emptyLabel} />
        ))}

        {error && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
