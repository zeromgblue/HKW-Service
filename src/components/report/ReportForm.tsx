"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Circle,
  Flame,
  Loader2,
  MapPin,
  Send,
  TriangleAlert,
} from "lucide-react";
import { createTicket } from "@/lib/actions/tickets";
import { uploadTicketImages } from "@/lib/actions/images";
import { defaultCategories } from "@/data/categories";
import { CategoryIcon } from "@/components/icons/CategoryIcon";
import { ImagePicker } from "@/components/report/ImagePicker";
import { rememberTicket } from "@/lib/myTickets";
import {
  reportFormDefaultValues,
  reportFormSchema,
  type ReportFormValues,
} from "@/lib/validation/ticket";
import type { TicketPriority } from "@/types/ticket";

const priorityOptions: {
  value: TicketPriority;
  label: string;
  icon: typeof Circle;
  activeClass: string;
}[] = [
  {
    value: "normal",
    label: "ปกติ",
    icon: Circle,
    activeClass: "border-blue-600 bg-blue-50 text-blue-700",
  },
  {
    value: "urgent",
    label: "ด่วน",
    icon: TriangleAlert,
    activeClass: "border-amber-500 bg-amber-50 text-amber-700",
  },
  {
    value: "critical",
    label: "ด่วนมาก",
    icon: Flame,
    activeClass: "border-red-500 bg-red-50 text-red-700",
  },
];

type FieldErrors = Partial<Record<keyof ReportFormValues, string>>;

