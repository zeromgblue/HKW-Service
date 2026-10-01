import "server-only";
import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { mapTicket } from "@/lib/tickets/mapTicket";
import { monthRange } from "@/lib/reports/month";
import type { Ticket } from "@/types/ticket";

// Every ticket reported in the given month ("YYYY-MM", Bangkok time), oldest first.
export async function listMonthTickets(monthKey: string): Promise<Ticket[]> {
  if (!isFirebaseAdminConfigured()) return [];

  const { start, end } = monthRange(monthKey);
  const snap = await getAdminFirestore()
    .collection("tickets")
    .where("createdAt", ">=", Timestamp.fromDate(start))
    .where("createdAt", "<", Timestamp.fromDate(end))
    .orderBy("createdAt", "asc")
    .get();

  return snap.docs.map((doc) => mapTicket(doc.id, doc.data()));
}
