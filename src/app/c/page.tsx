import Link from "next/link";
import { AlertTriangle, CheckCircle2, ClipboardList, Hourglass, Inbox, Search } from "lucide-react";
import { listTickets } from "@/lib/tickets/listTickets";
import {
  countByTab,
  filterTickets,
  getStaleIds,
  parseFilters,
  type StatusTab,
} from "@/lib/tickets/filterTickets";
import { defaultCategories } from "@/data/categories";
import { TicketList } from "@/components/staff/TicketList";
import { LiveUpdates } from "@/components/staff/LiveUpdates";
import { PushSetup } from "@/components/staff/PushSetup";

export const metadata = {
  title: "เจ้าหน้าที่ | HKW Service",
  robots: { index: false, follow: false },
};

const tabs: { key: StatusTab; label: string; icon: typeof Inbox; tone: string }[] = [
  { key: "all", label: "ทั้งหมด", icon: ClipboardList, tone: "text-neutral-700 bg-neutral-100" },
  { key: "pending", label: "รอดำเนินการ", icon: Inbox, tone: "text-amber-700 bg-amber-50" },
  { key: "done", label: "เสร็จแล้ว", icon: CheckCircle2, tone: "text-emerald-700 bg-emerald-50" },
];

export default async function DashboardPage(props: PageProps<"/c">) {
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
    return qs ? `/c?${qs}` : "/c";
  };

  const selectClass =
    "rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-5 py-8">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-neutral-900">งานแจ้งซ่อมทั้งหมด</h1>
          <p className="text-sm text-neutral-500">สำหรับช่างและเจ้าหน้าที่</p>
        </div>
        <LiveUpdates />
      </header>

      <PushSetup />

      <nav aria-label="กรองตามสถานะ" className="grid grid-cols-3 gap-3">
        {tabs.map(({ key, label, icon: Icon, tone }) => {
          const active = filters.tab === key;
          return (
            <Link
              key={key}
              href={tabHref(key)}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col gap-2 rounded-2xl border p-4 shadow-sm transition ${
                active ? "border-blue-500 ring-2 ring-blue-100" : "border-neutral-200 hover:border-neutral-300"
              } bg-white`}
            >
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
                <Icon className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="text-2xl font-bold text-neutral-900">{counts[key]}</span>
              <span className="text-xs text-neutral-500">{label}</span>
            </Link>
          );
        })}
      </nav>

      {staleIds.size > 0 && (
        <p className="flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          มี {staleIds.size} งานที่ค้างเกิน 3 วันและยังไม่ได้จบงาน
        </p>
      )}

      <form method="get" action="/c" className="flex flex-col gap-2.5 sm:flex-row">
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

      {visible.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-neutral-200 bg-white/60 px-6 py-14 text-center">
          <Hourglass className="h-8 w-8 text-neutral-300" strokeWidth={1.5} />
          <p className="text-sm font-medium text-neutral-600">
            {allTickets.length === 0 ? "ยังไม่มีงานแจ้งซ่อม" : "ไม่พบงานที่ตรงกับตัวกรอง"}
          </p>
        </div>
      ) : (
        <TicketList rows={visible.map((ticket) => ({ ticket, stale: staleIds.has(ticket.ticketId) }))} />
      )}
    </main>
  );
}
