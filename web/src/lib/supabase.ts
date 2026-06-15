import { createClient } from "@supabase/supabase-js";
import type {
  Reservation,
  ReservationInput,
  ReservationPositionUpdate,
} from "@/types/reservation";
import { DEFAULT_PARTY_COUNTS } from "@/lib/partyCounts";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

function normalizeReservationRow(row: Reservation): Reservation {
  const startMinutes = row.start_minutes ?? 540;

  return {
    ...row,
    adult_count: row.adult_count ?? DEFAULT_PARTY_COUNTS.adult_count,
    child_count: row.child_count ?? DEFAULT_PARTY_COUNTS.child_count,
    infant_count: row.infant_count ?? DEFAULT_PARTY_COUNTS.infant_count,
    start_minutes: startMinutes === 0 ? 540 : startMinutes,
    duration_minutes: row.duration_minutes ?? 60,
    color: row.color ?? null,
  };
}

export async function fetchReservationsInRange(
  start: string,
  end: string,
): Promise<Reservation[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .gte("date", start)
    .lte("date", end)
    .order("date")
    .order("start_minutes");

  if (error) throw error;

  return (data ?? []).map(normalizeReservationRow);
}

export async function createReservation(input: ReservationInput): Promise<Reservation> {
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { data, error } = await supabase
    .from("reservations")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateReservation(
  id: string,
  updates: Partial<ReservationInput & ReservationPositionUpdate>,
): Promise<Reservation> {
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { data, error } = await supabase
    .from("reservations")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteReservation(id: string): Promise<void> {
  if (!supabase) throw new Error("Supabase가 설정되지 않았습니다.");

  const { error } = await supabase.from("reservations").delete().eq("id", id);
  if (error) throw error;
}

