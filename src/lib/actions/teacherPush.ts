"use server";

import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { subscriptionId } from "@/lib/push";
import { isValidTicketId } from "@/lib/tickets/publicTicket";

export type TeacherPushResult = { ok: true } | { ok: false; error: string };

const MAX_PER_TICKET = 5;

const subscriptionSchema = z.object({
  endpoint: z.url().max(1000),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(10).max(100) }),
});

// A reporter asks to be notified when this ticket is finished.
export async function subscribeTicketPush(ticketId: unknown, subscription: unknown): Promise<TeacherPushResult> {
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!isValidTicketId(ticketId) || !parsed.success || !parsed.data.endpoint.startsWith("https://")) {
    return { ok: false, error: "ข้อมูลไม่ถูกต้อง" };
  }
  if (!isFirebaseAdminConfigured()) return { ok: false, error: "ระบบยังไม่ได้เชื่อมต่อฐานข้อมูล" };

  const db = getAdminFirestore();
  const ticket = await db.collection("tickets").doc(ticketId).get();
  if (!ticket.exists) return { ok: false, error: "ไม่พบงานนี้ในระบบ" };
  if (ticket.data()!.status === "completed") return { ok: false, error: "งานนี้ซ่อมเสร็จแล้ว" };

  const { endpoint, keys } = parsed.data;
  const col = db.collection("ticket_push");
  const ref = col.doc(subscriptionId(`${ticketId}|${endpoint}`));

  try {
    if (!(await ref.get()).exists) {
      const count = await col.where("ticketId", "==", ticketId).count().get();
      if (count.data().count >= MAX_PER_TICKET) return { ok: false, error: "งานนี้มีอุปกรณ์รับแจ้งเตือนครบแล้ว" };
    }
    await ref.set({ ticketId, endpoint, keys, createdAt: FieldValue.serverTimestamp() }, { merge: true });
    return { ok: true };
  } catch (err) {
    console.error("subscribeTicketPush failed", err);
    return { ok: false, error: "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }
}
