"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { deleteTicket } from "@/lib/actions/staffTickets";

export function DeleteTicket({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      const result = await deleteTicket(ticketId);
      if (!result.ok) {
        setError(result.error);
        setDeleting(false);
        return;
      }
      router.replace("/c");
      router.refresh();
    } catch {
      setError("ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      setDeleting(false);
    }
  }

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-neutral-400 transition hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
        ลบรายงานนี้
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-red-200 bg-red-50 p-3.5">
      <p className="flex items-start gap-2 text-sm text-red-700">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
        ลบแล้วจะกู้คืนไม่ได้ รวมถึงรูปภาพที่แนบไว้ทั้งหมด ยืนยันลบรายงานนี้ไหม?
      </p>
      {error && <p className="text-xs text-red-700">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          ยืนยันลบ
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={deleting}
          className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60"
        >
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
