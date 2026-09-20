import "server-only";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { mapTicket } from "@/lib/tickets/mapTicket";
import type { Ticket } from "@/types/ticket";

// MVP scale (one school): fetch the newest tickets and filter in memory, which avoids
// composite Firestore indexes. Revisit with server-side queries if volume grows.
const MAX_TICKETS = 500;

export async function listTickets(): Promise<Ticket[]> {
  if (!isFirebaseAdminConfigured()) return [];

  const snap = await getAdminFirestore()
    .collection("tickets")
    .orderBy("createdAt", "desc")
    .limit(MAX_TICKETS)
    .get();

  return snap.docs.map((doc) => mapTicket(doc.id, doc.data()));
}
