import Link from "next/link";
import { ChevronRight, Hourglass, Search } from "lucide-react";
import { requireAdmin } from "@/lib/admin/session";
import { listTickets } from "@/lib/tickets/listTickets";
import {
  countByTab,
  filterTickets,
  getStaleIds,
  parseFilters,
  type StatusTab,
} from "@/lib/tickets/filterTickets";
import { defaultCategories } from "@/data/categories";
import { formatShortDateTime } from "@/lib/reports/month";
import { PriorityBadge, StatusBadge } from "@/components/tickets/Badges";
import { Reveal } from "@/components/ui/Reveal";

const tabs: { key: StatusTab; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "pending", label: "รอดำเนินการ" },
  { key: "done", label: "เสร็จแล้ว" },
];

export default async function AdminTicketsPage(props: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();

  const filters = parseFilters(await props.searchParams);
  const allTickets = await listTickets();
  const counts = countByTab(allTickets);
  const visible = filterTickets(allTickets, filters);
  const staleIds = getStaleIds(allTickets);

  const tabHref = (tab: StatusTab) => {
    const p = new URLSearchParams();
    if (tab !== "all") p.set("tab", tab);
    if (filters.q) p.set("q", filters.q);
    if (filters.category) p.set("category", filters.category);
    if (filters.priority) p.set("priority", filters.priority);
    const qs = p.toString();
    return qs ? `/admin/tickets?${qs}` : "/admin/tickets";
  };

  const selectClass =
    "rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100";

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-5 px-4 py-6 sm:px-5 sm:py-7">
      <Reveal>
        <h1 className="text-xl font-bold text-neutral-900">งานแจ้งซ่อมทั้งหมด</h1>
        <p className="text-sm text-neutral-500">ดูข้อมูลผู้แจ้ง สถานะ และจัดการงานได้ทุกรายการ</p>
      </Reveal>

      <Reveal index={1} className="flex flex-col gap-5">

      <nav aria-label="กรองตามสถานะ" className="flex gap-2 overflow-x-auto">
        {tabs.map(({ key, label }) => {
          const active = filters.tab === key;
          return (
            <Link
              key={key}
              href={tabHref(key)}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 text-sm font-medium transition-[color,background-color,border-color,transform] active:scale-95 ${
                active
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {label}
              <span className="tabular-nums text-xs text-neutral-400">{counts[key]}</span>
            </Link>
          );
        })}
      </nav>

      <form method="get" action="/admin/tickets" className="flex flex-col gap-2.5 sm:flex-row">
        {filters.tab !== "all" && <input type="hidden" name="tab" value={filters.tab} />}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            name="q"
            defaultValue={filters.q}
            placeholder="ค้นหา Ticket ID / หัวข้อ / สถานที่"
            className="w-full rounded-xl border border-neutral-200 bg-white py-2.5 pl-10 pr-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100"
          />
        </div>
        <select name="category" defaultValue={filters.category} className={selectClass} aria-label="ประเภท">
          <option value="">ทุกประเภท</option>
          {defaultCategories.map((c) => (
            <option key={c.categoryId} value={c.categoryId}>
              {c.name}
            </option>
          ))}
        </select>
        <select name="priority" defaultValue={filters.priority} className={selectClass} aria-label="ความเร่งด่วน">
          <option value="">ทุกระดับ</option>
          <option value="normal">ปกติ</option>
          <option value="urgent">ด่วน</option>
          <option value="critical">ด่วนมาก</option>
        </select>
        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          กรอง
        </button>
      </form>
      </Reveal>

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-neutral-200 bg-white/60 px-6 py-14 text-center">
          <Hourglass className="h-8 w-8 text-neutral-300" strokeWidth={1.5} />
          <p className="text-sm font-medium text-neutral-600">
            {allTickets.length === 0 ? "ยังไม่มีงานแจ้งซ่อม" : "ไม่พบงานที่ตรงกับตัวกรอง"}
          </p>
        </div>
      ) : (
        <Reveal index={2}>
        <ul className="flex flex-col gap-2.5 md:hidden">
          {visible.map((t) => (
            <li key={t.ticketId}>
              <Link
                href={`/admin/tickets/${t.ticketId}`}
                className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-white p-3.5 shadow-sm transition active:scale-[0.98] active:border-blue-300"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <p className="truncate text-sm font-semibold text-neutral-900">{t.title}</p>
                  <p className="truncate text-xs text-neutral-500">{t.locationText}</p>
                  <p className="truncate text-xs text-neutral-500">
                    {t.isAnonymous || !t.reporterName
                      ? "ไม่ระบุชื่อ"
                      : [t.reporterName, t.reporterPhone].filter(Boolean).join(" · ")}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <StatusBadge status={t.status} />
                    <PriorityBadge priority={t.priority} />
                    <span className="text-[11px] text-neutral-400">
                      {formatShortDateTime(t.createdAt)}
                      {staleIds.has(t.ticketId) && <span className="font-medium text-red-600"> · ค้างนาน</span>}
                    </span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-neutral-300" />
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm md:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium">วันที่แจ้ง</th>
                <th className="px-4 py-3 font-medium">เรื่อง</th>
                <th className="px-4 py-3 font-medium">ประเภท</th>
                <th className="px-4 py-3 font-medium">ผู้แจ้ง</th>
                <th className="px-4 py-3 font-medium">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {visible.map((t) => (
                <tr key={t.ticketId} className="align-top transition-colors hover:bg-blue-50/40">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-neutral-500">
                    {formatShortDateTime(t.createdAt)}
                    {staleIds.has(t.ticketId) && <p className="font-medium text-red-600">ค้างนาน</p>}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/tickets/${t.ticketId}`} className="font-semibold text-neutral-900 hover:text-blue-600">
                      {t.title}
                    </Link>
                    <p className="text-xs text-neutral-500">{t.locationText}</p>
                    <p className="text-xs text-neutral-400">{t.ticketId}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">{t.categoryNameSnapshot}</td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {t.isAnonymous || !t.reporterName ? (
                      "ไม่ระบุชื่อ"
                    ) : (
                      <>
                        <p className="text-neutral-800">{t.reporterName}</p>
                        {t.reporterPhone && <p className="tabular-nums">{t.reporterPhone}</p>}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1.5">
                      <StatusBadge status={t.status} />
                      <PriorityBadge priority={t.priority} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </Reveal>
      )}
    </main>
  );
}
