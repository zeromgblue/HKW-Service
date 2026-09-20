import Link from "next/link";
import { Clock, MapPin } from "lucide-react";
import { defaultCategories } from "@/data/categories";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { PriorityBadge, StatusBadge } from "@/components/tickets/Badges";
import { formatThaiDateTime } from "@/lib/formatDate";
import type { Ticket } from "@/types/ticket";

export function TicketCard({ ticket, stale }: { ticket: Ticket; stale: boolean }) {
  const category = defaultCategories.find((c) => c.categoryId === ticket.categoryId);

  return (
    <Link
      href={`/staff/tickets/${ticket.ticketId}`}
      className="group flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-neutral-600">
            {category && <CategoryIcon name={category.icon} className="h-5 w-5" />}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-neutral-900">{ticket.title}</p>
            <p className="text-xs text-neutral-400">
              {ticket.ticketId} · {ticket.categoryNameSnapshot}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.75} />
          <span className="line-clamp-1">{ticket.locationText}</span>
        </span>
        <span className={`flex items-center gap-1.5 ${stale ? "font-medium text-red-600" : ""}`}>
          <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
          {formatThaiDateTime(ticket.createdAt)}
          {stale && " · ค้างนาน"}
        </span>
      </div>
    </Link>
  );
}
