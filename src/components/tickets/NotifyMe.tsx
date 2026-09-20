"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { BellRing, Loader2, Share } from "lucide-react";
import { subscribeTicketPush } from "@/lib/actions/teacherPush";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Support = "unsupported" | "ios-install" | "ok";

function getSupport(): Support {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    return isIos && !standalone ? "ios-install" : "unsupported";
  }
  return "ok";
}

const flagKey = (ticketId: string) => `hkw_notify_${ticketId}`;
const FLAG_EVENT = "hkw-notify-change";

function subscribeFlag(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(FLAG_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(FLAG_EVENT, cb);
  };
}

function urlBase64ToUint8Array(base64: string) {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

// "Tell me when it's repaired": subscribes this device to a one-time push for this ticket.
export function NotifyMe({ ticketId }: { ticketId: string }) {
  const support = useSyncExternalStore<Support | "loading">(() => () => undefined, getSupport, () => "loading");
  const enabled = useSyncExternalStore(
    subscribeFlag,
    () => {
      try {
        return localStorage.getItem(flagKey(ticketId)) === "1";
      } catch {
        return false;
      }
    },
    () => false,
  );
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (support === "ok") navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, [support]);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setMessage("ไม่ได้รับอนุญาตให้แจ้งเตือน กรุณาเปิดสิทธิ์การแจ้งเตือนในการตั้งค่าเบราว์เซอร์");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const result = await subscribeTicketPush(ticketId, sub.toJSON());
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      try {
        localStorage.setItem(flagKey(ticketId), "1");
      } catch {
        // Not persisted; the server-side subscription still works.
      }
      window.dispatchEvent(new Event(FLAG_EVENT));
    } catch {
      setMessage("เปิดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  if (support === "loading" || support === "unsupported") return null;

  if (support === "ios-install") {
    return (
      <p className="flex items-start gap-2 rounded-2xl bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
        <Share className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
        บน iPhone ให้กดปุ่มแชร์ใน Safari แล้วเลือก &quot;เพิ่มลงในหน้าจอโฮม&quot; จึงจะรับแจ้งเตือนเมื่อซ่อมเสร็จได้
      </p>
    );
  }

  if (enabled) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        <BellRing className="h-4 w-4 shrink-0" strokeWidth={1.75} />
        จะแจ้งเตือนเครื่องนี้เมื่อซ่อมเสร็จ
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={enable}
        disabled={busy}
        className="flex items-center justify-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <BellRing className="h-4 w-4" strokeWidth={1.75} />}
        แจ้งเตือนฉันเมื่อซ่อมเสร็จ
      </button>
      {message && <p className="text-xs text-red-600">{message}</p>}
    </div>
  );
}
