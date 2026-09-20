import "server-only";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { mapTicket } from "@/lib/tickets/mapTicket";
import type { Ticket } from "@/types/ticket";

export async function getTicket(ticketId: string): Promise<Ticket | null> {
  if (!isFirebaseAdminConfigured() || !ticketId) return null;

  const db = getAdminFirestore();
  const snap = await db.collection("tickets").doc(ticketId).get();
  if (!snap.exists) return null;

  return mapTicket(snap.id, snap.data()!);
}
