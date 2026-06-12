import { useRef } from "react";
import {
  getCalendarDays,
  isCurrentMonth,
  isSameDate,
  isTodayDate,
  isTodayMonth,
  shiftMonth,
  toDateString,
  WEEKDAY_LABELS,
} from "@/lib/dateUtils";
import { type DaySummary } from "@/lib/monthSummary";
import { DayCell } from "@/components/DayCell";
import { useHorizontalSwipe } from "@/hooks/useHorizontalSwipe";

interface MonthCalendarProps {
  month: Date;
  selectedDate: Date | null;
  getDaySummary: (dateKey: string) => DaySummary;
  onMonthChange: (month: Date) => void;
  onDateSelect: (date: Date) => void;
}

export function MonthCalendar({
  month,
  selectedDate,
  getDaySummary,
  onMonthChange,
  onDateSelect,
}: MonthCalendarProps) {
  const days = getCalendarDays(month);
  const todayWeekday = new Date().getDay();
  const showReservationPreviews = isTodayMonth(month);
  const monthRef = useRef(month);
  monthRef.current = month;

  const swipe = useHorizontalSwipe({
    onSwipeLeft: () => onMonthChange(shiftMonth(monthRef.current, 1)),
    onSwipeRight: () => onMonthChange(shiftMonth(monthRef.current, -1)),
  });

  const weekCount = Math.ceil(days.length / 7);

  return (
    <section className="flex min-h-0 flex-1 flex-col px-0 pb-4">
      <div
        className="flex min-h-0 flex-1 flex-col touch-pan-y"
        onPointerDown={swipe.onPointerDown}
        onPointerUp={(event) => void swipe.onPointerUp(event)}
        onPointerCancel={swipe.onPointerCancel}
      >
        <div className="grid grid-cols-7 border-b-gcal-grid">
          {WEEKDAY_LABELS.map((label, index) => (
            <div
              key={label}
              className={[
                "py-2 text-center text-xs font-medium",
                index === todayWeekday ? "text-gcal-blue" : "text-gcal-gray",
              ].join(" ")}
            >
              {label}
            </div>
          ))}
        </div>

        <div
          className="grid min-h-0 flex-1 grid-cols-7 overflow-hidden border-l-gcal-grid"
          style={{ gridTemplateRows: `repeat(${weekCount}, minmax(0, 1fr))` }}
        >
          {days.map((day) => {
            const dateKey = toDateString(day);

            return (
              <DayCell
                key={dateKey}
                day={day}
                isCurrentMonth={isCurrentMonth(day, month)}
                isToday={isTodayDate(day)}
                isSelected={selectedDate ? isSameDate(day, selectedDate) : false}
                showReservations={showReservationPreviews}
                summary={getDaySummary(dateKey)}
                onSelect={onDateSelect}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}
