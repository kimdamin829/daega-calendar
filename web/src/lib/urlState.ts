import { getKoreaTodayDate, parseDateParam, toDateString } from "@/lib/dateUtils";

export type ViewMode = "month" | "day" | "board" | "today";

export const TODAY_PATH = "/today";

function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function isTodayRoute(): boolean {
  const pathname = normalizePathname(window.location.pathname);
  if (pathname === TODAY_PATH) return true;
  return new URLSearchParams(window.location.search).has("today");
}

/** iOS 홈 화면 추가 시 쿼리가 빠지는 경우가 있어 경로 기반(/today)으로 통일 */
export function normalizeTodayRoute(): void {
  if (!isTodayRoute()) return;
  if (normalizePathname(window.location.pathname) === TODAY_PATH) return;
  window.history.replaceState(null, "", TODAY_PATH);
}

export function readUrlState(): { selectedDate: Date; view: ViewMode } {
  if (isTodayRoute()) {
    return { selectedDate: getKoreaTodayDate(), view: "today" };
  }

  const params = new URLSearchParams(window.location.search);
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
