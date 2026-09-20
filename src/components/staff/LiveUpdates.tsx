"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, X } from "lucide-react";
import { playNewJobChime, prepareAudio } from "@/lib/sound";

interface TicketEvent {
  kind: "created" | "updated";
  ticketId: string;
  title: string;
  locationText: string;
  priority: "normal" | "urgent" | "critical";
  status: "pending" | "completed";
}

interface Toast extends TicketEvent {
  key: string;
}

// Keeps the staff list live: refreshes the page data whenever a ticket changes and shows a
// toast (with sound + vibration) for brand-new jobs.
export function LiveUpdates() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const seen = useRef(new Map<string, number>());

  useEffect(() => {
    // Browsers only allow sound after a gesture: arm audio on the first tap anywhere.
    const arm = () => prepareAudio();
    window.addEventListener("pointerdown", arm, { once: true });

    const source = new EventSource("/api/staff/stream");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false); // EventSource reconnects on its own

    source.addEventListener("ticket", (e) => {
      const event = JSON.parse((e as MessageEvent<string>).data) as TicketEvent;

      // The stream can replay a recent change after a reconnect; ignore repeats.
      const dedupeKey = `${event.kind}:${event.ticketId}:${event.status}`;
      const now = Date.now();
      if (now - (seen.current.get(dedupeKey) ?? 0) < 15000) return;
      seen.current.set(dedupeKey, now);

      clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(() => router.refresh(), 300);

      if (event.kind === "created") {
        const key = `${event.ticketId}-${now}`;
        setToasts((list) => [{ ...event, key }, ...list].slice(0, 3));
        setTimeout(() => setToasts((list) => list.filter((t) => t.key !== key)), 8000);
        playNewJobChime();
        navigator.vibrate?.([200, 100, 200]);
      }
    });

    return () => {
      window.removeEventListener("pointerdown", arm);
      clearTimeout(refreshTimer.current);
      source.close();
    };
  }, [router]);

  return (
    <>
      <span
        className="flex items-center gap-1.5 text-xs text-neutral-400"
        title={connected ? "เชื่อมต่อเรียลไทม์อยู่" : "กำลังเชื่อมต่อใหม่..."}
      >
        <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "animate-pulse bg-amber-400"}`} />
        {connected ? "เรียลไทม์" : "กำลังเชื่อมต่อ..."}
      </span>

      <div aria-live="polite" className="pointer-events-none fixed inset-x-3 top-3 z-40 flex flex-col items-center gap-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.key}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-blue-200 bg-white p-3.5 shadow-xl"
            >
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BellRing className="h-4.5 w-4.5" strokeWidth={1.75} />
              </span>
              <Link href={`/staff/tickets/${t.ticketId}`} className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-neutral-900">
                  {t.priority === "normal" ? "มีงานใหม่เข้ามา" : "งานด่วนเข้ามา!"}
                </p>
                <p className="truncate text-sm text-neutral-600">{t.title}</p>
                <p className="truncate text-xs text-neutral-400">{t.locationText}</p>
              </Link>
              <button
                type="button"
                aria-label="ปิดการแจ้งเตือน"
                onClick={() => setToasts((list) => list.filter((x) => x.key !== t.key))}
                className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
              >
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}
