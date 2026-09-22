"use server";

import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { sendPushToEndpoint, subscriptionId } from "@/lib/push";

export type PushActionResult = { ok: true } | { ok: false; error: string };

const MAX_SUBSCRIPTIONS = 100;

const subscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({
    p256dh: z.string().min(10).max(200),
    auth: z.string().min(10).max(100),
  }),
});

export async function savePushSubscription(input: unknown): Promise<PushActionResult> {
  const parsed = subscriptionSchema.safeParse(input);
  if (!parsed.success || !parsed.data.endpoint.startsWith("https://")) {
    return { ok: false, error: "ข้อมูลการสมัครรับแจ้งเตือนไม่ถูกต้อง" };
  }
  if (!isFirebaseAdminConfigured()) return { ok: false, error: "ระบบยังไม่ได้เชื่อมต่อฐานข้อมูล" };

  const { endpoint, keys } = parsed.data;
  const col = getAdminFirestore().collection("push_subscriptions");
  const ref = col.doc(subscriptionId(endpoint));

  try {
    const existing = await ref.get();
    if (!existing.exists) {
      const count = await col.count().get();
      if (count.data().count >= MAX_SUBSCRIPTIONS) {
        return { ok: false, error: "จำนวนอุปกรณ์ที่รับแจ้งเตือนเต็มแล้ว" };
      }
    }
    await ref.set({ endpoint, keys, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true };
  } catch (err) {
    console.error("savePushSubscription failed", err);
    return { ok: false, error: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }
}

export async function removePushSubscription(endpoint: unknown): Promise<PushActionResult> {
  if (typeof endpoint !== "string" || !endpoint) return { ok: false, error: "ข้อมูลไม่ถูกต้อง" };
  try {
    await getAdminFirestore().collection("push_subscriptions").doc(subscriptionId(endpoint)).delete();
    return { ok: true };
  } catch {
    return { ok: false, error: "ลบไม่สำเร็จ" };
  }
}

export async function sendTestPush(endpoint: unknown): Promise<PushActionResult> {
  if (typeof endpoint !== "string" || !endpoint) return { ok: false, error: "ข้อมูลไม่ถูกต้อง" };
  const ok = await sendPushToEndpoint(endpoint, {
    title: "ทดสอบการแจ้งเตือน",
    body: "อุปกรณ์นี้พร้อมรับแจ้งเตือนงานใหม่แล้ว",
    url: "/c",
    tag: "hkw-test",
    force: true,
  });
  return ok ? { ok: true } : { ok: false, error: "ส่งแจ้งเตือนทดสอบไม่สำเร็จ ลองเปิดการแจ้งเตือนใหม่อีกครั้ง" };
}
