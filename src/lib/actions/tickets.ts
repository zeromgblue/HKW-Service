"use server";

import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { defaultCategories } from "@/data/categories";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { sendPushToAll } from "@/lib/push";
import { generateTicketId } from "@/lib/tickets/generateTicketId";
import { reportFormSchema } from "@/lib/validation/ticket";

export type CreateTicketResult =
  | { ok: true; ticketId: string }
  | { ok: false; error: string };

export async function createTicket(input: unknown): Promise<CreateTicketResult> {
  // Never trust client-side validation alone (spec section 8 / 12).
  const parsed = reportFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแบบฟอร์มอีกครั้ง" };
  }

  if (!isFirebaseAdminConfigured()) {
    return {
      ok: false,
      error: "ระบบยังไม่ได้เชื่อมต่อฐานข้อมูล กรุณาติดต่อผู้ดูแลระบบ",
    };
  }

  const category = defaultCategories.find((c) => c.categoryId === parsed.data.categoryId);
  if (!category) {
    return { ok: false, error: "ไม่พบประเภทปัญหาที่เลือก" };
  }

  const values = parsed.data;
  const isAnonymous = values.isAnonymous;

  const db = getAdminFirestore();

  // Only the fields a public reporter is allowed to set ever reach Firestore
  // here — status/assignedTo/completion fields are fixed server-side.
  const ticketData = {
    categoryId: category.categoryId,
    categoryNameSnapshot: category.name,
    locationText: values.locationText,
    latitude: null,
    longitude: null,
    accuracyMeters: null,
    locationCapturedAt: null,
    locationSource: null,
    originalLatitude: null,
    originalLongitude: null,
    originalAccuracyMeters: null,
    title: values.title,
    description: values.description,
    priority: values.priority,
    status: "pending" as const,
    reporterType: "teacher" as const,
    reporterName: isAnonymous ? null : values.reporterName || null,
    reporterContact: isAnonymous ? null : values.reporterContact || null,
    isAnonymous,
    assignedTo: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    completedAt: null,
    completedBy: null,
    completionNote: null,
  };

  // IDs are random; collisions are astronomically unlikely but guard anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const ticketId = generateTicketId();
    const ticketRef = db.collection("tickets").doc(ticketId);

    try {
      await db.runTransaction(async (tx) => {
        const existing = await tx.get(ticketRef);
        if (existing.exists) {
          throw new Error("TICKET_ID_COLLISION");
        }
        tx.set(ticketRef, ticketData);
      });

      // Alert staff phones after the response is sent so reporting never waits on push delivery.
      const urgent = values.priority !== "normal";
      after(() =>
        sendPushToAll(
          {
            title: urgent ? "งานแจ้งซ่อมด่วน!" : "มีงานแจ้งซ่อมใหม่",
            body: `${values.title} · ${values.locationText}`,
            url: `/staff/tickets/${ticketId}`,
            tag: ticketId,
          },
          urgent,
        ).catch((e) => console.error("push notify failed", e)),
      );

      return { ok: true, ticketId };
    } catch (err) {
      if (err instanceof Error && err.message === "TICKET_ID_COLLISION") {
        continue;
      }
      console.error("createTicket failed", err);
      return { ok: false, error: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
    }
  }

  return { ok: false, error: "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
}
