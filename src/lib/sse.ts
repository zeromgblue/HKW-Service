import "server-only";

// Clients treat a stream that has been silent for ~40s as dead and reconnect, so this must
// stay comfortably below that.
const HEARTBEAT_MS = 15000;

export interface SseChannel {
  // Every payload gets the server time `t`, which the client echoes back as `?since=` when it
  // reconnects so nothing that happened during the gap is lost.
  send: (event: string, data?: Record<string, unknown>) => void;
  close: () => void;
}

// Builds a Server-Sent Events response. `subscribe` wires up the data source and returns its
// teardown, which runs exactly once when the client goes away or the stream is closed.
export function sseResponse(request: Request, subscribe: (channel: SseChannel) => () => void): Response {
  const encoder = new TextEncoder();
  let closed = false;
  let teardown: (() => void) | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stop = () => {
    if (closed) return;
    closed = true;
    if (heartbeat) clearInterval(heartbeat);
    teardown?.();
  };

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const close = () => {
        if (closed) return;
        stop();
        try {
          controller.close();
        } catch {
          // Already closed by the runtime.
        }
      };
      const write = (chunk: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          stop(); // the client is gone
        }
      };
      const send: SseChannel["send"] = (event, data = {}) =>
        write(`event: ${event}\ndata: ${JSON.stringify({ ...data, t: Date.now() })}\n\n`);

      if (request.signal.aborted) return close();
      request.signal.addEventListener("abort", close);

      // A real event (not an SSE comment) so the browser can see the heartbeat.
      send("ping");
      heartbeat = setInterval(() => send("ping"), HEARTBEAT_MS);

      try {
        teardown = subscribe({ send, close });
      } catch (err) {
        console.error("sse subscribe failed", err);
        close();
      }
      if (closed) teardown?.();
    },
    cancel() {
      stop();
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
