import { isFutureDate, toDateString } from "@/lib/dateUtils";
import { type DaySummary } from "@/lib/monthSummary";
import { getMonthChipClass } from "@/lib/reservationColors";
import { useDayCellPreviewLimit } from "@/hooks/useDayCellPreviewLimit";

interface DayCellProps {
  day: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  showReservations: boolean;
  summary: DaySummary;
  onSelect: (day: Date) => void;
}

export function DayCell({
  day,
  isCurrentMonth,
  isToday,
  isSelected,
  showReservations: showReservationsForMonth,
  summary,
  onSelect,
}: DayCellProps) {
  const dayNumber = day.getDate();
  const showPreviews = showReservationsForMonth && !isFutureDate(day);
  const { cellRef, maxPreviewLines } = useDayCellPreviewLimit();
  const visiblePreviews = summary.previews.slice(0, maxPreviewLines);

  return (
    <button
      ref={cellRef}
      type="button"
      onClick={() => onSelect(day)}
      className={[
        "flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden border-r-gcal-grid border-b-gcal-grid pt-1 pb-1 text-left transition-colors sm:min-h-[64px]",
        isSelected && !isToday ? "bg-gcal-blue-light" : "",
        !isSelected && isCurrentMonth ? "hover:bg-[#f1f3f4]" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={`${toDateString(day)} 선택`}
      aria-pressed={isSelected}
    >
      <div className="flex justify-center">
        <span
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-medium",
            isToday ? "bg-gcal-blue text-white" : "",
            isCurrentMonth ? "text-[#3c4043]" : "text-[#9aa0a6]",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {dayNumber}
        </span>
      </div>

      {showPreviews && visiblePreviews.length > 0 && (
        <div className="mt-0.5 flex w-full min-h-0 flex-1 flex-col gap-0.5 overflow-hidden">
          {visiblePreviews.map((preview, index) => (
            <p
              key={`${preview.label}-${index}`}
              className={[
                "block min-w-0 overflow-hidden text-clip whitespace-nowrap px-1 text-[10px] leading-tight sm:text-[11px]",
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
