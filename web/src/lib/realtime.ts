import { notifyAndroidWidgetRefresh } from "@/lib/widgetBridge";
import { supabase } from "@/lib/supabase";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Listener = () => void;

const listeners = new Set<Listener>();
let channel: RealtimeChannel | null = null;
let notifyTimer: ReturnType<typeof setTimeout> | null = null;

function notifyListeners() {
  if (notifyTimer !== null) clearTimeout(notifyTimer);

  notifyTimer = setTimeout(() => {
    notifyTimer = null;
    listeners.forEach((listener) => listener());
    notifyAndroidWidgetRefresh();
  }, 80);
}

function ensureChannel() {
  if (!supabase || channel) return;

  channel = supabase
    .channel("reservations-global")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "reservations" },
      () => notifyListeners(),
    )
    .subscribe();
}

function teardownChannel() {
  if (!supabase || !channel || listeners.size > 0) return;

  void supabase.removeChannel(channel);
  channel = null;
}

export function subscribeReservations(onChange: Listener): () => void {
  if (!supabase) return () => {};

  listeners.add(onChange);
  ensureChannel();

  return () => {
    listeners.delete(onChange);
    teardownChannel();
  };
}
