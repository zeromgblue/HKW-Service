"use server";

import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary/client";
import type { TicketImageType } from "@/types/ticket";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 3; // per upload
const MAX_IMAGES_PER_TYPE = 6; // per ticket, per before/after

export type UploadTicketImagesResult =
  | { ok: true; uploaded: number; failed: number }
  | { ok: false; error: string };

function getExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

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

  const candidates = files.filter((f) => f && f.size > 0).slice(0, MAX_FILES);
  if (candidates.length === 0) {
    return { ok: true, uploaded: 0, failed: 0 };
  }

  const db = getAdminFirestore();

  const ticketSnap = await db.collection("tickets").doc(ticketId).get();
  if (!ticketSnap.exists) {
    return { ok: false, error: "ไม่พบ Ticket นี้ในระบบ" };
  }

  const existing = await db
    .collection("ticket_images")
    .where("ticketId", "==", ticketId)
    .where("type", "==", type)
    .count()
    .get();
  const room = MAX_IMAGES_PER_TYPE - existing.data().count;
  if (room <= 0) {
    return { ok: false, error: "แนบรูปครบจำนวนสูงสุดของงานนี้แล้ว" };
  }
  candidates.splice(room);

  const cloudinary = getCloudinary();

  let uploaded = 0;
  let failed = 0;

  for (const file of candidates) {
    const extension = getExtension(file.name);
    const validType = ALLOWED_MIME_TYPES.has(file.type) && ALLOWED_EXTENSIONS.has(extension);
    const validSize = file.size <= MAX_FILE_SIZE;

    if (!validType || !validSize) {
      failed++;
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

      const result = await cloudinary.uploader.upload(dataUri, {
        folder: `hkw-repair/${ticketId}/${type}`,
        resource_type: "image",
        transformation: [{ width: 1600, height: 1600, crop: "limit", quality: "auto", fetch_format: "auto" }],
      });

      const imageRef = db.collection("ticket_images").doc();
      await imageRef.set({
        ticketId,
        type,
        storagePath: result.public_id,
        downloadUrl: result.secure_url,
        uploadedBy,
        createdAt: FieldValue.serverTimestamp(),
      });

      uploaded++;
    } catch (err) {
      console.error("uploadTicketImages failed for", file.name, err);
      failed++;
    }
  }

  return { ok: true, uploaded, failed };
}
