import "server-only";
import pdfmake from "pdfmake";
import type { Content, CustomTableLayout, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import { sarabunBoldBase64, sarabunRegularBase64 } from "@/lib/reports/fonts/sarabun";
import {
  formatDuration,
  formatLongDate,
  formatShortDateTime,
  formatThaiMonth,
  priorityLabels,
  summarize,
} from "@/lib/reports/month";
import { statusLabels } from "@/lib/tickets/statusLabels";
import type { Ticket } from "@/types/ticket";

const BLUE = "#1d4ed8";
const INK = "#171717";
const MUTED = "#737373";
const FAINT = "#a3a3a3";
const RULE = "#e5e5e5";
const GREEN = "#059669";
const AMBER = "#d97706";
const RED = "#b91c1c";

const MARGIN = 40;
const CONTENT_WIDTH = 595.28 - 2 * MARGIN; // A4 width in points

const LOGO_IMAGE = "logo"; // key in the document's image dictionary

// The library is a singleton; give it the fonts once per server instance. Everything it needs
// lives in its in-memory file system, so it is not allowed to touch the disk or the network.
type PdfMakeServer = typeof pdfmake & { virtualfs: { writeFileSync: (name: string, content: Buffer) => void } };
const pdf = pdfmake as PdfMakeServer;
let prepared = false;

function prepare() {
  if (prepared) return;
  pdf.virtualfs.writeFileSync("Sarabun-Regular.ttf", Buffer.from(sarabunRegularBase64, "base64"));
  pdf.virtualfs.writeFileSync("Sarabun-Bold.ttf", Buffer.from(sarabunBoldBase64, "base64"));
  pdf.setFonts({
    Sarabun: {
      normal: "Sarabun-Regular.ttf",
      bold: "Sarabun-Bold.ttf",
      italics: "Sarabun-Regular.ttf",
      bolditalics: "Sarabun-Bold.ttf",
    },
  });
  pdf.setUrlAccessPolicy(() => false);
  pdf.setLocalAccessPolicy(() => false);
  prepared = true;
}

// Thai is written without spaces, so a long phrase would never wrap inside a table cell.
// Handing the layout one piece per word gives it places to break the line.
const thaiWords = new Intl.Segmenter("th", { granularity: "word" });
function wrappable(text: string): string[] {
  return [...thaiWords.segment(text)].map((part) => part.segment);
}

const card: CustomTableLayout = {
  hLineWidth: () => 0.75,
  vLineWidth: () => 0.75,
  hLineColor: () => RULE,
  vLineColor: () => RULE,
  paddingLeft: () => 10,
  paddingRight: () => 10,
  paddingTop: () => 8,
  paddingBottom: () => 8,
};

const summaryRows: CustomTableLayout = {
  hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.5),
  vLineWidth: () => 0,
  hLineColor: (i) => (i === 1 ? "#d4d4d4" : "#f0f0f0"),
  paddingLeft: () => 0,
  paddingRight: () => 0,
  paddingTop: () => 4,
  paddingBottom: () => 4,
};

const ticketRows: CustomTableLayout = {
  hLineWidth: (i) => (i <= 1 ? 0 : 0.5),
  vLineWidth: () => 0,
  hLineColor: () => RULE,
  fillColor: (row) => (row === 0 ? BLUE : row % 2 === 0 ? "#fafafa" : null),
  paddingLeft: () => 4,
  paddingRight: () => 4,
  paddingTop: () => 3.5,
  paddingBottom: () => 3.5,
};

function sectionTitle(text: string): Content {
  return {
    columnGap: 0,
    columns: [
      { canvas: [{ type: "rect", x: 0, y: 2, w: 2.5, h: 11, color: BLUE }], width: 8 },
      { text, bold: true, fontSize: 12 },
    ],
    margin: [0, 0, 0, 6],
  };
}

function statusCell(ticket: Ticket): TableCell {
  const done = ticket.status === "completed";
  const lines: Content[] = [
    {
      columnGap: 0,
      columns: [
        {
          // Filled dot = finished, ring = still open, so the two differ without colour too.
          canvas: [
            done
              ? { type: "ellipse", x: 2.5, y: 5.8, r1: 2, r2: 2, color: GREEN }
              : { type: "ellipse", x: 2.5, y: 5.8, r1: 1.7, r2: 1.7, lineColor: AMBER, lineWidth: 0.8 },
          ],
          width: 8,
        },
        { text: statusLabels[ticket.status], bold: true, noWrap: true },
      ],
    },
  ];
  if (ticket.priority !== "normal") {
    lines.push({ text: priorityLabels[ticket.priority], bold: true, color: RED });
  }
  return { stack: lines };
}

