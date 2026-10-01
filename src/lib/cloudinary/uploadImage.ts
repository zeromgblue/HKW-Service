import "server-only";
import type { UploadApiOptions, UploadApiResponse } from "cloudinary";
import { getCloudinary } from "@/lib/cloudinary/client";
import type { TicketImageType } from "@/types/ticket";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
// The browser already downsizes photos (see shrinkImage). Only a file that slipped through at
// full size gets resized by Cloudinary, because that step makes every upload wait.
const RESIZE_ABOVE = 1024 * 1024;

export const MAX_FILES_PER_UPLOAD = 3;

export interface StoredImage {
  storagePath: string;
  downloadUrl: string;
}

export function isAcceptableImage(file: unknown): file is File {
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_FILE_SIZE) return false;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return ALLOWED_MIME_TYPES.has(file.type) && ALLOWED_EXTENSIONS.has(extension);
}

export async function uploadTicketImage(
  file: File,
  ticketId: string,
  type: TicketImageType,
): Promise<StoredImage> {
  const buffer = Buffer.from(await file.arrayBuffer());

  const options: UploadApiOptions = {
    folder: `hkw-repair/${ticketId}/${type}`,
    resource_type: "image",
  };
  if (file.size > RESIZE_ABOVE) {
    options.transformation = [{ width: 1600, height: 1600, crop: "limit", quality: "auto" }];
  }

  // Streams the raw bytes; a base64 data URI would make the payload a third larger.
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    getCloudinary()
      .uploader.upload_stream(options, (error, response) => {
        if (error || !response) reject(error ?? new Error("Empty Cloudinary response"));
        else resolve(response);
      })
      .end(buffer);
  });

  return { storagePath: result.public_id, downloadUrl: result.secure_url };
}

// Best-effort removal of photos whose database records never got written.
export async function discardTicketImages(images: StoredImage[]) {
  if (images.length === 0) return;
  const cloudinary = getCloudinary();
  await Promise.allSettled(images.map((image) => cloudinary.uploader.destroy(image.storagePath)));
}
