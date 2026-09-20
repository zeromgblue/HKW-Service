"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, ChevronRight, Hourglass, Loader2, Search, X } from "lucide-react";
import { getMyTickets } from "@/lib/actions/myTickets";
import { forgetTicket, rememberTicket, useMyTicketIds } from "@/lib/myTickets";
import { isValidTicketId, type PublicTicket } from "@/lib/tickets/publicTicket";
import { formatThaiDateTime } from "@/lib/formatDate";
import { playSuccessChime, prepareAudio } from "@/lib/sound";
import { useTicketWatch } from "@/components/tickets/useTicketWatch";

const VISIBLE_LIMIT = 4;

// "My jobs" on the home page: the tickets this teacher reported (remembered on this device),
// with live status so they see the moment a repair is finished.
export function MyTickets() {
  const ids = useMyTicketIds();
  const idsKey = ids.join(",");
  const [tickets, setTickets] = useState<PublicTicket[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [doneToast, setDoneToast] = useState<PublicTicket | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const known = useRef(new Map<string, PublicTicket>());

  const load = useCallback(async (list: string[]) => {
    if (list.length === 0) return [];
    const result = await getMyTickets(list);
    setTickets(result);
    return result;
  }, []);

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    getMyTickets(ids).then((result) => {
      if (cancelled) return;
      known.current = new Map(result.map((t) => [t.ticketId, t]));
      setTickets(result);
    });
    return () => {
      cancelled = true;
    };
    // idsKey is the stable identity of `ids`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  useEffect(() => {
    const arm = () => prepareAudio();
    window.addEventListener("pointerdown", arm, { once: true });
    return () => window.removeEventListener("pointerdown", arm);
  }, []);

  useTicketWatch(ids, async (change) => {
    const before = known.current.get(change.ticketId);
    const result = await load(ids);
    known.current = new Map(result.map((t) => [t.ticketId, t]));
    const now = known.current.get(change.ticketId);
    if (before?.status === "pending" && now?.status === "completed") {
      setDoneToast(now);
      playSuccessChime();
      navigator.vibrate?.([200, 100, 200]);
      setTimeout(() => setDoneToast(null), 9000);
    }
  });

  async function addById() {
    const id = addValue.trim().toUpperCase();
    if (!isValidTicketId(id)) {
      setAddError("รูปแบบ Ticket ID ไม่ถูกต้อง (เช่น RP-ABCD2345)");
      return;
    }
    setAdding(true);
    setAddError(null);
    try {
      const found = await getMyTickets([id]);
      if (found.length === 0) {
        setAddError("ไม่พบ Ticket ID นี้");
        return;
      }
      rememberTicket(id);
      setAddValue("");
      setAddOpen(false);
    } catch {
      setAddError("ค้นหาไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setAdding(false);
    }
  }

  // Hide removed tickets immediately, even before the next fetch returns.
  const sorted = (tickets ?? []).filter((t) => ids.includes(t.ticketId)).sort((a, b) => {
    if (a.status !== b.status) return a.status === "pending" ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
  const visible = showAll ? sorted : sorted.slice(0, VISIBLE_LIMIT);

  return (
    <section className="flex flex-col gap-3" aria-label="งานของฉัน">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-neutral-900">งานของฉัน</h2>
        <button
          type="button"
          onClick={() => setAddOpen((v) => !v)}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
          มี Ticket ID?
        </button>
      </div>

      <AnimatePresence initial={false}>
        {addOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-1.5 rounded-2xl border border-neutral-200 bg-white p-3">
              <div className="flex gap-2">
                <input
                  value={addValue}
                  onChange={(e) => setAddValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addById()}
                  placeholder="RP-XXXXXXXX"
                  maxLength={11}
                  className="min-w-0 flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm uppercase focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={addById}
                  disabled={adding}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white disabled:opacity-60"
                >
                  {adding && <Loader2 className="h-4 w-4 animate-spin" />}
                  เพิ่ม
                </button>
              </div>
              {addError && <p className="text-xs text-red-600">{addError}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {tickets === null && ids.length > 0 && <div className="h-16 animate-pulse rounded-2xl bg-neutral-100" />}

      {(tickets !== null || ids.length === 0) && sorted.length === 0 && (
        <p className="rounded-2xl border border-dashed border-neutral-200 bg-white/60 px-4 py-5 text-center text-xs text-neutral-400">
          งานที่คุณแจ้งจะแสดงที่นี่ เพื่อให้ติดตามได้ว่าซ่อมเสร็จหรือยัง
        </p>
      )}

      <ul className="flex flex-col gap-2.5">
        {visible.map((t) => {
          const done = t.status === "completed";
          return (
            <li key={t.ticketId} className="relative">
              <Link
                href={`/ticket/${t.ticketId}`}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 shadow-sm transition ${
                  done ? "border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50" : "border-neutral-200 bg-white hover:border-blue-300"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    done ? "bg-emerald-500 text-white" : "bg-amber-50 text-amber-600"
                  }`}
                >
                  {done ? <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} /> : <Hourglass className="h-5 w-5" strokeWidth={1.75} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-neutral-900">{t.title}</span>
                  <span className={`block text-xs ${done ? "font-medium text-emerald-700" : "text-neutral-500"}`}>
                    {done
                      ? `ซ่อมเสร็จแล้ว${t.completedAt ? ` · ${formatThaiDateTime(t.completedAt)}` : ""}`
                      : `รอช่างดำเนินการ · แจ้งเมื่อ ${formatThaiDateTime(t.createdAt)}`}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
              </Link>
              {done && (
                <button
                  type="button"
                  aria-label="ลบออกจากรายการ"
                  onClick={() => forgetTicket(t.ticketId)}
                  className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-neutral-300 hover:bg-white hover:text-neutral-500"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {sorted.length > VISIBLE_LIMIT && (
        <button type="button" onClick={() => setShowAll((v) => !v)} className="text-xs font-medium text-blue-600 hover:underline">
          {showAll ? "แสดงน้อยลง" : `แสดงทั้งหมด (${sorted.length})`}
        </button>
      )}

      <AnimatePresence>
        {doneToast && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed inset-x-3 top-3 z-40 mx-auto flex max-w-md items-start gap-3 rounded-2xl border border-emerald-200 bg-white p-3.5 shadow-xl"
          >
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-white">
              <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <Link href={`/ticket/${doneToast.ticketId}`} className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-neutral-900">ซ่อมเสร็จแล้ว!</p>
              <p className="truncate text-sm text-neutral-600">{doneToast.title}</p>
              <p className="text-xs text-emerald-700">แตะเพื่อดูรายละเอียดและรูปหลังซ่อม</p>
            </Link>
            <button
              type="button"
              aria-label="ปิด"
              onClick={() => setDoneToast(null)}
              className="rounded-full p-1 text-neutral-400 hover:bg-neutral-100"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
