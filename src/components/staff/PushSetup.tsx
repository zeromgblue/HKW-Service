"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Bell, BellOff, BellRing, Loader2, Share } from "lucide-react";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/lib/actions/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Support = "loading" | "unsupported" | "ios-install" | "ok";

function getSupport(): Support {
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    // iOS only exposes Web Push once the site is added to the Home Screen.
    return isIos && !standalone ? "ios-install" : "unsupported";
  }
  return "ok";
}

const subscribeNoop = () => () => undefined;

function urlBase64ToUint8Array(base64: string) {
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

export function PushSetup() {
  const support = useSyncExternalStore<Support>(subscribeNoop, getSupport, () => "loading");
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (support !== "ok") return;
    let cancelled = false;
    (async () => {
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (cancelled) return;
      setSubscribed(Boolean(sub));
      setPermission(Notification.permission);
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [support]);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== "granted") {
        setMessage("ไม่ได้รับอนุญาตให้แจ้งเตือน กรุณาเปิดสิทธิ์การแจ้งเตือนของเว็บนี้ในการตั้งค่าเบราว์เซอร์");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));
      const saved = await savePushSubscription(sub.toJSON());
      if (!saved.ok) {
        setMessage(saved.error);
        return;
      }
      setSubscribed(true);
      setMessage("เปิดการแจ้งเตือนแล้ว");
    } catch {
      setMessage("เปิดการแจ้งเตือนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setSubscribed(false);
      setMessage("ปิดการแจ้งเตือนแล้ว");
    } catch {
      setMessage("ปิดการแจ้งเตือนไม่สำเร็จ");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!sub) {
        setMessage("ยังไม่ได้เปิดการแจ้งเตือน");
        return;
      }
      const result = await sendTestPush(sub.endpoint);
      setMessage(result.ok ? "ส่งแจ้งเตือนทดสอบแล้ว รอสักครู่" : result.error);
    } finally {
      setBusy(false);
    }
  }

  if (support === "loading") return null;

  if (support === "ios-install") {
    return (
      <Card icon={<Share className="h-5 w-5" strokeWidth={1.75} />} tone="bg-blue-50 text-blue-700">
        <p className="text-sm font-medium text-neutral-900">รับแจ้งเตือนงานใหม่บน iPhone</p>
        <p className="mt-0.5 text-xs leading-relaxed text-neutral-600">
          กดปุ่มแชร์ใน Safari แล้วเลือก &quot;เพิ่มลงในหน้าจอโฮม&quot; จากนั้นเปิดแอปจากไอคอนบนหน้าจอโฮมเพื่อเปิดการแจ้งเตือน
        </p>
      </Card>
    );
  }

  if (support === "unsupported") {
    return (
      <Card icon={<BellOff className="h-5 w-5" strokeWidth={1.75} />} tone="bg-neutral-100 text-neutral-500">
        <p className="text-sm text-neutral-600">เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน ลองใช้ Chrome บนมือถือ</p>
      </Card>
    );
  }

  return (
    <Card
      icon={subscribed ? <BellRing className="h-5 w-5" strokeWidth={1.75} /> : <Bell className="h-5 w-5" strokeWidth={1.75} />}
      tone={subscribed ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}
    >
      <p className="text-sm font-medium text-neutral-900">
        {subscribed ? "การแจ้งเตือนงานใหม่: เปิดอยู่" : "แจ้งเตือนงานใหม่เข้ามือถือ"}
      </p>
      <p className="mt-0.5 text-xs text-neutral-500">
        {permission === "denied"
          ? "การแจ้งเตือนถูกบล็อกไว้ ต้องเปิดสิทธิ์ในการตั้งค่าเบราว์เซอร์"
          : subscribed
            ? "เมื่อมีงานเข้า เครื่องนี้จะได้รับแจ้งเตือนแม้ปิดแอปอยู่"
            : "กดเปิดเพื่อรับแจ้งเตือนทันทีที่มีคนแจ้งซ่อม แม้ปิดแอปอยู่"}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {subscribed ? (
          <>
            <button type="button" onClick={test} disabled={busy} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-60">
              ทดสอบแจ้งเตือน
            </button>
            <button type="button" onClick={disable} disabled={busy} className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 disabled:opacity-60">
              ปิดการแจ้งเตือน
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={enable}
            disabled={busy || permission === "denied"}
            className="rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
          >
            เปิดการแจ้งเตือน
          </button>
        )}
        {busy && <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />}
        {message && <span className="text-xs text-neutral-500">{message}</span>}
      </div>
    </Card>
  );
}

function Card({ icon, tone, children }: { icon: React.ReactNode; tone: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`}>{icon}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
