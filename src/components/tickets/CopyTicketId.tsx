"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Copy } from "lucide-react";

export function CopyTicketId({ ticketId }: { ticketId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — ignore silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50"
    >
      <AnimatePresence mode="wait" initial={false}>
        {copied ? (
          <motion.span
            key="check"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="flex items-center gap-2 text-green-600"
          >
            <Check className="h-4 w-4" strokeWidth={2} />
            คัดลอกแล้ว
          </motion.span>
        ) : (
          <motion.span
            key="copy"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            className="flex items-center gap-2"
          >
            <Copy className="h-4 w-4" strokeWidth={1.75} />
            คัดลอก Ticket ID
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
