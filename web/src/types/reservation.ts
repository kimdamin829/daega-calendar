import type { ReservationColor } from "@/lib/reservationColors";

export interface Reservation {
  id: string;
  date: string;
  time: string;
  party_size: number;
  guest_name: string;
  seat: string | null;
  memo: string | null;
  start_minutes: number;
  duration_minutes: number;
  color: ReservationColor | null;
  created_at: string;
  updated_at: string;
}

export interface ReservationContent {
  date: string;
  time: string;
  party_size: number;
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