export function ReportForm() {
  const router = useRouter();
  const [values, setValues] = useState<ReportFormValues>(reportFormDefaultValues);
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function updateField<K extends keyof ReportFormValues>(key: K, value: ReportFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const result = reportFormSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof ReportFormValues;
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const response = await createTicket(result.data);
      if (!response.ok) {
        setSubmitError(response.error);
        return;
      }

      rememberTicket(response.ticketId);

      if (images.length > 0) {
        setIsUploadingImages(true);
        try {
          await uploadTicketImages(response.ticketId, "before", "public", images);
        } catch (err) {
          // Ticket already exists — don't block the reporter on a photo upload hiccup.
          console.error("uploadTicketImages failed", err);
        } finally {
          setIsUploadingImages(false);
        }
      }

      router.push(`/success/${response.ticketId}`);
    } catch {
      setSubmitError("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-7">
      <fieldset className="flex flex-col gap-2.5">
        <label className="text-sm font-medium text-neutral-800">
          ประเภทปัญหา <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {defaultCategories
            .filter((c) => c.active)
            .map((c) => {
              const active = values.categoryId === c.categoryId;
              return (
                <motion.button
                  key={c.categoryId}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={() => updateField("categoryId", c.categoryId)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-2 rounded-2xl border px-2 py-3.5 text-center transition-colors ${
                    active
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50"
                  }`}
                >
                  <CategoryIcon name={c.icon} className="h-5 w-5" />
                  <span className="text-xs font-medium leading-tight">{c.name}</span>
                </motion.button>
              );
            })}
        </div>
        <AnimatePresence>
          {errors.categoryId && <FieldError id="categoryId-error">{errors.categoryId}</FieldError>}
        </AnimatePresence>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label htmlFor="locationText" className="text-sm font-medium text-neutral-800">
          สถานที่เกิดปัญหา <span className="text-red-600">*</span>
        </label>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-neutral-400" />
          <input
            id="locationText"
            type="text"
            value={values.locationText}
            onChange={(e) => updateField("locationText", e.target.value)}
            placeholder="เช่น หน้าอาคาร 2 ข้างห้องประชุม ติดบันไดฝั่งสนาม"
            aria-invalid={Boolean(errors.locationText)}
            aria-describedby={errors.locationText ? "locationText-error" : undefined}
            className="w-full rounded-2xl border border-neutral-200 bg-white py-3 pl-10 pr-4 text-base text-neutral-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <p className="text-xs text-neutral-400">
          พิมพ์อธิบายสถานที่ได้อย่างอิสระ ไม่ต้องเลือกจากรายการ
        </p>
        <AnimatePresence>
          {errors.locationText && (
            <FieldError id="locationText-error">{errors.locationText}</FieldError>
          )}
        </AnimatePresence>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label htmlFor="title" className="text-sm font-medium text-neutral-800">
          หัวข้อ <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={values.title}
          onChange={(e) => updateField("title", e.target.value)}
          placeholder="เช่น หลอดไฟเสีย"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          className="rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
        <AnimatePresence>
          {errors.title && <FieldError id="title-error">{errors.title}</FieldError>}
        </AnimatePresence>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <label htmlFor="description" className="text-sm font-medium text-neutral-800">
          รายละเอียด <span className="text-red-600">*</span>
        </label>
        <textarea
          id="description"
          value={values.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={4}
          placeholder="อธิบายปัญหาเพิ่มเติม"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "description-error" : undefined}
          className="resize-none rounded-2xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
        />
        <AnimatePresence>
          {errors.description && (
            <FieldError id="description-error">{errors.description}</FieldError>
          )}
        </AnimatePresence>
      </fieldset>

      <fieldset className="flex flex-col gap-2.5">
        <label className="text-sm font-medium text-neutral-800">รูปภาพประกอบ</label>
        <ImagePicker onChange={setImages} />
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-neutral-800">ความเร่งด่วน</legend>
        <div className="grid grid-cols-3 gap-2.5">
          {priorityOptions.map((opt) => {
            const Icon = opt.icon;
            const active = values.priority === opt.value;
            return (
              <motion.button
                key={opt.value}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => updateField("priority", opt.value)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border px-3 py-3 text-sm font-medium transition-colors ${
                  active ? opt.activeClass : "border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50"
                }`}
              >
                <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                {opt.label}
              </motion.button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-neutral-800">แจ้งแบบไม่ระบุชื่อ</p>
            <p className="text-xs text-neutral-400">ไม่บันทึกชื่อและช่องทางติดต่อของคุณ</p>
          </div>
          <Switch
            checked={values.isAnonymous}
            onChange={(v) => updateField("isAnonymous", v)}
            label="แจ้งแบบไม่ระบุชื่อ"
          />
        </div>

        <AnimatePresence initial={false}>
          {!values.isAnonymous && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex flex-col gap-3 overflow-hidden"
            >
              <div className="flex flex-col gap-1">
                <label htmlFor="reporterName" className="text-sm text-neutral-700">
                  ชื่อผู้แจ้ง (ไม่บังคับ)
                </label>
                <input
                  id="reporterName"
                  type="text"
                  value={values.reporterName}
                  onChange={(e) => updateField("reporterName", e.target.value)}
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="reporterContact" className="text-sm text-neutral-700">
                  ช่องทางติดต่อ (ไม่บังคับ)
                </label>
                <input
                  id="reporterContact"
                  type="text"
                  value={values.reporterContact}
                  onChange={(e) => updateField("reporterContact", e.target.value)}
                  placeholder="เบอร์โทร หรือ อีเมล"
                  className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-base text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </fieldset>

      <AnimatePresence>
        {submitError && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            role="alert"
            className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
            {submitError}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        type="submit"
        disabled={isSubmitting}
        whileTap={{ scale: 0.98 }}
        className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
            {isUploadingImages ? "กำลังอัปโหลดรูป..." : "กำลังส่ง..."}
          </>
        ) : (
          <>
            <Send className="h-4.5 w-4.5" strokeWidth={1.75} />
            ส่งแจ้งซ่อม
          </>
        )}
      </motion.button>
    </form>
  );
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <motion.p
      id={id}
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="text-sm text-red-600"
    >
      {children}
    </motion.p>
  );
}

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-neutral-200"
      }`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className="absolute top-1 h-5 w-5 rounded-full bg-white shadow"
        style={{ left: checked ? "calc(100% - 24px)" : "4px" }}
      />
    </button>
  );
}
