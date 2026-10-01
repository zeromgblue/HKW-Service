"use server";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { isCloudinaryConfigured } from "@/lib/cloudinary/client";
import {
  discardTicketImages,
  isAcceptableImage,
  MAX_FILES_PER_UPLOAD,
  uploadTicketImage,
} from "@/lib/cloudinary/uploadImage";
import type { TicketImageType } from "@/types/ticket";

const MAX_IMAGES_PER_TYPE = 6; // per ticket, per before/after

export type UploadTicketImagesResult =
  | { ok: true; uploaded: number; failed: number }
  | { ok: false; error: string };

export async function uploadTicketImages(
  ticketId: string,
  type: TicketImageType,
  uploadedBy: string,
  files: File[],
): Promise<UploadTicketImagesResult> {
  if (!ticketId) {
    return { ok: false, error: "ไม่พบ Ticket ID" };
  }
  if (type !== "before" && type !== "after") {
    return { ok: false, error: "ประเภทรูปไม่ถูกต้อง" };
  }

  if (!isCloudinaryConfigured()) {
    return { ok: false, error: "ระบบอัปโหลดรูปภาพยังไม่ได้ตั้งค่า" };
  }

  const candidates = files.filter((f) => f && f.size > 0).slice(0, MAX_FILES_PER_UPLOAD);
  if (candidates.length === 0) {
    return { ok: true, uploaded: 0, failed: 0 };
  }

  const db = getAdminFirestore();
  const ticketRef = db.collection("tickets").doc(ticketId);

  const [ticketSnap, existing] = await Promise.all([
    ticketRef.get(),
    db.collection("ticket_images").where("ticketId", "==", ticketId).where("type", "==", type).count().get(),
  ]);
  if (!ticketSnap.exists) {
    return { ok: false, error: "ไม่พบ Ticket นี้ในระบบ" };
  }
  const room = MAX_IMAGES_PER_TYPE - existing.data().count;
  if (room <= 0) {
    return { ok: false, error: "แนบรูปครบจำนวนสูงสุดของงานนี้แล้ว" };
  }
  candidates.splice(room);

  // All photos go up at the same time instead of one after another.
  const uploads = await Promise.allSettled(
    candidates.map(async (file) => {
      if (!isAcceptableImage(file)) throw new Error("Rejected file: wrong type or too large");
      return uploadTicketImage(file, ticketId, type);
    }),
  );
  const stored = uploads.flatMap((u) => (u.status === "fulfilled" ? [u.value] : []));
  for (const u of uploads) {
    if (u.status === "rejected") console.error("uploadTicketImages failed", u.reason);
  }
  const failed = candidates.length - stored.length;
  if (stored.length === 0) {
    return { ok: true, uploaded: 0, failed };
  }

  try {
    const batch = db.batch();
    for (const image of stored) {
      batch.set(db.collection("ticket_images").doc(), {
        ticketId,
        type,
        storagePath: image.storagePath,
        downloadUrl: image.downloadUrl,
        uploadedBy,
        createdAt: FieldValue.serverTimestamp(),
      });
    }
    // Touching the ticket is what tells every open page (live streams) that new photos exist.
    batch.update(ticketRef, { updatedAt: FieldValue.serverTimestamp() });
    await batch.commit();
  } catch (err) {
    console.error("uploadTicketImages could not save image records", err);
    await discardTicketImages(stored);
    return { ok: false, error: "บันทึกรูปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  }

  return { ok: true, uploaded: stored.length, failed };
}
