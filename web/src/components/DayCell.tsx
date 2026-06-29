import { type DaySummary } from "@/lib/monthSummary";
import { getMonthChipClass } from "@/lib/reservationColors";

interface DayCellProps {
  dateKey: string;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  maxPreviewLines: number;
  summary: DaySummary;
  onSelect: () => void;
}

export function DayCell({
  dateKey,
  dayOfMonth,
  isCurrentMonth,
  isToday,
  isSelected,
  maxPreviewLines,
  summary,
  onSelect,
}: DayCellProps) {
  const previews = isCurrentMonth ? summary.previews.slice(0, maxPreviewLines) : [];

  return (
    <button
      type="button"
      onClick={onSelect}
      className={[
        "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-r-gcal-grid border-b-gcal-grid pt-1 pb-1 text-left transition-colors sm:min-h-[64px]",
        isSelected && !isToday ? "bg-gcal-blue-light" : "",
        !isSelected && isCurrentMonth ? "hover:bg-[#f1f3f4]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${dateKey} 선택`}
      aria-pressed={isSelected}
    >
      <div className="flex shrink-0 justify-center">
        <span
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium",
            isToday ? "bg-gcal-blue text-white" : "",
            isCurrentMonth ? "text-gcal-text" : "text-gcal-muted",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {dayOfMonth}
        </span>
      </div>

      {previews.length > 0 && (
        <div className="mt-0.5 flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
          {previews.map((preview, index) => (
            <p
              key={`${preview.label}-${index}`}
              className={[
                "block min-h-[12px] min-w-0 shrink-0 overflow-hidden text-clip whitespace-nowrap px-1 text-[10px] leading-none sm:min-h-[13px] sm:text-[11px]",
                getMonthChipClass(preview.color),
              ].join(" ")}
            >
              {preview.label}
            </p>
          ))}
        </div>
      )}
    </button>
  );
}
