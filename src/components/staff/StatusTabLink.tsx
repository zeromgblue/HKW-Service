"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

const MotionLink = motion.create(Link);

export function StatusTabLink({
  href,
  active,
  icon: Icon,
  tone,
  count,
  label,
}: {
  href: string;
  active: boolean;
  icon: LucideIcon;
  tone: string;
  count: number;
  label: string;
}) {
  return (
    <MotionLink
      href={href}
      aria-current={active ? "page" : undefined}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`flex flex-col gap-2 rounded-2xl border p-4 shadow-sm transition-colors ${
        active ? "border-blue-500 ring-2 ring-blue-100" : "border-neutral-200 hover:border-neutral-300"
      } bg-white`}
    >
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </span>
      <span className="text-2xl font-bold text-neutral-900">{count}</span>
      <span className="text-xs text-neutral-500">{label}</span>
    </MotionLink>
  );
}
