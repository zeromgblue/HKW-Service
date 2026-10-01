import { FieldPath } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { sseResponse } from "@/lib/sse";
import { isValidTicketId } from "@/lib/tickets/publicTicket";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Server-Sent Events for reporters: tells a teacher's page when one of *their* tickets
// changes (e.g. the repair is finished). Only status is sent; the page then re-fetches.
export async function GET(request: Request) {
  if (!isFirebaseAdminConfigured()) return new Response("Database not configured", { status: 503 });

  const raw = new URL(request.url).searchParams.get("ids") ?? "";
  const ids = [...new Set(raw.split(",").filter(isValidTicketId))].slice(0, 30);
  if (ids.length === 0) return new Response("No valid ticket ids", { status: 400 });

  return sseResponse(request, ({ send, close }) => {
    let initial = true; // the first snapshot is the current state the page already has
    return getAdminFirestore()
      .collection("tickets")
      .where(FieldPath.documentId(), "in", ids)
      .onSnapshot(
        (snap) => {
          if (initial) {
            initial = false;
            return;
          }
          for (const change of snap.docChanges()) {
            if (change.type === "added") continue;
            send("ticket", {
              ticketId: change.doc.id,
              status: change.type === "removed" ? "deleted" : change.doc.data().status,
            });
          }
        },
        (err) => {
          console.error("ticket watch listener error", err);
          close(); // the client reconnects and gets a fresh listener
        },
      );
  });
}
