import { useCallback, useEffect, useState } from "react";
import { addDays, startOfMonth } from "date-fns";
import { BoardView } from "@/components/BoardView";
import { DayView } from "@/components/DayView";
import { MonthCalendar } from "@/components/MonthCalendar";
import { MonthPickerBar } from "@/components/MonthPickerBar";
import { MonthViewHeader } from "@/components/MonthViewHeader";
import { SetupNotice } from "@/components/SetupNotice";
import { useBoardReservations } from "@/hooks/useBoardReservations";
import { useReservations } from "@/hooks/useReservations";
import { useKoreaToday } from "@/hooks/useTodayDate";
import { getKoreaTodayDate, parseDateParam, syncMonthToDate, toDateString } from "@/lib/dateUtils";
import { isSupabaseConfigured } from "@/lib/supabase";

type ViewMode = "month" | "day" | "board";

function getInitialSelectedDate(): Date {
  const params = new URLSearchParams(window.location.search);
  return parseDateParam(params.get("date")) ?? getKoreaTodayDate();
}

function getInitialView(): ViewMode {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  if (view === "day") return "day";
  if (view === "board") return "board";
  return "month";
}

function getInitialMonth(selectedDate: Date): Date {
  return startOfMonth(selectedDate);
}

function BoardApp() {
  const { date, dateKey } = useKoreaToday();
  const { board, error } = useBoardReservations(dateKey);

  useEffect(() => {
    const nextUrl = `${window.location.pathname}?view=board`;
    window.history.replaceState(null, "", nextUrl);
  }, []);

  return <BoardView date={date} left={board.left} right={board.right} error={error} />;
}

function CalendarApp() {
  const [selectedDate, setSelectedDate] = useState<Date>(getInitialSelectedDate);
  const [month, setMonth] = useState<Date>(() => getInitialMonth(getInitialSelectedDate()));
  const [view, setView] = useState<ViewMode>(getInitialView);

  const {
    dayReservations,
    getDaySummary,
    error,
    saveReservationContent,
    updatePosition,
    updateColor,
    remove,
  } = useReservations(month, selectedDate);

  const applyNavigation = useCallback((date: Date, nextView: ViewMode) => {
    setSelectedDate(date);
    setMonth(startOfMonth(date));
    setView(nextView);
  }, []);

  useEffect(() => {
    const onNavigate = (event: Event) => {
      const { date, view: nextView } = (
        event as CustomEvent<{ date: string; view: ViewMode }>
      ).detail;
      const parsed = parseDateParam(date);
      if (!parsed) return;
      applyNavigation(parsed, nextView === "day" ? "day" : "month");
    };

    window.addEventListener("app-navigate", onNavigate);
    return () => window.removeEventListener("app-navigate", onNavigate);
  }, [applyNavigation]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("date", toDateString(selectedDate));
    if (view === "day") {
      params.set("view", "day");
    } else {
      params.delete("view");
    }
    const nextUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, "", nextUrl);
  }, [selectedDate, view]);

  const handleDateSelect = (date: Date) => {
    applyNavigation(date, "day");
  };

  const handleBackToMonth = () => {
    setView("month");
  };

  const handleDayChange = (nextDate: Date) => {
    setSelectedDate(nextDate);
    const nextMonth = syncMonthToDate(nextDate, month);
    if (nextMonth) setMonth(nextMonth);
  };

  if (view === "day") {
    return (
      <DayView
        date={selectedDate}
        reservations={dayReservations}
        error={error}
        onBack={handleBackToMonth}
        onUpdatePosition={updatePosition}
        onSaveContent={saveReservationContent}
        onUpdateColor={updateColor}
        onDelete={remove}
        onPreviousDay={() => handleDayChange(addDays(selectedDate, -1))}
        onNextDay={() => handleDayChange(addDays(selectedDate, 1))}
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      <MonthViewHeader month={month} onMonthChange={setMonth} />
      <MonthPickerBar month={month} onMonthChange={setMonth} />

      <MonthCalendar
        month={month}
        selectedDate={selectedDate}
        getDaySummary={getDaySummary}
        onMonthChange={setMonth}
        onDateSelect={handleDateSelect}
      />

      {error && (
        <p className="mx-0 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default function App() {
  if (!isSupabaseConfigured) {
    return <SetupNotice />;
  }

  const initialView = getInitialView();
  if (initialView === "board") {
    return <BoardApp />;
  }

  return <CalendarApp />;
}
