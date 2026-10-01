"use client";

import { useEventStream } from "@/lib/useEventStream";

export interface TicketChange {
  ticketId: string;
  status: "pending" | "completed" | "deleted";
}

// Subscribes to changes of the given tickets (server-sent events; reconnects automatically).
// `onResync` fires after a reconnect, when changes may have been missed.
export function useTicketWatch(ids: string[], onChange: (change: TicketChange) => void, onResync: () => void) {
  const key = ids.join(",");
  useEventStream<TicketChange>(
    key ? `/api/tickets/watch?ids=${encodeURIComponent(key)}` : null,
    "ticket",
    onChange,
    onResync,
  );
}
