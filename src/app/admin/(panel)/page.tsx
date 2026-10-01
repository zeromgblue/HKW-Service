import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, ClipboardList, FileText, Inbox } from "lucide-react";
import { requireAdmin } from "@/lib/admin/session";
import { listTickets } from "@/lib/tickets/listTickets";
import { getStaleIds } from "@/lib/tickets/filterTickets";
import { currentMonthKey, formatDuration, formatThaiMonth, monthKeyOf, summarize } from "@/lib/reports/month";
import { formatThaiDateTime } from "@/lib/formatDate";
import { PriorityBadge, StatusBadge } from "@/components/tickets/Badges";
import { Reveal } from "@/components/ui/Reveal";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const tickets = await listTickets();
  const all = summarize(tickets);
  const staleIds = getStaleIds(tickets);

  const monthKey = currentMonthKey();
  const month = summarize(tickets.filter((t) => monthKeyOf(t.createdAt) === monthKey));
  const maxCategory = Math.max(1, ...all.categories.map((c) => c.total));

  const tiles = [
    { label: "งานทั้งหมด", value: all.total, icon: ClipboardList, tone: "bg-neutral-100 text-neutral-700", href: "/admin/tickets" },
    { label: "รอดำเนินการ", value: all.pending, icon: Inbox, tone: "bg-amber-50 text-amber-700", href: "/admin/tickets?tab=pending" },
    { label: "เสร็จแล้ว", value: all.completed, icon: CheckCircle2, tone: "bg-emerald-50 text-emerald-700", href: "/admin/tickets?tab=done" },
    { label: "ค้างเกิน 3 วัน", value: staleIds.size, icon: AlertTriangle, tone: "bg-red-50 text-red-700", href: "/admin/tickets?tab=pending" },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:px-5 sm:py-7">
      <Reveal>
        <h1 className="text-xl font-bold text-neutral-900">ภาพรวมระบบ</h1>
        <p className="text-sm text-neutral-500">สถานะงานแจ้งซ่อมทั้งหมด อัปเดตแบบเรียลไทม์</p>
      </Reveal>

      <section aria-label="สรุปจำนวนงาน" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map(({ label, value, icon: Icon, tone, href }, i) => (
          <Reveal key={label} index={1 + i}>
          <Link
            href={href}
            className="flex h-full flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-blue-300 active:scale-[0.97]"
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${tone}`}>
              <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
            </span>
            <div>
              <p className="text-2xl font-bold tabular-nums text-neutral-900">{value}</p>
              <p className="text-xs text-neutral-500">{label}</p>
            </div>
          </Link>
          </Reveal>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Reveal index={5} className="flex">
        <section className="flex flex-1 flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-neutral-900">เดือนนี้ · {formatThaiMonth(monthKey)}</h2>
              <p className="text-xs text-neutral-400">นับจากวันที่แจ้งซ่อม</p>
            </div>
            <Link
              href={`/admin/documents/${monthKey}`}
              className="flex shrink-0 items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95"
            >
              <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
              เอกสารสรุป
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Stat label="แจ้งเข้ามา" value={`${month.total} งาน`} />
            <Stat label="ซ่อมเสร็จ" value={`${month.completed} งาน (${month.completionPercent}%)`} />
            <Stat label="รอดำเนินการ" value={`${month.pending} งาน`} />
            <Stat
              label="เวลาซ่อมเฉลี่ย"
              value={month.averageRepairMs === null ? "-" : formatDuration(month.averageRepairMs)}
            />
          </dl>
        </section>
        </Reveal>

        <Reveal index={6} className="flex">
        <section className="flex flex-1 flex-col gap-3 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-base font-semibold text-neutral-900">งานตามประเภท</h2>
          {all.categories.length === 0 ? (
            <p className="text-sm text-neutral-400">ยังไม่มีงานแจ้งซ่อม</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {all.categories.map((c) => (
                <li key={c.categoryId} className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="truncate text-neutral-700">{c.name}</span>
                    <span className="shrink-0 tabular-nums text-neutral-900">
                      <span className="font-semibold">{c.total}</span>
                      <span className="text-xs text-neutral-400"> · ค้าง {c.pending}</span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-neutral-100">
                    <div className="h-2 rounded-full bg-blue-600" style={{ width: `${(c.total / maxCategory) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
        </Reveal>
      </div>

      <Reveal index={7}>
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-neutral-900">งานล่าสุด</h2>
          <Link href="/admin/tickets" className="text-xs font-medium text-blue-600 hover:underline">
            ดูทั้งหมด
          </Link>
        </div>
        {tickets.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-neutral-200 bg-white/60 px-4 py-8 text-center text-sm text-neutral-400">
            ยังไม่มีงานแจ้งซ่อม
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {tickets.slice(0, 6).map((t) => (
              <li key={t.ticketId}>
                <Link
                  href={`/admin/tickets/${t.ticketId}`}
                  className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm transition hover:border-blue-300 active:scale-[0.98]"
                >
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <p className="truncate text-sm font-semibold text-neutral-900">{t.title}</p>
                    <p className="truncate text-xs text-neutral-500">
                      {t.locationText} · {formatThaiDateTime(t.createdAt)}
                      {staleIds.has(t.ticketId) && <span className="font-medium text-red-600"> · ค้างนาน</span>}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      </Reveal>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd className="font-semibold text-neutral-900">{value}</dd>
    </div>
  );
}
