import { useEffect, useState } from "react";
import { setMonth, setYear, startOfMonth } from "date-fns";
import { formatShortMonth, getKoreaTodayDate } from "@/lib/dateUtils";

interface YearMonthPickerModalProps {
  open: boolean;
  month: Date;
  onClose: () => void;
  onSelect: (month: Date) => void;
}

export function YearMonthPickerModal({
  open,
  month,
  onClose,
  onSelect,
}: YearMonthPickerModalProps) {
  const [viewYear, setViewYear] = useState(month.getFullYear());

  useEffect(() => {
    if (open) setViewYear(month.getFullYear());
  }, [open, month]);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleSelectMonth = (monthIndex: number) => {
    onSelect(startOfMonth(setMonth(setYear(new Date(), viewYear), monthIndex)));
    onClose();
  };

  const handleToday = () => {
    onSelect(startOfMonth(getKoreaTodayDate()));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-t-2xl bg-white px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-5 shadow-xl sm:rounded-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="년월 선택"
      >
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewYear((y) => y - 1)}
            className="flex h-14 w-14 items-center justify-center rounded-full text-[#3c4043] hover:bg-[#f1f3f4]"
            aria-label="이전 해"
          >
            <span className="text-4xl leading-none font-light">‹</span>
          </button>
          <p className="text-2xl font-medium text-[#3c4043]">{viewYear}년</p>
          <button
            type="button"
            onClick={() => setViewYear((y) => y + 1)}
            className="flex h-14 w-14 items-center justify-center rounded-full text-[#3c4043] hover:bg-[#f1f3f4]"
            aria-label="다음 해"
          >
            <span className="text-4xl leading-none font-light">›</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, index) => {
            const item = setMonth(setYear(new Date(), viewYear), index);
            const selected =
              item.getFullYear() === month.getFullYear() && item.getMonth() === month.getMonth();
            const label = formatShortMonth(item);

            return (
              <button
                key={index}
                type="button"
                onClick={() => handleSelectMonth(index)}
                className={[
                  "rounded-lg py-4 text-lg font-medium transition-colors",
                  selected
                    ? "bg-gcal-blue-light text-gcal-blue"
                    : "text-[#3c4043] hover:bg-[#f1f3f4]",
                ].join(" ")}
              >
                {label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleToday}
          className="mt-5 w-full rounded-lg py-4 text-lg font-medium text-gcal-blue hover:bg-gcal-blue-light"
        >
          오늘
        </button>
      </div>
    </div>
  );
}
