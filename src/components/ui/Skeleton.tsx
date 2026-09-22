"use client";

import { motion } from "framer-motion";

// A shimmer block (moving highlight sweep, not a flat pulse) that fades/slides in with a
// per-index stagger, so a screen full of them reads as one cascading, "alive" loading state
// instead of a static mock dropped on screen.
export function Skeleton({ className = "", index = 0 }: { className?: string; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
      className={`skeleton rounded-lg ${className}`}
    />
  );
}
