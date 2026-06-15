import type { ReservationColor } from "@/lib/reservationColors";
import type { PartyCounts } from "@/lib/partyCounts";

export interface Reservation extends PartyCounts {
  id: string;
  date: string;
  time: string;
  guest_name: string;
  seat: string | null;
  memo: string | null;
  start_minutes: number;
  duration_minutes: number;
  color: ReservationColor | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationContent extends PartyCounts {
  date: string;
  time: string;
  guest_name: string;
  seat: string | null;
  memo: string | null;
}

export interface ReservationInput extends ReservationContent {
  start_minutes: number;
  duration_minutes: number;
  color?: ReservationColor | null;
}

export interface ReservationPositionUpdate {
  start_minutes: number;
  duration_minutes: number;
}
