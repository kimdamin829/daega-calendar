import type { ReservationColor } from "@/lib/reservationColors";
import type { PartyCounts, PartySeparator } from "@/lib/partyCounts";

export interface Reservation extends PartyCounts {
  id: string;
  store_id: string;
  date: string;
  time: string;
  guest_name: string;
  seat: string | null;
  memo: string | null;
  party_separator: PartySeparator | null;
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
  party_separator: PartySeparator | null;
}

export interface ReservationInput extends ReservationContent {
  id?: string;
  start_minutes: number;
  duration_minutes: number;
  color?: ReservationColor | null;
}

export interface ReservationPositionUpdate {
  start_minutes: number;
  duration_minutes: number;
}

export type ReservationDisplaySource = Pick<
  Reservation,
  | "time"
  | "adult_count"
  | "child_count"
  | "infant_count"
  | "party_separator"
  | "guest_name"
  | "seat"
  | "memo"
>;

export type ReservationContentPayload = Omit<
  Reservation,
  "id" | "date" | "store_id" | "created_at" | "updated_at"
>;
