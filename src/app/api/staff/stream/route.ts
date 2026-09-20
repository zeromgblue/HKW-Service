import { Timestamp } from "firebase-admin/firestore";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// Server-Sent Events: pushes a message to the staff page whenever a ticket is created or
// changed, so the list updates without polling. Only the changed documents are read.
export async function GET(request: Request) {
  if (!isFirebaseAdminConfigured()) {
    return new Response("Database not configured", { status: 503 });
  }

  const encoder = new TextEncoder();
  // Small margin so a few seconds of clock skew between this server and Google can't hide events.
  const since = Timestamp.fromMillis(Date.now() - 5000);
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

      unsubscribe = getAdminFirestore()
        .collection("tickets")
        .where("updatedAt", ">", since)
        .onSnapshot(
          (snap) => {
            for (const change of snap.docChanges()) {
              if (change.type === "removed") continue;
              const d = change.doc.data();
              const createdMs = d.createdAt?.toMillis?.() ?? 0;
              const kind = change.type === "added" && createdMs >= since.toMillis() ? "created" : "updated";
              write(
                `event: ticket\ndata: ${JSON.stringify({
                  kind,
                  ticketId: change.doc.id,
                  title: d.title,
                  locationText: d.locationText,
                  priority: d.priority,
                  status: d.status,
                })}\n\n`,
              );
            }
          },
          (err) => {
            console.error("staff stream listener error", err);
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
