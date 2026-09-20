"use server";

import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { sendPushToTicket } from "@/lib/push";

export type StaffActionResult = { ok: true } | { ok: false; error: string };

const completeSchema = z.object({
  ticketId: z.string().trim().min(1).max(40),
  actorName: z.string().trim().min(2, "กรุณาใส่ชื่อผู้ดำเนินการ").max(60),
});

const GENERIC_ERROR = "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

// Closes a job. Requires an after-repair photo to already be stored, and only a still-pending
// ticket can be completed, so a double submit can never complete the same ticket twice.
export async function completeTicket(input: unknown): Promise<StaffActionResult> {
  const parsed = completeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  if (!isFirebaseAdminConfigured()) return { ok: false, error: GENERIC_ERROR };

  const { ticketId, actorName } = parsed.data;
  const db = getAdminFirestore();
  const ticketRef = db.collection("tickets").doc(ticketId);
  const afterImagesQuery = db
    .collection("ticket_images")
    .where("ticketId", "==", ticketId)
    .where("type", "==", "after")
    .limit(1);

  let title = "";

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ticketRef);
      if (!snap.exists) throw new Error("NOT_FOUND");
      title = snap.data()!.title;
      if (snap.data()!.status !== "pending") throw new Error("ALREADY_DONE");

      const afterImages = await tx.get(afterImagesQuery);
      if (afterImages.empty) throw new Error("NO_AFTER_PHOTO");

      tx.update(ticketRef, {
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
        completedBy: actorName,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
    // Tell the teacher who reported it (if they opted in) once the job is really closed.
    after(() =>
      sendPushToTicket(ticketId, {
        title: "ซ่อมเสร็จแล้ว",
        body: `${title} ดำเนินการเรียบร้อยโดย ${actorName}`,
        url: `/ticket/${ticketId}`,
        tag: `done-${ticketId}`,
      }).catch((e) => console.error("teacher push failed", e)),
    );
    return { ok: true };
  } catch (err) {
    const code = err instanceof Error ? err.message : "";
    if (code === "NOT_FOUND") return { ok: false, error: "ไม่พบงานนี้ในระบบ" };
    if (code === "ALREADY_DONE") return { ok: false, error: "งานนี้ถูกจบไปแล้ว กรุณารีเฟรชหน้า" };
    if (code === "NO_AFTER_PHOTO") return { ok: false, error: "กรุณาอัปโหลดรูปหลังซ่อมอย่างน้อย 1 รูปก่อนจบงาน" };
    console.error("completeTicket failed", err);
    return { ok: false, error: GENERIC_ERROR };
  }
}
