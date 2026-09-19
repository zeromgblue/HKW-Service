import "server-only";
import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export function isCloudinaryConfigured(): boolean {
  return Boolean(cloudName && apiKey && apiSecret);
}

let configured = false;

export function getCloudinary() {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary ยังไม่ได้ตั้งค่า กรุณาใส่ค่า CLOUDINARY_* ใน .env.local",
    );
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });
    configured = true;
  }
  return cloudinary;
}
