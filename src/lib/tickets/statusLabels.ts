import type { TicketStatus } from "@/types/ticket";

export const statusLabels: Record<TicketStatus, string> = {
  pending: "รอดำเนินการ",
  completed: "เสร็จสิ้น",
};
