import { z } from "zod";

// Thai numbers: 9 digits (landline) or 10 (mobile), always starting with 0. Spaces and dashes
// are tolerated while typing and stripped before the check.
const phoneSchema = z
  .string()
  .trim()
  .min(1, "กรุณากรอกเบอร์โทร")
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^0\d{8,9}$/.test(v), "เบอร์โทรไม่ถูกต้อง (เช่น 0812345678)");

export const reportFormSchema = z.object({
  categoryId: z.string().min(1, "กรุณาเลือกประเภทปัญหา"),
  locationText: z
    .string()
    .trim()
    .min(3, "กรุณาระบุสถานที่ให้ละเอียดขึ้น")
    .max(300, "สถานที่ยาวเกินไป"),
  title: z
    .string()
    .trim()
    .min(3, "กรุณากรอกหัวข้อ")
    .max(120, "หัวข้อยาวเกินไป"),
  description: z
    .string()
    .trim()
    .min(5, "กรุณาอธิบายปัญหาเพิ่มเติม")
    .max(2000, "รายละเอียดยาวเกินไป"),
  priority: z.enum(["normal", "urgent", "critical"]),
  reporterName: z
    .string()
    .trim()
    .min(2, "กรุณากรอกชื่อผู้แจ้งซ่อม")
    .max(100, "ชื่อยาวเกินไป"),
  reporterPhone: phoneSchema,
  // Optional extra channel (e.g. LINE ID); name and phone are the required ones.
  reporterContact: z.string().trim().max(100, "ช่องทางการติดต่อยาวเกินไป"),
});

// What the form holds while typing (the phone is still raw text here).
export type ReportFormValues = z.input<typeof reportFormSchema>;

export const reportFormDefaultValues: ReportFormValues = {
  categoryId: "",
  locationText: "",
  title: "",
  description: "",
  priority: "normal",
  reporterName: "",
  reporterPhone: "",
  reporterContact: "",
};

export const MIN_REPORT_IMAGES = 1;
