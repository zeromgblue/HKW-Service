import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { sseResponse } from "@/lib/sse";
import { STAFF_FEED_DOC } from "@/lib/tickets/staffFeed";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// How far back a reconnecting client may ask to be caught up.
const MAX_REPLAY_MS = 10 * 60 * 1000;
// Small margin so a few seconds of clock skew between this server and Google can't hide events.
const SKEW_MS = 5000;

// Server-Sent Events: pushes a message to the staff pages whenever a ticket is created, changed
// or deleted, so they update without polling. Only the changed documents are read.
export async function GET(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return new Response("Database not configured", { status: 503 });
  }

  // A reconnecting client sends the server time of the last message it saw; replaying from
  // there means jobs that arrived while it was offline still raise their alert.
  const now = Date.now();
  const requested = Number(new URL(request.url).searchParams.get("since"));
  const from = requested > 0 && requested <= now ? Math.max(requested, now - MAX_REPLAY_MS) : now;
  const sinceMs = from - SKEW_MS;

  return sseResponse(request, ({ send, close }) => {
    const db = getAdminFirestore();
    const onError = (err: Error) => {
      console.error("staff stream listener error", err);
      close(); // the client reconnects and gets a fresh listener
    };

    const stopTickets = db
      .collection("tickets")
      .where("updatedAt", ">", Timestamp.fromMillis(sinceMs))
      .onSnapshot((snap) => {
        for (const change of snap.docChanges()) {
          if (change.type === "removed") {
            send("ticket", { kind: "deleted", ticketId: change.doc.id });
            continue;
          }
          const d = change.doc.data();
          const createdMs = d.createdAt?.toMillis?.() ?? 0;
          send("ticket", {
            kind: change.type === "added" && createdMs >= sinceMs ? "created" : "updated",
            ticketId: change.doc.id,
            rev: d.updatedAt?.toMillis?.() ?? 0,
            title: d.title,
            locationText: d.locationText,
            priority: d.priority,
            status: d.status,
          });
        }
      }, onError);

    // A deleted ticket that hadn't changed recently is outside the query above, so deletions
    // are also announced through one small marker document.
    const stopFeed = db.doc(STAFF_FEED_DOC).onSnapshot((snap) => {
      const d = snap.data();
      if (!d?.deletedTicketId || (d.at?.toMillis?.() ?? 0) <= sinceMs) return;
      send("ticket", { kind: "deleted", ticketId: d.deletedTicketId });
    }, onError);

    return () => {
      stopTickets();
      stopFeed();
    };
  });
}
