import { useState } from "react";
import { formatMonthTitle, koreaDateKeyToDate } from "@/lib/dateUtils";
import { YearMonthPickerModal } from "@/components/YearMonthPickerModal";

interface MonthViewHeaderProps {
  month: Date;
  todayKey: string;
  onMonthChange: (month: Date) => void;
}

function TodayCalendarIcon({ day }: { day: number }) {
  return (
    <svg
      width="32"
      height="32"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="text-[#3c4043]"
    >
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5V3M16 5V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fill="currentColor"
        fontSize="9"
        fontWeight="600"
      >
        {day}
      </text>
    </svg>
  );
}

export function MonthViewHeader({ month, todayKey, onMonthChange }: MonthViewHeaderProps) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const todayDay = koreaDateKeyToDate(todayKey).getDate();

  return (
    <>
      <header className="bg-white pt-screen-header">
        <div className="flex items-center justify-between px-4 pb-1.5 pt-1">
          <h1 className="text-[22px] font-normal text-[#3c4043]">{formatMonthTitle(month)}</h1>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full hover:bg-[#f1f3f4]"
            aria-label="년월 선택"
          >
            <TodayCalendarIcon day={todayDay} />
          </button>
        </div>
      </header>

      <YearMonthPickerModal
        open={pickerOpen}
        month={month}
        onClose={() => setPickerOpen(false)}
        onSelect={onMonthChange}
      />
    </>
  );
}
