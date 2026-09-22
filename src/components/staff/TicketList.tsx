"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { TicketCard } from "@/components/staff/TicketCard";
import type { Ticket } from "@/types/ticket";

interface Row {
  ticket: Ticket;
  stale: boolean;
}

// Animates inserts, removals and reordering when live updates change the list, instead of the
// DOM just snapping to the new order.
export function TicketList({ rows }: { rows: Row[] }) {
  const reduce = useReducedMotion();

  return (
    <ul className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {rows.map(({ ticket, stale }) => (
          <motion.li
            key={ticket.ticketId}
            layout={reduce ? false : "position"}
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
          >
            <TicketCard ticket={ticket} stale={stale} />
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
