import type { Ticket, TicketPriority } from "@/types/ticket";

export type StatusTab = "all" | "pending" | "done";

export interface TicketFilters {
  tab: StatusTab;
  q: string;
  category: string;
  priority: TicketPriority | "";
}

// A pending ticket untouched for this long is flagged as overdue on the staff page.
export const STALE_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

export function isStale(ticket: Ticket, now = Date.now()): boolean {
  return ticket.status === "pending" && now - new Date(ticket.createdAt).getTime() > STALE_AFTER_MS;
}

export function getStaleIds(tickets: Ticket[]): Set<string> {
  const now = Date.now();
  return new Set(tickets.filter((t) => isStale(t, now)).map((t) => t.ticketId));
}

export function countByTab(tickets: Ticket[]): Record<StatusTab, number> {
  return {
    all: tickets.length,
    pending: tickets.filter((t) => t.status === "pending").length,
    done: tickets.filter((t) => t.status === "completed").length,
  };
}

export function filterTickets(tickets: Ticket[], f: TicketFilters): Ticket[] {
  const q = f.q.trim().toLowerCase();
  return tickets.filter((t) => {
    if (f.tab === "pending" && t.status !== "pending") return false;
    if (f.tab === "done" && t.status !== "completed") return false;
    if (f.category && t.categoryId !== f.category) return false;
    if (f.priority && t.priority !== f.priority) return false;
    if (q) {
      const haystack = `${t.ticketId} ${t.title} ${t.locationText}`.toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });
}

export function parseFilters(params: Record<string, string | string[] | undefined>): TicketFilters {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const tab = one(params.tab);
  const priority = one(params.priority);
  return {
    tab: (["pending", "done"] as const).find((x) => x === tab) ?? "all",
    q: one(params.q).slice(0, 100),
    category: one(params.category).slice(0, 40),
    priority: (["normal", "urgent", "critical"] as const).find((x) => x === priority) ?? "",
  };
}
