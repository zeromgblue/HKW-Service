"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { ChevronsRight, Loader2 } from "lucide-react";

const THUMB = 56;
const PAD = 4;
const THRESHOLD = 0.85;
const KEY_STEP = 0.25;

type Phase = "idle" | "dragging" | "committing";

// Drag the thumb left→right past the threshold to commit. Built on Pointer Events so mouse,
// touch and pen behave the same; the thumb is also a keyboard-operable slider.
// `onCommit` must resolve true only after the server confirmed; false snaps the thumb back.
export function SlideToComplete({
  onCommit,
  disabled = false,
  label = "เลื่อนเพื่อจบงาน",
}: {
  onCommit: () => Promise<boolean>;
  disabled?: boolean;
  label?: string;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startProgress: number } | null>(null);
  const [progress, setProgress] = useState(0); // 0..1
  const [phase, setPhase] = useState<Phase>("idle");

  function maxTravel() {
    const width = trackRef.current?.clientWidth ?? 0;
    return Math.max(1, width - THUMB - PAD * 2);
  }

  async function commit() {
    setPhase("committing");
    setProgress(1);
    let ok = false;
    try {
      ok = await onCommit();
    } catch {
      ok = false;
    }
    if (!ok) {
      setProgress(0);
      setPhase("idle");
    }
    // On success the parent takes over (overlay), so the thumb stays locked at the end.
  }

  function release(currentProgress: number) {
    dragRef.current = null;
    if (currentProgress >= THRESHOLD) {
      void commit();
    } else {
      setProgress(0);
      setPhase("idle");
    }
  }

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (disabled || phase === "committing") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startProgress: progress };
    setPhase("dragging");
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag) return;
    const delta = (e.clientX - drag.startX) / maxTravel();
    setProgress(Math.min(1, Math.max(0, drag.startProgress + delta)));
  }

  function onPointerUp(e: PointerEvent<HTMLDivElement>) {
    if (!dragRef.current) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
    release(progress);
  }

  function onPointerCancel() {
    if (!dragRef.current) return;
    dragRef.current = null;
    setProgress(0);
    setPhase("idle");
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (disabled || phase === "committing") return;
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.min(1, progress + KEY_STEP);
      setProgress(next);
      if (next >= THRESHOLD) void commit();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      setProgress(Math.max(0, progress - KEY_STEP));
    } else if (e.key === "End") {
      e.preventDefault();
      void commit();
    } else if (e.key === "Home" || e.key === "Escape") {
      setProgress(0);
    }
  }

  const dragging = phase === "dragging";
  const committing = phase === "committing";
  // Positioned with `transform` (not `left`/`width`) so every drag frame is compositor-only —
  // no layout/paint thrash — which is what keeps this smooth on mid-range Android/iOS.
  const travel = maxTravel();
  const trackWidth = trackRef.current?.clientWidth || 1;
  const thumbOffset = PAD + progress * travel;
  const fillScale = (thumbOffset + THUMB + PAD) / trackWidth;

  return (
    <div
      ref={trackRef}
      className={`relative h-16 w-full select-none overflow-hidden rounded-full border transition-colors ${
        disabled ? "border-neutral-200 bg-neutral-100" : "border-blue-200 bg-blue-50"
      }`}
    >
      <div
        aria-hidden="true"
        className={`absolute inset-y-0 left-0 w-full origin-left rounded-full ${committing ? "bg-emerald-500" : "bg-blue-500/20"} ${
          dragging ? "" : "transition-transform duration-300 ease-out"
        }`}
        style={{ transform: `scaleX(${fillScale})`, willChange: "transform" }}
      />
      <span
        className={`pointer-events-none absolute inset-0 flex items-center justify-center pl-12 text-sm font-semibold ${
          disabled ? "text-neutral-400" : "text-blue-700"
        }`}
        style={{ opacity: committing ? 0 : 1 - progress * 1.2 }}
      >
        {label}
      </span>

      <div
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        aria-disabled={disabled || committing}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onKeyDown={onKeyDown}
        style={{
          transform: `translateX(${thumbOffset}px)`,
          touchAction: "none",
          width: THUMB,
          height: THUMB,
          top: PAD,
          willChange: "transform",
        }}
        className={`absolute left-0 flex items-center justify-center rounded-full text-white shadow-md outline-none focus-visible:ring-4 focus-visible:ring-blue-200 ${
          dragging ? "" : "transition-transform duration-300 ease-out"
        } ${disabled ? "cursor-not-allowed bg-neutral-300" : committing ? "bg-emerald-600" : "cursor-grab bg-blue-600 active:cursor-grabbing"}`}
      >
        {committing ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : (
          <ChevronsRight className="h-6 w-6" strokeWidth={2} />
        )}
      </div>
    </div>
  );
}

