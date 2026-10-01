"use client";

import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";

const SHEET_WIDTH_PX = (210 * 96) / 25.4; // A4 width in CSS pixels

// Shows the A4 sheet like a PDF viewer: on a screen narrower than the paper the whole page is
// shrunk to fit, with a button to switch to real size (scrolling sideways) for reading.
export function ReportViewport({ children }: { children: React.ReactNode }) {
  const frame = useRef<HTMLDivElement>(null);
  const [fitScale, setFitScale] = useState(1);
  const [actualSize, setActualSize] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    // Fires once on observe, then on every resize or rotation.
    const observer = new ResizeObserver(() => setFitScale(Math.min(1, el.clientWidth / SHEET_WIDTH_PX)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const shrunk = fitScale < 1;

  return (
    <div ref={frame} className="flex w-full flex-col gap-2">
      {shrunk && (
        <button
          type="button"
          onClick={() => setActualSize((v) => !v)}
          className="flex items-center gap-1.5 self-end rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition active:scale-95 print:hidden"
        >
          {actualSize ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          {actualSize ? "ย่อให้พอดีจอ" : "ขยายเท่าขนาดจริง"}
        </button>
      )}
      <div className="w-full overflow-x-auto pb-4 print:overflow-visible print:pb-0">
        {/* The print styles undo this zoom through the `report-fit` class. */}
        <div className="report-fit mx-auto w-fit" style={{ zoom: actualSize ? 1 : fitScale }}>
          {children}
        </div>
      </div>
    </div>
  );
}
