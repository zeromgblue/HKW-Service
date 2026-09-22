"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Camera, CheckCircle2, Circle, Loader2, UserRound, Volume2, VolumeX } from "lucide-react";
import { completeTicket } from "@/lib/actions/staffTickets";
import { uploadTicketImages } from "@/lib/actions/images";
import { isSoundMuted, playSuccessChime, prepareAudio, setSoundMuted, subscribeSoundMuted } from "@/lib/sound";
import { ImagePicker } from "@/components/report/ImagePicker";
import { SlideToComplete } from "@/components/ui/SlideToComplete";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { saveStaffName, useStaffName } from "@/components/staff/useStaffName";

export interface AfterImage {
  id: string;
  url: string;
}

export function CompleteJob({ ticketId, afterImages }: { ticketId: string; afterImages: AfterImage[] }) {
  const router = useRouter();
  const rawName = useStaffName();
  const actor = rawName.trim();
  const [pickerKey, setPickerKey] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const muted = useSyncExternalStore(subscribeSoundMuted, isSoundMuted, () => false);

  const hasPhoto = afterImages.length > 0;
  const hasActor = actor.length >= 2;
  const canSlide = hasPhoto && hasActor;

  // Photos upload as soon as they are picked. The picker is remounted afterwards (success or
  // failure) so it never holds stale previews.
  async function uploadPicked(files: File[]) {
    if (uploading || files.length === 0) return;
    if (!hasActor) {
      setPickerKey((k) => k + 1);
      setError("กรุณาใส่ชื่อผู้ดำเนินการก่อน แล้วเลือกรูปอีกครั้ง");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const result = await uploadTicketImages(ticketId, "after", actor, files);
      if (!result.ok) {
        setError(result.error);
      } else if (result.uploaded === 0) {
        setError("อัปโหลดรูปไม่สำเร็จ กรุณาตรวจสอบไฟล์แล้วลองใหม่");
      } else if (result.failed > 0) {
        setError(`อัปโหลดสำเร็จ ${result.uploaded} รูป ไม่สำเร็จ ${result.failed} รูป`);
      }
      router.refresh();
    } catch {
      setError("อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setPickerKey((k) => k + 1);
      setUploading(false);
    }
  }

  // Called from the slide gesture. Resolves true only after the server confirmed the close.
  async function handleCommit(): Promise<boolean> {
    prepareAudio(); // still inside the user gesture, so the chime is allowed later
    setError(null);
    try {
      const result = await completeTicket({ ticketId, actorName: actor });
      if (!result.ok) {
        setError(result.error);
        return false;
      }
    } catch {
      setError("จบงานไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      return false;
    }
    playSuccessChime();
    setDone(true);
    return true;
  }

  function toggleMute() {
    setSoundMuted(!muted);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="actor" className="flex items-center gap-2 text-sm font-medium text-neutral-800">
          <UserRound className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
          1. ชื่อผู้ดำเนินการ
        </label>
        <input
          id="actor"
          value={rawName}
          onChange={(e) => saveStaffName(e.target.value)}
          placeholder="เช่น ช่างสมชาย"
          maxLength={60}
          className="w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
        <p className="text-xs text-neutral-400">ระบบจำชื่อไว้ในเบราว์เซอร์นี้ ไม่ต้องพิมพ์ใหม่ทุกครั้ง</p>
      </div>

      <div className="flex flex-col gap-2.5">
        <p className="flex items-center gap-2 text-sm font-medium text-neutral-800">
          <Camera className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
          2. รูปหลังซ่อม <span className="font-normal text-red-500">(บังคับอย่างน้อย 1 รูป)</span>
        </p>

        {afterImages.length > 0 && <ImageGallery images={afterImages} alt="รูปหลังซ่อม" />}

        {uploading ? (
          <p className="flex items-center gap-2 rounded-xl bg-neutral-50 px-3.5 py-3 text-sm text-neutral-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            กำลังอัปโหลดรูป...
          </p>
        ) : (
          <ImagePicker key={pickerKey} onChange={uploadPicked} />
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
        <p className="text-sm font-medium text-neutral-800">3. ตรวจสอบก่อนจบงาน</p>
        <ul className="flex flex-col gap-1.5 text-sm">
          <Check ok={hasPhoto}>{hasPhoto ? `มีรูปหลังซ่อม ${afterImages.length} รูป` : "ยังไม่มีรูปหลังซ่อม"}</Check>
          <Check ok={hasActor}>{hasActor ? `ผู้ดำเนินการ: ${actor}` : "ยังไม่ได้ใส่ชื่อผู้ดำเนินการ"}</Check>
        </ul>
        <p className="text-xs leading-relaxed text-neutral-500">
          เมื่อเลื่อนเพื่อจบงาน สถานะจะเปลี่ยนเป็น &quot;เสร็จสิ้น&quot; พร้อมบันทึกเวลา และไม่สามารถแก้ไขได้อีก
        </p>
      </div>

      <div className="flex flex-col gap-2.5">
        <SlideToComplete onCommit={handleCommit} disabled={!canSlide || done} />
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-neutral-400">
            {canSlide ? "ลากปุ่มไปทางขวาจนสุด (หรือใช้ปุ่มลูกศรบนคีย์บอร์ด)" : "ทำขั้นตอนด้านบนให้ครบก่อนจึงจะเลื่อนได้"}
          </p>
          <button
            type="button"
            onClick={toggleMute}
            aria-pressed={muted}
            className="flex shrink-0 items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800"
          >
            {muted ? <VolumeX className="h-4 w-4" strokeWidth={1.75} /> : <Volume2 className="h-4 w-4" strokeWidth={1.75} />}
            {muted ? "เสียงปิด" : "เสียงเปิด"}
          </button>
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          role="alert"
          className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
          {error}
        </motion.p>
      )}

      <AnimatePresence>{done && <SuccessOverlay onClose={() => router.refresh()} />}</AnimatePresence>
    </div>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-center gap-2 ${ok ? "text-emerald-700" : "text-neutral-500"}`}>
      {ok ? <CheckCircle2 className="h-4 w-4" strokeWidth={1.75} /> : <Circle className="h-4 w-4" strokeWidth={1.75} />}
      {children}
    </li>
  );
}

function SuccessOverlay({ onClose }: { onClose: () => void }) {
  const reduce = useReducedMotion();
  const d = (s: number) => (reduce ? 0 : s);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label="จบงานสำเร็จ"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: d(0.25) }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/95 px-6 backdrop-blur-sm"
    >
      <div className="relative flex h-40 w-40 items-center justify-center">
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 rounded-full bg-emerald-400/30"
          initial={{ scale: 0.6, opacity: 0.8 }}
          animate={{ scale: 1.6, opacity: 0 }}
          transition={{ duration: d(1.1), ease: "easeOut" }}
        />
        <motion.div
          className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500 shadow-xl shadow-emerald-500/30"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 16, duration: d(0.5) }}
        >
          <svg viewBox="0 0 52 52" className="h-16 w-16" fill="none" aria-hidden="true">
            <motion.path
              d="M14 27 L23 36 L39 17"
              stroke="white"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: d(0.25), duration: d(0.4), ease: "easeOut" }}
            />
          </svg>
        </motion.div>
      </div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: d(0.5), duration: d(0.35) }}
      >
        <p className="text-2xl font-bold text-neutral-900">ดำเนินการเสร็จสิ้น</p>
        <p className="mt-1 text-sm text-neutral-500">บันทึกการจบงานเรียบร้อยแล้ว</p>
      </motion.div>

      <motion.div
        className="flex w-full max-w-xs flex-col gap-2.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: d(0.8), duration: d(0.3) }}
      >
        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="rounded-2xl bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
        >
          ดูรายละเอียดงาน
        </button>
        <Link
          href="/c"
          className="rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-center text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          กลับหน้ารายการงาน
        </Link>
      </motion.div>
    </motion.div>
  );
}
