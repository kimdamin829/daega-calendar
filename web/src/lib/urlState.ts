import { getKoreaTodayDate, parseDateParam, toDateString } from "@/lib/dateUtils";

export type ViewMode = "month" | "day" | "board" | "today";

export const TODAY_PATH = "/today";

function normalizePathname(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}

export function isTodayRoute(): boolean {
  return normalizePathname(window.location.pathname) === TODAY_PATH;
}

/** 구형 ?today 북마크 → /today */
export function normalizeTodayRoute(): void {
  if (isTodayRoute()) return;
  if (!new URLSearchParams(window.location.search).has("today")) return;
  window.history.replaceState(null, "", TODAY_PATH);
}

export function readUrlState(): { selectedDate: Date; view: ViewMode } {
  if (isTodayRoute()) {
    return { selectedDate: getKoreaTodayDate(), view: "today" };
  }

  const params = new URLSearchParams(window.location.search);
  const viewParam = params.get("view");
  const view: ViewMode =
    viewParam === "day" ? "day" : viewParam === "board" ? "board" : "month";
  const selectedDate = parseDateParam(params.get("date")) ?? getKoreaTodayDate();
  return { selectedDate, view };
}

export function syncBoardUrl(): void {
  window.history.replaceState(null, "", `${window.location.pathname}?view=board`);
}

export function syncTodayUrl(): void {
  window.history.replaceState(null, "", TODAY_PATH);
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
