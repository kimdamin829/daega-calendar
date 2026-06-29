import { useLayoutEffect, useRef } from "react";
import { isSameMonth } from "date-fns";
import { formatShortMonth, getMonthsInYear } from "@/lib/dateUtils";

interface MonthPickerBarProps {
  month: Date;
  onMonthChange: (month: Date) => void;
}

function monthOffset(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

function centerSelectedMonth(
  scroll: HTMLDivElement,
  selected: HTMLButtonElement,
  behavior: ScrollBehavior,
) {
  const maxScroll = scroll.scrollWidth - scroll.clientWidth;
  const target =
    selected.offsetLeft - (scroll.clientWidth - selected.offsetWidth) / 2;
  const left = Math.max(0, Math.min(target, maxScroll));

  if (behavior === "smooth") {
    scroll.scrollTo({ left, behavior: "smooth" });
  } else {
    scroll.scrollLeft = left;
  }
}

export function MonthPickerBar({ month, onMonthChange }: MonthPickerBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLButtonElement>(null);
  const skipSmoothOnce = useRef(true);
  const prevMonthRef = useRef(month);
  const year = month.getFullYear();
  const months = getMonthsInYear(year);

  useLayoutEffect(() => {
    const scroll = scrollRef.current;
    const selected = selectedRef.current;
    if (!scroll || !selected) return;

    const delta = Math.abs(monthOffset(prevMonthRef.current, month));
    let behavior: ScrollBehavior;
    if (skipSmoothOnce.current) {
      behavior = "instant";
      skipSmoothOnce.current = false;
    } else if (delta === 1) {
      behavior = "smooth";
    } else {
      behavior = "instant";
    }

    centerSelectedMonth(scroll, selected, behavior);
    prevMonthRef.current = month;
  }, [month]);

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto px-3 pb-3 pt-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {months.map((item) => {
        const selected = isSameMonth(item, month);
        const label = formatShortMonth(item);

        return (
          <button
            key={`${year}-${item.getMonth()}`}
            ref={selected ? selectedRef : undefined}
            type="button"
            onClick={() => onMonthChange(item)}
            className={[
              "shrink-0 rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
              selected
                ? "border-gcal-blue bg-gcal-blue-light text-gcal-blue"
                : "border-gcal-border bg-white text-[#3c4043] hover:bg-[#f1f3f4]",
            ].join(" ")}
            aria-pressed={selected}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
