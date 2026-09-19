import type { TicketStatus } from "@/types/ticket";

export const statusLabels: Record<TicketStatus, string> = {
  pending: "รอรับเรื่อง",
  received: "รับเรื่องแล้ว",
  in_progress: "กำลังดำเนินการ",
  waiting: "รออะไหล่ / รอดำเนินการ",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};
