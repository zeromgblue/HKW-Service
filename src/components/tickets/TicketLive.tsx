"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { playSuccessChime, prepareAudio } from "@/lib/sound";
import { useTicketWatch } from "@/components/tickets/useTicketWatch";

// Refreshes the ticket page the moment staff change it; chimes when the repair is finished.
export function TicketLive({ ticketId }: { ticketId: string }) {
  const router = useRouter();

  useEffect(() => {
    const arm = () => prepareAudio();
    window.addEventListener("pointerdown", arm, { once: true });
    return () => window.removeEventListener("pointerdown", arm);
  }, []);

  useTicketWatch([ticketId], (change) => {
    if (change.status === "completed") {
      playSuccessChime();
      navigator.vibrate?.([200, 100, 200]);
    }
    router.refresh();
  });

  return null;
}
