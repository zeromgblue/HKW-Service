"use server";

import { after } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { defaultCategories } from "@/data/categories";
import { getAdminFirestore, isFirebaseAdminConfigured } from "@/lib/firebase/admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary/client";
import {
  discardTicketImages,
  isAcceptableImage,
  MAX_FILES_PER_UPLOAD,
  uploadTicketImage,
  type StoredImage,
} from "@/lib/cloudinary/uploadImage";
import { sendPushToAll } from "@/lib/push";
import { generateTicketId } from "@/lib/tickets/generateTicketId";
import { MIN_REPORT_IMAGES, reportFormSchema } from "@/lib/validation/ticket";

export type CreateTicketResult =
  | { ok: true; ticketId: string }
  | { ok: false; error: string };

const SAVE_ERROR = "บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

// Creates a ticket together with its photos. The photos are stored first and the ticket plus
// its image records are then written in one batch, so staff never see a ticket without the
// (mandatory) photos and a failed upload never leaves a half-made ticket behind.
export async function createTicket(input: unknown, files: unknown): Promise<CreateTicketResult> {
  // Never trust client-side validation alone (spec section 8 / 12).
  const parsed = reportFormSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบแบบฟอร์มอีกครั้ง" };
  }

  const images = (Array.isArray(files) ? files : []).filter(isAcceptableImage).slice(0, MAX_FILES_PER_UPLOAD);
  if (images.length < MIN_REPORT_IMAGES) {
    return { ok: false, error: "กรุณาแนบรูปภาพอย่างน้อย 1 รูป (JPG, PNG หรือ WebP ไม่เกิน 5MB)" };
  }

  if (!isFirebaseAdminConfigured()) {
    return {
      ok: false,
      error: "ระบบยังไม่ได้เชื่อมต่อฐานข้อมูล กรุณาติดต่อผู้ดูแลระบบ",
    };
  }
  if (!isCloudinaryConfigured()) {
    return { ok: false, error: "ระบบอัปโหลดรูปภาพยังไม่ได้ตั้งค่า กรุณาติดต่อผู้ดูแลระบบ" };
  }

  const category = defaultCategories.find((c) => c.categoryId === parsed.data.categoryId);
  if (!category) {
    return { ok: false, error: "ไม่พบประเภทปัญหาที่เลือก" };
  }

  const values = parsed.data;
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
    reporterName: values.reporterName,
    reporterPhone: values.reporterPhone,
    reporterContact: values.reporterContact || null,
    isAnonymous: false,
    assignedTo: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    completedAt: null,
    completedBy: null,
    completionNote: null,
  };

  let stored: StoredImage[] = [];

  try {
    // IDs are random; collisions are astronomically unlikely but guard anyway.
    let ticketId = "";
    for (let attempt = 0; attempt < 5 && !ticketId; attempt++) {
      const candidate = generateTicketId();
      const existing = await db.collection("tickets").doc(candidate).get();
      if (!existing.exists) ticketId = candidate;
    }
    if (!ticketId) return { ok: false, error: SAVE_ERROR };

    const uploads = await Promise.allSettled(images.map((file) => uploadTicketImage(file, ticketId, "before")));
    stored = uploads.flatMap((u) => (u.status === "fulfilled" ? [u.value] : []));
    for (const u of uploads) {
      if (u.status === "rejected") console.error("createTicket image upload failed", u.reason);
    }
    if (stored.length < MIN_REPORT_IMAGES) {
      await discardTicketImages(stored);
      return { ok: false, error: "อัปโหลดรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
    }

    const batch = db.batch();
    // create() fails if the ID got taken in the meantime, so nothing is ever overwritten.
    batch.create(db.collection("tickets").doc(ticketId), ticketData);
    for (const image of stored) {
      batch.set(db.collection("ticket_images").doc(), {
        ticketId,
        type: "before",
        storagePath: image.storagePath,
        downloadUrl: image.downloadUrl,
        uploadedBy: "public",
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();

    // Alert staff phones after the response is sent so reporting never waits on push delivery.
    const urgent = values.priority !== "normal";
    after(() =>
      sendPushToAll(
        {
          title: urgent ? "งานแจ้งซ่อมด่วน!" : "มีงานแจ้งซ่อมใหม่",
          body: `${values.title} · ${values.locationText}`,
          url: `/c/tickets/${ticketId}`,
          tag: ticketId,
        },
        urgent,
      ).catch((e) => console.error("push notify failed", e)),
    );

    return { ok: true, ticketId };
  } catch (err) {
    console.error("createTicket failed", err);
    await discardTicketImages(stored);
    return { ok: false, error: SAVE_ERROR };
  }
}
