"use server";

import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { mapTicket } from "@/lib/tickets/mapTicket";
import { isValidTicketId, toPublicTicket, type PublicTicket } from "@/lib/tickets/publicTicket";

const MAX_IDS = 30;

// Looks up the tickets a teacher has on this device (or typed in by hand).
export async function getMyTickets(ids: unknown): Promise<PublicTicket[]> {
  if (!Array.isArray(ids) || !isFirebaseAdminConfigured()) return [];

  const valid = [...new Set(ids.filter(isValidTicketId))].slice(0, MAX_IDS);
  if (valid.length === 0) return [];

  const db = getAdminFirestore();
  const snaps = await db.getAll(...valid.map((id) => db.collection("tickets").doc(id)));
  return snaps.filter((s) => s.exists).map((s) => toPublicTicket(mapTicket(s.id, s.data()!)));
}
