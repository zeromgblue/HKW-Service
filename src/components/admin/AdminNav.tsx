"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, FileText, LayoutDashboard } from "lucide-react";

const links = [
  { href: "/admin", label: "ภาพรวม", icon: LayoutDashboard },
  { href: "/admin/tickets", label: "งานทั้งหมด", icon: ClipboardList },
  { href: "/admin/documents", label: "เอกสาร", icon: FileText },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="เมนูผู้ดูแลระบบ" className="flex gap-1.5 overflow-x-auto">
      {links.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
              active ? "bg-blue-600 text-white shadow-sm" : "text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
