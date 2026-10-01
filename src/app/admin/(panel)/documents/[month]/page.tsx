import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, ChevronRight, FileSpreadsheet } from "lucide-react";
import { requireAdmin } from "@/lib/admin/session";
import { listMonthTickets } from "@/lib/reports/listMonthTickets";
import {
  currentMonthKey,
  formatDuration,
  formatLongDate,
  formatShortDateTime,
  formatThaiMonth,
  isMonthKey,
  priorityLabels,
  summarize,
} from "@/lib/reports/month";
import { statusLabels } from "@/lib/tickets/statusLabels";
import { BackLink } from "@/components/ui/BackLink";
import { PrintButton } from "@/components/admin/PrintButton";

function shiftMonth(monthKey: string, by: number): string {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1 + by, 1)).toISOString().slice(0, 7);
}

export async function generateMetadata(props: { params: Promise<{ month: string }> }) {
  const { month } = await props.params;
  // The browser uses the page title as the default PDF file name.
  return { title: isMonthKey(month) ? `รายงานแจ้งซ่อม ${formatThaiMonth(month)}` : "รายงานแจ้งซ่อม" };
}

export default async function MonthlyReportPage(props: { params: Promise<{ month: string }> }) {
  await requireAdmin();

  const { month: monthKey } = await props.params;
  if (!isMonthKey(monthKey)) notFound();

  const tickets = await listMonthTickets(monthKey);
  const summary = summarize(tickets);
  const monthName = formatThaiMonth(monthKey);
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const maxCategory = Math.max(1, ...summary.categories.map((c) => c.total));
  const nextKey = shiftMonth(monthKey, 1);

  const kpis = [
    { label: "งานแจ้งซ่อมทั้งหมด", value: String(summary.total), unit: "งาน" },
    { label: "ซ่อมเสร็จแล้ว", value: String(summary.completed), unit: `งาน · ${summary.completionPercent}%` },
    { label: "รอดำเนินการ", value: String(summary.pending), unit: "งาน" },
    {
      label: "เวลาซ่อมเฉลี่ย",
      value: summary.averageRepairMs === null ? "-" : formatDuration(summary.averageRepairMs),
      unit: "ต่องานที่เสร็จ",
    },
  ];

  return (
    <main className="flex flex-1 flex-col items-center gap-4 px-4 py-6 print:block print:p-0">
      <div className="flex w-full max-w-[210mm] flex-col gap-3 print:hidden">
        <BackLink href="/admin/documents" label="กลับหน้าเอกสาร" />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <Link
              href={`/admin/documents/${shiftMonth(monthKey, -1)}`}
              aria-label="เดือนก่อนหน้า"
              className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 shadow-sm hover:bg-neutral-50"
            >
              <ChevronLeft className="h-4 w-4" />
            </Link>
            <span className="min-w-36 text-center text-sm font-semibold text-neutral-900">{monthName}</span>
            {nextKey <= currentMonthKey() ? (
              <Link
                href={`/admin/documents/${nextKey}`}
                aria-label="เดือนถัดไป"
                className="rounded-xl border border-neutral-200 bg-white p-2 text-neutral-600 shadow-sm hover:bg-neutral-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Link>
            ) : (
              <span className="rounded-xl border border-neutral-100 p-2 text-neutral-300">
                <ChevronRight className="h-4 w-4" />
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`/api/admin/report?month=${monthKey}`}
              className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" strokeWidth={1.75} />
              ดาวน์โหลด Excel
            </a>
            <PrintButton />
          </div>
        </div>
      </div>

      {/* On a phone the A4 sheet is wider than the screen, so it scrolls sideways. */}
      <div className="w-full overflow-x-auto pb-4 print:overflow-visible print:pb-0">
        <article className="report-sheet mx-auto flex min-h-[297mm] w-[210mm] flex-col gap-5 bg-white p-[14mm] text-neutral-900 shadow-lg ring-1 ring-neutral-200 print:min-h-0 print:w-auto print:p-0 print:shadow-none print:ring-0">
          <header className="flex items-center gap-4 border-b-2 border-blue-700 pb-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- a plain img always prints */}
            <img src="/school-logo.png" alt="โลโก้โรงเรียน" className="h-[72px] w-[72px] shrink-0 object-contain" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-neutral-500">HKW Service · ระบบแจ้งซ่อมภายในโรงเรียน</p>
              <h1 className="text-[21px] font-bold leading-tight">รายงานสรุปงานแจ้งซ่อม</h1>
              <p className="text-[14px] font-semibold text-blue-700">ประจำเดือน{monthName}</p>
            </div>
            <dl className="shrink-0 text-right text-[10px] leading-relaxed text-neutral-500">
              <dt>ช่วงข้อมูล</dt>
              <dd className="font-medium text-neutral-800">
                1 – {lastDay} {monthName}
              </dd>
              <dt className="mt-1">ข้อมูล ณ วันที่</dt>
              <dd className="font-medium text-neutral-800">{formatLongDate(new Date())}</dd>
            </dl>
          </header>

          <section aria-label="ตัวเลขสรุป" className="grid grid-cols-4 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-lg border border-neutral-200 px-3.5 py-3">
                <p className="text-[10px] text-neutral-500">{k.label}</p>
                <p className="mt-0.5 text-[22px] font-bold leading-tight tabular-nums">{k.value}</p>
                <p className="text-[10px] text-neutral-500">{k.unit}</p>
              </div>
            ))}
          </section>

          {summary.total === 0 ? (
            <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-10 text-center text-[13px] text-neutral-500">
              ไม่มีงานแจ้งซ่อมในเดือน{monthName}
            </p>
          ) : (
            <>
              <div className="report-avoid-break grid grid-cols-3 gap-5">
                <section className="col-span-2">
                  <SectionTitle>สรุปตามประเภทงาน</SectionTitle>
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-neutral-300 text-left text-[10px] text-neutral-500">
                        <th className="py-1.5 pr-2 font-medium">ประเภท</th>
                        <th className="w-[34%] py-1.5 font-medium" aria-label="สัดส่วน" />
                        <th className="py-1.5 pl-2 text-right font-medium">ทั้งหมด</th>
                        <th className="py-1.5 pl-2 text-right font-medium">เสร็จ</th>
                        <th className="py-1.5 pl-2 text-right font-medium">ค้าง</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.categories.map((c) => (
                        <tr key={c.categoryId} className="border-b border-neutral-100">
                          <td className="py-1.5 pr-2">{c.name}</td>
                          <td className="py-1.5">
                            <div
                              className="h-2 rounded-r bg-blue-600"
                              style={{ width: `${Math.max(3, (c.total / maxCategory) * 100)}%` }}
                            />
                          </td>
                          <td className="py-1.5 pl-2 text-right font-semibold tabular-nums">{c.total}</td>
                          <td className="py-1.5 pl-2 text-right tabular-nums">{c.completed}</td>
                          <td className="py-1.5 pl-2 text-right tabular-nums">{c.pending}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </section>

                <section>
                  <SectionTitle>สรุปตามความเร่งด่วน</SectionTitle>
                  <dl className="text-[11px]">
                    <SummaryLine label={priorityLabels.normal} value={summary.total - summary.urgent - summary.critical} />
                    <SummaryLine label={priorityLabels.urgent} value={summary.urgent} />
                    <SummaryLine label={priorityLabels.critical} value={summary.critical} />
                  </dl>
                </section>
              </div>

              <section>
                <SectionTitle>รายการงานแจ้งซ่อม ({summary.total} รายการ)</SectionTitle>
                <table className="w-full table-fixed text-[10px] leading-snug">
                  <thead>
                    <tr className="bg-blue-700 text-left text-white">
                      <th className="w-[5%] px-1.5 py-1.5 text-center font-medium">ที่</th>
                      <th className="w-[13%] px-1.5 py-1.5 font-medium">วันที่แจ้ง</th>
                      <th className="w-[27%] px-1.5 py-1.5 font-medium">เรื่อง / สถานที่</th>
                      <th className="w-[14%] px-1.5 py-1.5 font-medium">ประเภท</th>
                      <th className="w-[15%] px-1.5 py-1.5 font-medium">ผู้แจ้ง</th>
                      <th className="w-[13%] px-1.5 py-1.5 font-medium">สถานะ</th>
                      <th className="w-[13%] px-1.5 py-1.5 font-medium">ซ่อมเสร็จ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((t, index) => {
                      const done = t.status === "completed";
                      return (
                        <tr key={t.ticketId} className="border-b border-neutral-200 align-top even:bg-neutral-50">
                          <td className="px-1.5 py-1.5 text-center tabular-nums text-neutral-500">{index + 1}</td>
                          <td className="px-1.5 py-1.5">{formatShortDateTime(t.createdAt)}</td>
                          <td className="break-words px-1.5 py-1.5">
                            <p className="font-semibold">{t.title}</p>
                            <p className="text-neutral-600">{t.locationText}</p>
                            <p className="text-[9px] text-neutral-400">{t.ticketId}</p>
                          </td>
                          <td className="break-words px-1.5 py-1.5">{t.categoryNameSnapshot}</td>
                          <td className="break-words px-1.5 py-1.5">
                            {t.isAnonymous || !t.reporterName ? (
                              <span className="text-neutral-500">ไม่ระบุชื่อ</span>
                            ) : (
                              <>
                                <p>{t.reporterName}</p>
                                {t.reporterPhone && <p className="tabular-nums text-neutral-600">{t.reporterPhone}</p>}
                              </>
                            )}
                          </td>
                          <td className="px-1.5 py-1.5">
                            <p className="flex items-center gap-1 whitespace-nowrap font-medium">
                              <span
                                aria-hidden="true"
                                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                  done ? "bg-emerald-600" : "ring-1 ring-inset ring-amber-600"
                                }`}
                              />
                              {statusLabels[t.status]}
                            </p>
                            {t.priority !== "normal" && (
                              <p className="font-semibold text-red-700">{priorityLabels[t.priority]}</p>
                            )}
                          </td>
                          <td className="break-words px-1.5 py-1.5">
                            {t.completedAt ? (
                              <>
                                <p>{formatShortDateTime(t.completedAt)}</p>
                                {t.completedBy && <p className="text-neutral-600">{t.completedBy}</p>}
                              </>
                            ) : (
                              <span className="text-neutral-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
            </>
          )}

          <section className="report-avoid-break mt-auto grid grid-cols-2 gap-10 pt-8 text-[11px]">
            <Signature role="ผู้จัดทำรายงาน" />
            <Signature role="ผู้รับรองรายงาน" />
          </section>

          <footer className="border-t border-neutral-200 pt-2 text-center text-[9px] text-neutral-400">
            เอกสารนี้จัดทำโดยระบบ HKW Service · นับงานตามวันที่แจ้งซ่อม
          </footer>
        </article>
      </div>
    </main>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 border-l-[3px] border-blue-700 pl-2 text-[13px] font-bold leading-tight">{children}</h2>
  );
}

function SummaryLine({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-neutral-100 py-1.5">
      <dt>{label}</dt>
      <dd className="font-semibold tabular-nums">{value} งาน</dd>
    </div>
  );
}

function Signature({ role }: { role: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5 text-center">
      <p>ลงชื่อ ........................................................</p>
      <p>( ........................................................ )</p>
      <p className="font-medium">{role}</p>
      <p className="text-neutral-500">วันที่ ........ / ........ / ............</p>
    </div>
  );
}
