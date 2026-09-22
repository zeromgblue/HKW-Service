"use client";

import { motion, useReducedMotion } from "framer-motion";

// Wraps a server-rendered page's content so it eases in on mount instead of just popping in —
// used on the staff-facing pages, which are plain navigations with no route transition of
// their own.
export function PageTransition({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 340, damping: 26, mass: 0.9 }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}
