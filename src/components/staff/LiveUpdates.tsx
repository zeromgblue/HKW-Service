"use client";

import { createContext, startTransition, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { BellRing, X } from "lucide-react";
import { playNewJobChime, prepareAudio } from "@/lib/sound";
import { useEventStream } from "@/lib/useEventStream";

interface TicketChanged {
  kind: "created" | "updated";
  ticketId: string;
  rev: number;
  title: string;
  locationText: string;
  priority: "normal" | "urgent" | "critical";
  status: "pending" | "completed";
}

type TicketEvent = TicketChanged | { kind: "deleted"; ticketId: string };

interface Toast extends TicketChanged {
  key: string;
}

const ConnectedContext = createContext(false);

// Keeps every staff page live: one stream for the whole /c section refreshes the current page's
// data whenever a ticket changes and shows a toast (with sound + vibration) for brand-new jobs.
export function StaffLiveProvider({
  children,
  ticketBasePath = "/c/tickets",
}: {
  children: React.ReactNode;
  // Where a new-job toast links to (the admin pages have their own ticket view).
  ticketBasePath?: string;
}) {
  const router = useRouter();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const seen = useRef(new Set<string>());
  const announced = useRef(new Set<string>());

  useEffect(() => {
    // Browsers only allow sound after a gesture: arm audio on the first tap anywhere.
    const arm = () => prepareAudio();
    window.addEventListener("pointerdown", arm, { once: true });
    return () => {
      window.removeEventListener("pointerdown", arm);
      clearTimeout(refreshTimer.current);
    };
  }, []);

  const refresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    // startTransition keeps the current page interactive (scroll, taps) while the refetch is
    // in flight, instead of the whole page feeling like it stalls until new data lands.
    refreshTimer.current = setTimeout(() => startTransition(() => router.refresh()), 300);
  }, [router]);

  const connected = useEventStream<TicketEvent>(
    "/api/staff/stream",
    "ticket",
    (event) => {
      // The stream replays recent changes after a reconnect; each revision counts once.
      const dedupeKey = event.kind === "deleted" ? `deleted:${event.ticketId}` : `${event.ticketId}:${event.rev}`;
      if (seen.current.has(dedupeKey)) return;
      seen.current.add(dedupeKey);

      refresh();

      if (event.kind === "created" && !announced.current.has(event.ticketId)) {
        announced.current.add(event.ticketId);
        const key = `${event.ticketId}-${Date.now()}`;
        setToasts((list) => [{ ...event, key }, ...list].slice(0, 3));
        setTimeout(() => setToasts((list) => list.filter((t) => t.key !== key)), 8000);
        playNewJobChime();
        navigator.vibrate?.([200, 100, 200]);
      }
    },
    refresh,
  );

  return (
    <ConnectedContext value={connected}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 top-3 z-40 flex flex-col items-center gap-2 print:hidden"
      >
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
              <Link href={`${ticketBasePath}/${t.ticketId}`} className="min-w-0 flex-1">
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
    </ConnectedContext>
  );
}

// The small "live" indicator; must be rendered inside StaffLiveProvider.
export function LiveStatus() {
  const connected = useContext(ConnectedContext);

  return (
    <span
      className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-400"
      title={connected ? "เชื่อมต่อเรียลไทม์อยู่" : "กำลังเชื่อมต่อใหม่..."}
    >
      <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "animate-pulse bg-amber-400"}`} />
      {connected ? "เรียลไทม์" : "กำลังเชื่อมต่อ..."}
    </span>
  );
}
