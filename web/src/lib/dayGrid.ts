export const HOUR_HEIGHT = 64;
export const SNAP_MINUTES = 60;
export const DEFAULT_DURATION = 60;

export const TIMELINE_START_HOUR = 0;
export const TIMELINE_END_HOUR = 24;
export const TIMELINE_PADDING_ROWS = 0;
const TIMELINE_START_MINUTES = TIMELINE_START_HOUR * 60;
const TIMELINE_MIN_MINUTES =
  (TIMELINE_START_HOUR - TIMELINE_PADDING_ROWS) * 60;
const TIMELINE_END_MINUTES = TIMELINE_END_HOUR * 60;
export const TIMELINE_HOUR_COUNT = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
export function getTimelineContentOffsetY(hourHeight: number = HOUR_HEIGHT): number {
  return TIMELINE_PADDING_ROWS * hourHeight;
}

export function getGridHeight(hourHeight: number = HOUR_HEIGHT): number {
  return hourHeight * (TIMELINE_HOUR_COUNT + TIMELINE_PADDING_ROWS * 2);
}

export const TIMELINE_CONTENT_OFFSET_Y = getTimelineContentOffsetY(HOUR_HEIGHT);
export const GRID_HEIGHT = getGridHeight(HOUR_HEIGHT);

function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function offsetYToSnappedMinutes(
  offsetY: number,
  hourHeight: number = HOUR_HEIGHT,
): number {
  return Math.round(((offsetY / hourHeight) * 60) / SNAP_MINUTES) * SNAP_MINUTES;
}

export function clampMinutes(minutes: number, duration: number): number {
  const maxStart = TIMELINE_END_MINUTES - duration;
  return Math.max(TIMELINE_MIN_MINUTES, Math.min(snapMinutes(minutes), maxStart));
}

export function minutesToY(minutes: number, hourHeight: number = HOUR_HEIGHT): number {
  return (
    getTimelineContentOffsetY(hourHeight) +
    ((minutes - TIMELINE_START_MINUTES) / 60) * hourHeight
  );
}

export function durationToHeight(
  durationMinutes: number,
  hourHeight: number = HOUR_HEIGHT,
): number {
  return (durationMinutes / 60) * hourHeight;
}

export function yToMinutes(y: number, hourHeight: number = HOUR_HEIGHT): number {
  const contentY = y - getTimelineContentOffsetY(hourHeight);
  return snapMinutes(TIMELINE_START_MINUTES + (contentY / hourHeight) * 60);
}

export function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "";
  if (hour < 12) return `오전 ${hour}시`;
  if (hour === 12) return "오후 12시";
  return `오후 ${hour - 12}시`;
}
