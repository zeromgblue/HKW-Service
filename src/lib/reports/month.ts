import { defaultCategories } from "@/data/categories";
import type { Ticket } from "@/types/ticket";

// Reports are cut by Thai calendar months, whatever timezone the server runs in.
const TIME_ZONE = "Asia/Bangkok";
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

const MONTH_KEY_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

// A month is identified as "YYYY-MM" (Gregorian year), e.g. "2026-09".
export function isMonthKey(value: unknown): value is string {
  return typeof value === "string" && MONTH_KEY_RE.test(value);
}

export function monthKeyOf(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: TIME_ZONE }).slice(0, 7);
}

export function currentMonthKey(): string {
  return monthKeyOf(new Date());
}

// [start, end) of the month in Bangkok time.
export function monthRange(monthKey: string): { start: Date; end: Date } {
  const [year, month] = monthKey.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, month - 1, 1) - BANGKOK_OFFSET_MS),
    end: new Date(Date.UTC(year, month, 1) - BANGKOK_OFFSET_MS),
  };
}

// "กันยายน 2569"
export function formatThaiMonth(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 15)).toLocaleDateString("th-TH", {
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  });
}

// "1 ก.ย. 69 09:30"
export function formatShortDateTime(iso: string): string {
  return new Date(iso).toLocaleString("th-TH", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIME_ZONE,
  });
}

// "1 ตุลาคม 2569"
export function formatLongDate(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("th-TH", { dateStyle: "long", timeZone: TIME_ZONE });
}

export function formatDuration(ms: number): string {
  const minutes = Math.max(0, Math.round(ms / 60000));
  if (minutes < 60) return `${minutes} นาที`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} ชม.`;
  const days = Math.floor(hours / 24);
  const rest = hours % 24;
  return rest ? `${days} วัน ${rest} ชม.` : `${days} วัน`;
}

export function repairDurationMs(ticket: Ticket): number | null {
  if (!ticket.completedAt) return null;
  return new Date(ticket.completedAt).getTime() - new Date(ticket.createdAt).getTime();
}

export interface CategorySummary {
  categoryId: string;
  name: string;
  total: number;
  completed: number;
  pending: number;
}

export interface MonthlySummary {
  total: number;
  completed: number;
  pending: number;
  completionPercent: number;
  urgent: number;
  critical: number;
  averageRepairMs: number | null;
  categories: CategorySummary[];
}

export function summarize(tickets: Ticket[]): MonthlySummary {
  const completed = tickets.filter((t) => t.status === "completed");
  const durations = completed.map(repairDurationMs).filter((ms) => ms !== null);

  // Known categories keep their usual order; anything else falls in behind them.
  const order = new Map(defaultCategories.map((c) => [c.categoryId, c.sortOrder]));
  const byCategory = new Map<string, CategorySummary>();
  for (const t of tickets) {
    const entry = byCategory.get(t.categoryId) ?? {
      categoryId: t.categoryId,
      name: t.categoryNameSnapshot,
      total: 0,
      completed: 0,
      pending: 0,
    };
    entry.total++;
    if (t.status === "completed") entry.completed++;
    else entry.pending++;
    byCategory.set(t.categoryId, entry);
  }

  return {
    total: tickets.length,
    completed: completed.length,
    pending: tickets.length - completed.length,
    completionPercent: tickets.length ? Math.round((completed.length / tickets.length) * 100) : 0,
    urgent: tickets.filter((t) => t.priority === "urgent").length,
    critical: tickets.filter((t) => t.priority === "critical").length,
    averageRepairMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : null,
    categories: [...byCategory.values()].sort(
      (a, b) => (order.get(a.categoryId) ?? 1000) - (order.get(b.categoryId) ?? 1000),
    ),
  };
}

export const priorityLabels: Record<Ticket["priority"], string> = {
  normal: "ปกติ",
  urgent: "ด่วน",
  critical: "ด่วนมาก",
};
