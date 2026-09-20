import type { Ticket, TicketPriority, TicketStatus } from "@/types/ticket";

// Ticket IDs are random (see generateTicketId); the format is checked before any lookup.
export const TICKET_ID_RE = /^RP-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/;

export const isValidTicketId = (id: unknown): id is string => typeof id === "string" && TICKET_ID_RE.test(id);

// What a reporter (teacher) may see: never the reporter's own name/contact or internal fields.
export interface PublicTicket {
  ticketId: string;
  title: string;
  categoryId: string;
  categoryNameSnapshot: string;
  locationText: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  completedAt: string | null;
  completedBy: string | null;
}

export function toPublicTicket(t: Ticket): PublicTicket {
  return {
    ticketId: t.ticketId,
    title: t.title,
    categoryId: t.categoryId,
    categoryNameSnapshot: t.categoryNameSnapshot,
    locationText: t.locationText,
    description: t.description,
    priority: t.priority,
    status: t.status,
    createdAt: t.createdAt,
    completedAt: t.completedAt,
    completedBy: t.completedBy,
  };
}
