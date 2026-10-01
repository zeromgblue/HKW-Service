"use client";

import { useEffect, useRef } from "react";
import { Printer } from "lucide-react";

// `autoStart` opens the print dialog once on arrival (used by the buttons on the documents list).
export function PrintButton({ autoStart = false }: { autoStart?: boolean }) {
  const started = useRef(false);

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    // Drop the trigger from the address so a refresh does not print again.
    window.history.replaceState(null, "", window.location.pathname);
    setTimeout(() => window.print(), 500); // let fonts and the logo settle first
  }, [autoStart]);

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-neutral-200 bg-white px-3 sm:px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 active:scale-95"
    >
      <Printer className="h-4 w-4" strokeWidth={1.75} />
      พิมพ์เอกสาร
    </button>
  );
}
