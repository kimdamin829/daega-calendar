import type { Reservation } from "@/types/reservation";
import { isEligibleForStatusDisplay } from "@/lib/statusBoard";
import { formatBoardDisplayTime, resolveTimeToMinutes } from "@/lib/timeResolve";

const DINNER_START_MINUTES = 16 * 60;

export interface TodayTimeSlot {
  time: string;
  timeMinutes: number;
  teamCount: number;
  guestCount: number;
}

export interface TodayPeriodSummary {
  teamCount: number;
  guestCount: number;
  slots: TodayTimeSlot[];
}

export interface TodaySummary {
  lunch: TodayPeriodSummary;
  dinner: TodayPeriodSummary;
}

function countTodayGuests(reservation: Reservation): number {
  return reservation.adult_count + reservation.child_count;
}

function createEmptyPeriod(): TodayPeriodSummary {
  return { teamCount: 0, guestCount: 0, slots: [] };
}

export function buildTodaySummary(reservations: Reservation[]): TodaySummary {
  const summary: TodaySummary = {
    lunch: createEmptyPeriod(),
    dinner: createEmptyPeriod(),
  };
  const lunchSlotMap = new Map<number, TodayTimeSlot>();
  const dinnerSlotMap = new Map<number, TodayTimeSlot>();

  for (const reservation of reservations) {
    if (!isEligibleForStatusDisplay(reservation)) continue;

    const timeMinutes = resolveTimeToMinutes(reservation.time);
    const guests = countTodayGuests(reservation);
    const isDinner = timeMinutes >= DINNER_START_MINUTES;
    const period = isDinner ? summary.dinner : summary.lunch;
    const slotMap = isDinner ? dinnerSlotMap : lunchSlotMap;

    period.teamCount += 1;
    period.guestCount += guests;

    const existing = slotMap.get(timeMinutes);
    if (existing) {
      existing.teamCount += 1;
      existing.guestCount += guests;
      continue;
    }

    slotMap.set(timeMinutes, {
      time: formatBoardDisplayTime(reservation.time),
      timeMinutes,
      teamCount: 1,
      guestCount: guests,
    });
  }

  summary.lunch.slots = [...lunchSlotMap.values()].sort((a, b) => a.timeMinutes - b.timeMinutes);
  summary.dinner.slots = [...dinnerSlotMap.values()].sort((a, b) => a.timeMinutes - b.timeMinutes);

  return summary;
}
