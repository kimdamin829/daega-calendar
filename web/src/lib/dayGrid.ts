export const HOUR_HEIGHT = 64;
export const SNAP_MINUTES = 15;
export const DEFAULT_DURATION = 60;

export const TIMELINE_START_HOUR = 9;
export const TIMELINE_END_HOUR = 21;
const TIMELINE_START_MINUTES = TIMELINE_START_HOUR * 60;
const TIMELINE_END_MINUTES = TIMELINE_END_HOUR * 60;
export const TIMELINE_HOUR_COUNT = TIMELINE_END_HOUR - TIMELINE_START_HOUR;
export const TIMELINE_PADDING_ROWS = 1;
export const TIMELINE_CONTENT_OFFSET_Y = TIMELINE_PADDING_ROWS * HOUR_HEIGHT;
export const GRID_HEIGHT =
  HOUR_HEIGHT * (TIMELINE_HOUR_COUNT + TIMELINE_PADDING_ROWS * 2);

function snapMinutes(minutes: number): number {
  return Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES;
}

export function offsetYToSnappedMinutes(offsetY: number): number {
  return Math.round(((offsetY / HOUR_HEIGHT) * 60) / SNAP_MINUTES) * SNAP_MINUTES;
}

export function clampMinutes(minutes: number, duration: number): number {
  const maxStart = TIMELINE_END_MINUTES - duration;
  return Math.max(TIMELINE_START_MINUTES, Math.min(snapMinutes(minutes), maxStart));
}

export function minutesToY(minutes: number): number {
  return (
    TIMELINE_CONTENT_OFFSET_Y +
    ((minutes - TIMELINE_START_MINUTES) / 60) * HOUR_HEIGHT
  );
}

export function durationToHeight(durationMinutes: number): number {
  return (durationMinutes / 60) * HOUR_HEIGHT;
}

export function yToMinutes(y: number): number {
  const contentY = y - TIMELINE_CONTENT_OFFSET_Y;
  return snapMinutes(TIMELINE_START_MINUTES + (contentY / HOUR_HEIGHT) * 60);
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return "오전 12시";
  if (hour < 12) return `오전 ${hour}시`;
  if (hour === 12) return "오후 12시";
  return `오후 ${hour - 12}시`;
}