// "1 ส.ค. 69 09:15" as two lines: the date, then the time in a quieter tone.
function dateLines(iso: string): Content[] {
  const full = formatShortDateTime(iso);
  const split = full.lastIndexOf(" ");
  return [
    { text: full.slice(0, split), noWrap: true },
    { text: `${full.slice(split + 1)} น.`, color: "#525252" },
  ];
}

function signature(role: string): Content {
  return {
    stack: [
      { text: "ลงชื่อ ............................................................" },
      { text: "( ............................................................ )", margin: [0, 6, 0, 0] },
      { text: role, bold: true, margin: [0, 4, 0, 0] },
      { text: "วันที่ ........ / ........ / ............", color: MUTED, margin: [0, 4, 0, 0] },
    ],
    alignment: "center",
  };
}

// Builds the monthly repair report as an A4 PDF. The layout mirrors the on-screen document.
export async function buildReportPdf(monthKey: string, tickets: Ticket[], logo: Buffer | null): Promise<Buffer> {
  prepare();

  const summary = summarize(tickets);
  const monthName = formatThaiMonth(monthKey);
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();

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
  const kpiGap = 9;
  const kpiWidth = (CONTENT_WIDTH - 3 * kpiGap) / 4;

  const content: Content[] = [
    {
      columnGap: 12,
      columns: [
        ...(logo ? [{ image: LOGO_IMAGE, width: 54 } as Content] : []),
        {
          width: "*",
          stack: [
            { text: "HKW Service · ระบบแจ้งซ่อมภายในโรงเรียน", fontSize: 9.5, color: MUTED },
            { text: "รายงานสรุปงานแจ้งซ่อม", fontSize: 20, bold: true, margin: [0, 1, 0, 0] },
            { text: `ประจำเดือน${monthName}`, fontSize: 13, bold: true, color: BLUE },
          ],
        },
        {
          width: "auto",
          alignment: "right",
          fontSize: 9,
          stack: [
            { text: "ช่วงข้อมูล", color: MUTED },
            { text: `1 – ${lastDay} ${monthName}`, bold: true },
            { text: "ข้อมูล ณ วันที่", color: MUTED, margin: [0, 4, 0, 0] },
            { text: formatLongDate(new Date()), bold: true },
          ],
        },
      ],
    },
    {
      canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 1.5, lineColor: BLUE }],
      margin: [0, 10, 0, 14],
    },
    {
      columnGap: kpiGap,
      columns: kpis.map((k) => ({
        width: kpiWidth,
        table: {
          widths: ["*"],
          body: [
            [
              {
                stack: [
                  { text: k.label, fontSize: 9, color: MUTED },
                  { text: k.value, fontSize: 19, bold: true, margin: [0, 1, 0, 0] },
                  { text: k.unit, fontSize: 9, color: MUTED },
                ],
              },
            ],
          ],
        },
        layout: card,
      })),
      margin: [0, 0, 0, 18],
    },
  ];

  if (summary.total === 0) {
    content.push({
      text: `ไม่มีงานแจ้งซ่อมในเดือน${monthName}`,
      alignment: "center",
      color: MUTED,
      fontSize: 12,
      margin: [0, 30, 0, 30],
    });
  } else {
    const head = (text: string, alignment: "left" | "center" = "left"): TableCell => ({
      text,
      bold: true,
      color: "#ffffff",
      alignment,
    });

    content.push(sectionTitle(`รายการงานแจ้งซ่อม (${summary.total} รายการ)`), {
      fontSize: 8.5,
      table: {
        headerRows: 1, // repeated at the top of every page
        dontBreakRows: true,
        widths: [16, 46, "*", 66, 76, 58, 60],
        body: [
          [
            head("ที่", "center"),
            head("วันที่แจ้ง"),
            head("เรื่อง / สถานที่"),
            head("ประเภท"),
            head("ผู้แจ้ง"),
            head("สถานะ"),
            head("ซ่อมเสร็จ"),
          ],
          ...tickets.map((t, index): TableCell[] => [
            { text: String(index + 1), alignment: "center", color: MUTED },
            { stack: dateLines(t.createdAt) },
            {
              stack: [
                { text: wrappable(t.title), bold: true },
                { text: wrappable(t.locationText), color: "#525252" },
                { text: t.ticketId, fontSize: 7.5, color: FAINT },
              ],
            },
            { text: wrappable(t.categoryNameSnapshot) },
            t.isAnonymous || !t.reporterName
              ? { text: "ไม่ระบุชื่อ", color: MUTED }
              : {
                  stack: [
                    { text: wrappable(t.reporterName) },
                    ...(t.reporterPhone ? [{ text: t.reporterPhone, color: "#525252" }] : []),
                  ],
                },
            statusCell(t),
            t.completedAt
              ? {
                  stack: [
                    ...dateLines(t.completedAt),
                    ...(t.completedBy ? [{ text: wrappable(t.completedBy), color: "#525252" }] : []),
                  ],
                }
              : { text: "-", color: FAINT },
          ]),
        ],
      },
      layout: ticketRows,
      margin: [0, 0, 0, 18],
    });

    const barWidth = 66;
    const boxGap = 12;
    const leftBox = (CONTENT_WIDTH - boxGap) * 0.6;
    const rightBox = CONTENT_WIDTH - boxGap - leftBox;
    const small = (text: string, alignment: "left" | "right" = "left"): TableCell => ({
      text,
      fontSize: 9,
      color: MUTED,
      alignment,
    });
    const percentOf = (value: number) => Math.round((value / summary.total) * 100);

    const priorities = [
      { label: priorityLabels.normal, value: summary.total - summary.urgent - summary.critical },
      { label: priorityLabels.urgent, value: summary.urgent },
      { label: priorityLabels.critical, value: summary.critical },
    ];

    content.push({
      unbreakable: true,
      columnGap: boxGap,
      columns: [
        {
          width: leftBox,
          table: {
            widths: ["*"],
            body: [
              [
                {
                  stack: [
                    sectionTitle("สรุปตามประเภทงาน"),
                    {
                      table: {
                        widths: ["*", barWidth, 28, 32, 24, 20],
                        body: [
                          [small("ประเภท"), small("สัดส่วน"), small(""), small("ทั้งหมด", "right"), small("เสร็จ", "right"), small("ค้าง", "right")],
                          ...summary.categories.map((c): TableCell[] => {
                            const percent = percentOf(c.total);
                            return [
                              { text: wrappable(c.name) },
                              {
                                // The gray track is 100% of the month, so the bar reads as a share.
                                canvas: [
                                  { type: "rect", x: 0, y: 5, w: barWidth, h: 4, r: 2, color: "#ededed" },
                                  { type: "rect", x: 0, y: 5, w: Math.max(4, (barWidth * percent) / 100), h: 4, r: 2, color: "#2563eb" },
                                ],
                              },
                              { text: `${percent}%`, alignment: "right", noWrap: true },
                              { text: String(c.total), alignment: "right", bold: true },
                              { text: String(c.completed), alignment: "right" },
                              { text: String(c.pending), alignment: "right" },
                            ];
                          }),
                        ],
                      },
                      layout: summaryRows,
                    },
                  ],
                },
              ],
            ],
          },
          layout: card,
        },
        {
          width: rightBox,
          table: {
            widths: ["*"],
            body: [
              [
                {
                  stack: [
                    sectionTitle("สรุปตามความเร่งด่วน"),
                    {
                      table: {
                        widths: ["*", 40, 40],
                        body: [
                          [small("ระดับ"), small("จำนวน", "right"), small("สัดส่วน", "right")],
                          ...priorities.map((p): TableCell[] => [
                            { text: p.label },
                            { text: String(p.value), alignment: "right", bold: true },
                            { text: `${percentOf(p.value)}%`, alignment: "right" },
                          ]),
                        ],
                      },
                      layout: summaryRows,
                    },
                  ],
                },
              ],
            ],
          },
          layout: card,
        },
      ],
    });
  }

  content.push({
    unbreakable: true,
    columns: [signature("ผู้จัดทำรายงาน"), signature("ผู้รับรองรายงาน")],
    margin: [0, 44, 0, 0],
  });

  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [MARGIN, MARGIN, MARGIN, 48],
    info: { title: `รายงานแจ้งซ่อม ${monthName}`, author: "HKW Service" },
    images: logo ? { [LOGO_IMAGE]: `data:image/png;base64,${logo.toString("base64")}` } : undefined,
    defaultStyle: { font: "Sarabun", fontSize: 10, color: INK, lineHeight: 1.05 },
    footer: (currentPage, pageCount) => ({
      margin: [MARGIN, 14, MARGIN, 0],
      fontSize: 8.5,
      color: FAINT,
      columns: [
        { text: "เอกสารนี้จัดทำโดยระบบ HKW Service · นับงานตามวันที่แจ้งซ่อม" },
        { text: `หน้า ${currentPage} / ${pageCount}`, alignment: "right", width: "auto" },
      ],
    }),
    content,
  };

  return pdf.createPdf(definition).getBuffer();
}
