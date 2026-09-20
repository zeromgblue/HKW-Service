import { statusLabels } from "@/lib/tickets/statusLabels";
import type { TicketPriority, TicketStatus } from "@/types/ticket";

const statusStyles: Record<TicketStatus, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function StatusBadge({ status }: { status: TicketStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

const priorityConfig: Record<TicketPriority, { label: string; className: string } | null> = {
  normal: null,
  urgent: { label: "ด่วน", className: "bg-amber-100 text-amber-800" },
  critical: { label: "ด่วนมาก", className: "bg-red-100 text-red-700" },
};

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const cfg = priorityConfig[priority];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.className}`}>
      {cfg.label}
    </span>
  );
}
