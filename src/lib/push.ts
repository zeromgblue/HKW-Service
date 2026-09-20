import "server-only";
import { createHash } from "node:crypto";
import webpush from "web-push";
import { getAdminFirestore } from "@/lib/firebase/admin";

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  tag?: string;
  force?: boolean; // show even while the app is open (used by the test button)
}

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

export function isPushConfigured(): boolean {
  return Boolean(publicKey && privateKey && subject);
}

let configured = false;
function configure() {
  if (configured) return;
  webpush.setVapidDetails(subject!, publicKey!, privateKey!);
  configured = true;
}

export const subscriptionId = (endpoint: string) => createHash("sha256").update(endpoint).digest("hex");

interface StoredSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

async function sendOne(
  docId: string,
  sub: StoredSubscription,
  payload: PushPayload,
  urgent: boolean,
  collection = "push_subscriptions",
) {
  const db = getAdminFirestore();
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload), {
      TTL: 60 * 60,
      urgency: urgent ? "high" : "normal",
    });
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    // The device unsubscribed or the subscription expired: forget it.
    if (status === 404 || status === 410) {
      await db.collection(collection).doc(docId).delete().catch(() => undefined);
    } else {
      console.error("push send failed", status, (err as Error).message);
    }
    return false;
  }
}

export async function sendPushToAll(payload: PushPayload, urgent = false): Promise<{ sent: number; total: number }> {
  if (!isPushConfigured()) return { sent: 0, total: 0 };
  configure();

  const snap = await getAdminFirestore().collection("push_subscriptions").get();
  const results = await Promise.all(
    snap.docs.map((d) => sendOne(d.id, d.data() as StoredSubscription, payload, urgent)),
  );
  return { sent: results.filter(Boolean).length, total: snap.size };
}

export async function sendPushToEndpoint(endpoint: string, payload: PushPayload): Promise<boolean> {
  if (!isPushConfigured()) return false;
  configure();

  const id = subscriptionId(endpoint);
  const snap = await getAdminFirestore().collection("push_subscriptions").doc(id).get();
  if (!snap.exists) return false;
  return sendOne(id, snap.data() as StoredSubscription, payload, true);
}

// Teachers opt in per ticket ("tell me when it's repaired"); sent once, then forgotten.
export async function sendPushToTicket(ticketId: string, payload: PushPayload): Promise<number> {
  if (!isPushConfigured()) return 0;
  configure();

  const col = getAdminFirestore().collection("ticket_push");
  const snap = await col.where("ticketId", "==", ticketId).get();
  const results = await Promise.all(
    snap.docs.map(async (d) => {
      const ok = await sendOne(d.id, d.data() as StoredSubscription, payload, true, "ticket_push");
      await d.ref.delete().catch(() => undefined);
      return ok;
    }),
  );
  return results.filter(Boolean).length;
}
