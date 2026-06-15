import type { Reservation } from "@/types/reservation";
import { isOrphanPlaceholder } from "@/lib/reservationDisplay";
import { deleteReservation } from "@/lib/supabase";

export async function withoutOrphanPlaceholders(data: Reservation[]): Promise<Reservation[]> {
  const orphans = data.filter(isOrphanPlaceholder);
  if (orphans.length > 0) {
    await Promise.all(
      orphans.map((reservation) => deleteReservation(reservation.id).catch(() => undefined)),
    );
  }

  return data.filter((reservation) => !isOrphanPlaceholder(reservation));
}
