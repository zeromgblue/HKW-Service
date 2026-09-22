"use client";

import { motion, useReducedMotion } from "framer-motion";

// Wraps a server-rendered page's content so it eases in on mount instead of just popping in —
// used on the staff-facing pages, which are plain navigations with no route transition of
// their own.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.8 }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
