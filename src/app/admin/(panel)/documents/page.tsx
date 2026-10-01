import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSpreadsheet, FileText } from "lucide-react";
import { requireAdmin } from "@/lib/admin/session";
import { listTickets } from "@/lib/tickets/listTickets";
import { currentMonthKey, formatThaiMonth, isMonthKey, monthKeyOf } from "@/lib/reports/month";

export default async function AdminDocumentsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();

  // The month picker below submits here; send it straight on to that month's document.
  const { month: picked } = await props.searchParams;
  if (isMonthKey(picked)) redirect(`/admin/documents/${picked}`);

  const tickets = await listTickets();
  const thisMonth = currentMonthKey();

  // Months that have tickets, newest first; the current month is always offered.
  const months = new Map<string, { total: number; completed: number }>([[thisMonth, { total: 0, completed: 0 }]]);
  for (const t of tickets) {
    const key = monthKeyOf(t.createdAt);
    const entry = months.get(key) ?? { total: 0, completed: 0 };
    entry.total++;
    if (t.status === "completed") entry.completed++;
    months.set(key, entry);
  }
  const rows = [...months.entries()].sort(([a], [b]) => b.localeCompare(a));

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-7">
      <div>
        <h1 className="text-xl font-bold text-neutral-900">เอกสาร</h1>
        <p className="text-sm text-neutral-500">รายงานสรุปงานแจ้งซ่อมประจำเดือน สำหรับพิมพ์หรือดาวน์โหลด</p>
      </div>

      <form
        method="get"
        action="/admin/documents"
        className="flex flex-col gap-2.5 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
      >
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="month" className="text-sm font-medium text-neutral-800">
            เลือกเดือนที่ต้องการ
          </label>
          <input
            id="month"
            name="month"
            type="month"
            required
            defaultValue={thisMonth}
            max={thisMonth}
            className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          เปิดเอกสารสรุป
        </button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-neutral-900">รายงานประจำเดือน</h2>
        <ul className="flex flex-col gap-2.5">
          {rows.map(([key, count]) => (
            <li
              key={key}
              className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {formatThaiMonth(key)}
                  {key === thisMonth && <span className="font-normal text-neutral-400"> · เดือนนี้</span>}
                </p>
                <p className="text-xs text-neutral-500">
                  แจ้งซ่อม {count.total} งาน · เสร็จแล้ว {count.completed} งาน
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`/admin/documents/${key}`}
                  className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
                >
                  <FileText className="h-3.5 w-3.5" strokeWidth={1.75} />
                  เอกสารสรุป
                </Link>
                <a
                  href={`/api/admin/report?month=${key}`}
                  className="flex items-center gap-1.5 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.75} />
                  Excel
                </a>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
