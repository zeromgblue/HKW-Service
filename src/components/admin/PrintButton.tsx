"use client";

import { Printer } from "lucide-react";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
    >
      <Printer className="h-4 w-4" strokeWidth={1.75} />
      พิมพ์ / บันทึกเป็น PDF
    </button>
  );
}
