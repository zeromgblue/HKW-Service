import ExcelJS from "exceljs";
import { isAdmin } from "@/lib/admin/session";
import { listMonthTickets } from "@/lib/reports/listMonthTickets";
import {
  formatDuration,
  formatLongDate,
  formatShortDateTime,
  formatThaiMonth,
  isMonthKey,
  priorityLabels,
  repairDurationMs,
  summarize,
} from "@/lib/reports/month";
import { statusLabels } from "@/lib/tickets/statusLabels";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HEADER_FILL = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1D4ED8" } } as const;
const HEADER_FONT = { bold: true, color: { argb: "FFFFFFFF" } } as const;

function styleHeaderRow(row: ExcelJS.Row) {
  row.height = 22;
  row.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: "middle" };
  });
}

// Monthly repair report as an Excel workbook: a summary sheet plus one row per ticket.
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const monthKey = new URL(request.url).searchParams.get("month");
  if (!isMonthKey(monthKey)) return new Response("Invalid month", { status: 400 });

  const tickets = await listMonthTickets(monthKey);
  const summary = summarize(tickets);
  const monthName = formatThaiMonth(monthKey);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "HKW Service";
  workbook.created = new Date();

  const overview = workbook.addWorksheet("สรุป");
  overview.columns = [{ width: 34 }, { width: 14 }, { width: 14 }, { width: 14 }];
  overview.addRow([`รายงานสรุปงานแจ้งซ่อม ประจำเดือน${monthName}`]).font = { bold: true, size: 14 };
  overview.addRow([`ข้อมูล ณ วันที่ ${formatLongDate(new Date())}`]).font = { color: { argb: "FF6B7280" } };
  overview.addRow([]);
  overview.addRow(["งานแจ้งซ่อมทั้งหมด", summary.total]);
  overview.addRow(["ซ่อมเสร็จแล้ว", summary.completed]);
  overview.addRow(["รอดำเนินการ", summary.pending]);
  overview.addRow(["อัตราการซ่อมเสร็จ", `${summary.completionPercent}%`]);
  overview.addRow([
    "เวลาซ่อมเฉลี่ย",
    summary.averageRepairMs === null ? "-" : formatDuration(summary.averageRepairMs),
  ]);
  overview.addRow(["งานด่วน", summary.urgent]);
  overview.addRow(["งานด่วนมาก", summary.critical]);
  overview.addRow([]);
  styleHeaderRow(overview.addRow(["ประเภทงาน", "ทั้งหมด", "เสร็จแล้ว", "รอดำเนินการ"]));
  for (const c of summary.categories) overview.addRow([c.name, c.total, c.completed, c.pending]);

  const sheet = workbook.addWorksheet("รายการงาน", { views: [{ state: "frozen", ySplit: 1 }] });
  sheet.columns = [
    { header: "ลำดับ", key: "no", width: 8 },
    { header: "Ticket ID", key: "id", width: 14 },
    { header: "วันที่แจ้ง", key: "createdAt", width: 20 },
    { header: "ประเภท", key: "category", width: 26 },
    { header: "หัวข้อ", key: "title", width: 32 },
    { header: "รายละเอียด", key: "description", width: 48 },
    { header: "สถานที่", key: "location", width: 32 },
    { header: "ความเร่งด่วน", key: "priority", width: 14 },
    { header: "สถานะ", key: "status", width: 14 },
    { header: "ผู้แจ้ง", key: "reporter", width: 24 },
    { header: "เบอร์โทร", key: "phone", width: 14 },
    { header: "ช่องทางติดต่ออื่น", key: "contact", width: 22 },
    { header: "วันที่ซ่อมเสร็จ", key: "completedAt", width: 20 },
    { header: "ผู้ดำเนินการ", key: "completedBy", width: 20 },
    { header: "ระยะเวลาซ่อม", key: "duration", width: 16 },
  ];
  styleHeaderRow(sheet.getRow(1));
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };

  tickets.forEach((t, index) => {
    const duration = repairDurationMs(t);
    const row = sheet.addRow({
      no: index + 1,
      id: t.ticketId,
      createdAt: formatShortDateTime(t.createdAt),
      category: t.categoryNameSnapshot,
      title: t.title,
      description: t.description,
      location: t.locationText,
      priority: priorityLabels[t.priority],
      status: statusLabels[t.status],
      reporter: t.isAnonymous || !t.reporterName ? "ไม่ระบุชื่อ" : t.reporterName,
      phone: t.isAnonymous ? "" : (t.reporterPhone ?? ""),
      contact: t.isAnonymous ? "" : (t.reporterContact ?? ""),
      completedAt: t.completedAt ? formatShortDateTime(t.completedAt) : "",
      completedBy: t.completedBy ?? "",
      duration: duration === null ? "" : formatDuration(duration),
    });
    row.alignment = { vertical: "top", wrapText: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const thaiName = encodeURIComponent(`รายงานแจ้งซ่อม-${monthName}.xlsx`);

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="hkw-repair-report-${monthKey}.xlsx"; filename*=UTF-8''${thaiName}`,
      "Cache-Control": "no-store",
    },
  });
}
