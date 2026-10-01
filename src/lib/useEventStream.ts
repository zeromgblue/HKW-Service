"use client";

import { useEffect, useRef, useState } from "react";

// The server pings every 15s; a stream silent for this long is dead even if the browser still
// reports it as open (common on phones after sleep or a network switch).
const STALE_AFTER_MS = 40000;
const WATCHDOG_MS = 10000;
const MAX_BACKOFF_MS = 15000;
// A connection that lived this long was healthy, so the next retry starts fast again.
const HEALTHY_AFTER_MS = 10000;

// Subscribes to a server-sent event stream and keeps it alive: reconnects with backoff after
// any failure, when the device comes back online and when a sleeping tab wakes up. `onResync`
// fires whenever events may have been missed, so the page can reload its data.
// Returns whether the stream is currently connected.
export function useEventStream<T>(
  url: string | null,
  eventName: string,
  onEvent: (data: T) => void,
  onResync: () => void,
): boolean {
  const [connected, setConnected] = useState(false);
  const handlers = useRef({ onEvent, onResync });
  useEffect(() => {
    handlers.current = { onEvent, onResync };
  });

  useEffect(() => {
    if (!url) return;

    const startedAt = Date.now();
    let source: EventSource | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let attempts = 0;
    let openedAt = 0;
    let lastBeat = 0;
    let serverTime = 0; // server clock of the last message, echoed back to replay the gap
    let everOpened = false;
    let stopped = false;

    const read = (e: Event) => {
      lastBeat = Date.now();
      try {
        const data = JSON.parse((e as MessageEvent<string>).data);
        if (typeof data?.t === "number") serverTime = data.t;
        return data;
      } catch {
        return null;
      }
    };

    const connect = () => {
      if (stopped) return;
      clearTimeout(retryTimer);
      source?.close();

      const es = new EventSource(serverTime ? `${url}${url.includes("?") ? "&" : "?"}since=${serverTime}` : url);
      source = es;
      lastBeat = Date.now();

      es.onopen = () => {
        openedAt = Date.now();
        setConnected(true);
        // Anything that changed while we were away (or while a slow first load was still
        // connecting) is not guaranteed to be replayed, so reload the data.
        if (everOpened || openedAt - startedAt > 3000) handlers.current.onResync();
        everOpened = true;
      };
      es.addEventListener("ping", read);
      es.addEventListener(eventName, (e) => {
        const data = read(e);
        if (data) handlers.current.onEvent(data as T);
      });
      es.onerror = () => {
        if (source !== es) return;
        // Take over from the browser's own retry: it gives up for good on some failures.
        es.close();
        setConnected(false);
        if (openedAt && Date.now() - openedAt > HEALTHY_AFTER_MS) attempts = 0;
        openedAt = 0;
        const delay = Math.min(MAX_BACKOFF_MS, 500 * 2 ** attempts) * (0.75 + Math.random() * 0.5);
        attempts++;
        retryTimer = setTimeout(connect, delay);
      };
    };

    const reconnectNow = () => {
      attempts = 0;
      setConnected(false);
      connect();
    };

    const isDead = () => !source || source.readyState === EventSource.CLOSED || Date.now() - lastBeat > STALE_AFTER_MS;

    const watchdog = setInterval(() => {
      // A closed source already has a retry scheduled; only rescue streams that went silent.
      if (source && source.readyState !== EventSource.CLOSED && Date.now() - lastBeat > STALE_AFTER_MS) {
        reconnectNow();
      }
    }, WATCHDOG_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible" && isDead()) reconnectNow();
    };
    const onOffline = () => setConnected(false);

    connect();
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", reconnectNow);
    window.addEventListener("offline", onOffline);

    return () => {
      stopped = true;
      clearInterval(watchdog);
      clearTimeout(retryTimer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", reconnectNow);
      window.removeEventListener("offline", onOffline);
      source?.close();
    };
  }, [url, eventName]);

  return connected;
}
