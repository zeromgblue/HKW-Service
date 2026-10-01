"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { ClipboardList, FileText, LayoutDashboard } from "lucide-react";

const links = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/tickets", label: "งานทั้งหมด", icon: ClipboardList },
  { href: "/admin/documents", label: "เอกสาร", icon: FileText },
];

const matches = (href: string, pathname: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

export function AdminNav() {
  const pathname = usePathname();
  // The tapped tab lights up at once, before the new page has arrived. The tap is remembered
  // together with the page it was made on, so it stops applying as soon as the route changes.
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);
  const pendingHref = tapped && tapped.from === pathname ? tapped.href : null;

  return (
    <nav aria-label="เมนูผู้ดูแลระบบ" className="grid grid-cols-3 gap-1.5 sm:flex">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pendingHref ? pendingHref === href : matches(href, pathname);
        return (
          <Link
            key={href}
            href={href}
            onClick={() => setTapped({ href, from: pathname })}
            aria-current={matches(href, pathname) ? "page" : undefined}
            className={`relative flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-2 py-2 text-[13px] font-medium sm:px-3.5 sm:text-sm transition-[color,transform] active:scale-95 ${
              active ? "text-white" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            {active && (
              <motion.span
                layoutId="admin-nav-pill"
                className="absolute inset-0 rounded-xl bg-blue-600 shadow-sm"
                transition={{ type: "spring", stiffness: 520, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
