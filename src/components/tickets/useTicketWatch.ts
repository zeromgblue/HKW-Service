"use client";

import { useEffect, useRef } from "react";

export interface TicketChange {
  ticketId: string;
  status: "pending" | "completed";
}

// Subscribes to changes of the given tickets (server-sent events; reconnects automatically).
export function useTicketWatch(ids: string[], onChange: (change: TicketChange) => void) {
  const handler = useRef(onChange);
  useEffect(() => {
    handler.current = onChange;
  });

  const key = ids.join(",");
  useEffect(() => {
    if (!key) return;
    const source = new EventSource(`/api/tickets/watch?ids=${encodeURIComponent(key)}`);
    source.addEventListener("ticket", (e) => {
      handler.current(JSON.parse((e as MessageEvent<string>).data) as TicketChange);
    });
    return () => source.close();
  }, [key]);
}
