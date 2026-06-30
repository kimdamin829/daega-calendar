import { useCallback, useEffect, useState } from "react";
import { addDays, startOfMonth } from "date-fns";
import { BoardApp } from "@/components/BoardApp";
import { DayView } from "@/components/DayView";
import { MonthCalendar } from "@/components/MonthCalendar";
import { MonthPickerBar } from "@/components/MonthPickerBar";
import { MonthViewHeader } from "@/components/MonthViewHeader";
import { SetupNotice } from "@/components/SetupNotice";
import { TodayView } from "@/components/TodayView";
import { useStatusDisplayReservations } from "@/hooks/useStatusDisplayReservations";
import { useReservations } from "@/hooks/useReservations";
import { useKoreaToday } from "@/hooks/useTodayDate";
import { parseDateParam, syncMonthToDate } from "@/lib/dateUtils";
import { isSupabaseConfigured } from "@/lib/supabase";
import { isBranchStore } from "@/lib/storeId";
import { buildTodaySummary } from "@/lib/todaySummary";
import {
  readUrlState,
  syncCalendarUrl,
  syncTodayUrl,
  type ViewMode,
} from "@/lib/urlState";

function TodayApp() {
  const { date, dateKey } = useKoreaToday();
  const { data: summary, error } = useStatusDisplayReservations(dateKey, buildTodaySummary);

  useEffect(() => {
    syncTodayUrl();
    document.documentElement.classList.add("route-today");
    return () => document.documentElement.classList.remove("route-today");
  }, []);

  return <TodayView date={date} summary={summary} error={error} />;
}

function CalendarApp({ initialSelectedDate, initialView }: {
  initialSelectedDate: Date;
  initialView: ViewMode;
}) {
  const { dateKey: koreaTodayKey } = useKoreaToday();

  const [selectedDate, setSelectedDate] = useState(initialSelectedDate);
  const [month, setMonth] = useState(() => startOfMonth(initialSelectedDate));
  const [view, setView] = useState<ViewMode>(initialView);

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
    syncCalendarUrl(selectedDate, view);
  }, [selectedDate, view]);

  useEffect(() => {
    const root = document.documentElement;
    if (view === "day") {
      root.classList.add("route-day");
    } else {
      root.classList.remove("route-day");
    }
    return () => root.classList.remove("route-day");
  }, [view]);

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
    <div className="branch-surface flex h-full min-h-0 flex-col overflow-hidden">
      <MonthViewHeader month={month} todayKey={koreaTodayKey} onMonthChange={setMonth} />
      <MonthPickerBar month={month} onMonthChange={setMonth} />

      <MonthCalendar
        month={month}
        selectedDate={selectedDate}
        todayKey={koreaTodayKey}
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

  const { selectedDate, view } = readUrlState();
  if (view === "today") {
    return <TodayApp />;
  }
  if (view === "board") {
    return <BoardApp branch={isBranchStore()} />;
  }

  return <CalendarApp initialSelectedDate={selectedDate} initialView={view} />;
}
