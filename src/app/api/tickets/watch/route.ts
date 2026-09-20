import { FieldPath } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
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

  const encoder = new TextEncoder();
  let unsubscribe: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const write = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      const cleanup = () => {
        if (closed) return;
        closed = true;
        unsubscribe?.();
        if (heartbeat) clearInterval(heartbeat);
        try {
          controller.close();
        } catch {
          // Already closed by the runtime.
        }
      };

      write("retry: 3000\n: connected\n\n");
      heartbeat = setInterval(() => write(": ping\n\n"), 20000);
      request.signal.addEventListener("abort", cleanup);

      let initial = true; // the first snapshot is the current state the page already has
      unsubscribe = getAdminFirestore()
        .collection("tickets")
        .where(FieldPath.documentId(), "in", ids)
        .onSnapshot(
          (snap) => {
            if (initial) {
              initial = false;
              return;
            }
            for (const change of snap.docChanges()) {
              if (change.type !== "modified") continue;
              write(
                `event: ticket\ndata: ${JSON.stringify({
                  ticketId: change.doc.id,
                  status: change.doc.data().status,
                })}\n\n`,
              );
            }
          },
          (err) => {
            console.error("ticket watch listener error", err);
            cleanup();
          },
        );
    },
    cancel() {
      unsubscribe?.();
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
