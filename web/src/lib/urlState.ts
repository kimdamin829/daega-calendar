import { getKoreaTodayDate, parseDateParam, toDateString } from "@/lib/dateUtils";

export type ViewMode = "month" | "day" | "board" | "today";

export function readUrlState(): { selectedDate: Date; view: ViewMode } {
  const params = new URLSearchParams(window.location.search);
  if (params.has("today")) {
    return { selectedDate: getKoreaTodayDate(), view: "today" };
  }

  const viewParam = params.get("view");
  const view: ViewMode =
    viewParam === "day"
      ? "day"
      : viewParam === "board"
        ? "board"
        : "month";
  const selectedDate = parseDateParam(params.get("date")) ?? getKoreaTodayDate();
  return { selectedDate, view };
}

export function syncBoardUrl(): void {
  window.history.replaceState(null, "", `${window.location.pathname}?view=board`);
}

export function syncTodayUrl(): void {
  window.history.replaceState(null, "", `${window.location.pathname}?today`);
}

export function syncCalendarUrl(selectedDate: Date, view: ViewMode): void {
  const params = new URLSearchParams(window.location.search);
  params.set("date", toDateString(selectedDate));
  if (view === "day") {
    params.set("view", "day");
  } else {
    params.delete("view");
  }
  window.history.replaceState(null, "", `${window.location.pathname}?${params.toString()}`);
}
