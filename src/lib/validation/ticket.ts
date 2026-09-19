import { z } from "zod";

// Phase 1 scope: text fields only. Image and GPS fields are added
// in later phases (see MVP Development Plan phase 3 / 4) and are
// intentionally left out of this schema for now.
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
  isAnonymous: z.boolean(),
  reporterName: z.string().trim().max(100).optional().or(z.literal("")),
  reporterContact: z.string().trim().max(100).optional().or(z.literal("")),
});

export type ReportFormValues = z.infer<typeof reportFormSchema>;

export const reportFormDefaultValues: ReportFormValues = {
  categoryId: "",
  locationText: "",
  title: "",
  description: "",
  priority: "normal",
  isAnonymous: false,
  reporterName: "",
  reporterContact: "",
};
