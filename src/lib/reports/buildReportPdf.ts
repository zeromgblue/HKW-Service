import "server-only";
import pdfmake from "pdfmake";
import type { Content, CustomTableLayout, TableCell, TDocumentDefinitions } from "pdfmake/interfaces";
import {
  notoSansThaiBoldBase64,
  notoSansThaiMediumBase64,
  notoSansThaiRegularBase64,
  notoSansThaiSemiBoldBase64,
} from "@/lib/reports/fonts/notoSansThai";
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

// This file redraws the on-screen report (documents/[month]/page.tsx) as a PDF, and is meant
// to look the same. The page is designed in CSS pixels on a 210mm sheet; PDFs use points.
const px = (value: number) => value * 0.75;

const BLUE_700 = "#1d4ed8";
const BLUE_600 = "#2563eb";
const INK = "#171717"; // neutral-900
const N800 = "#262626";
const N600 = "#525252";
const N500 = "#737373";
const N400 = "#a3a3a3";
const N300 = "#d4d4d4";
const N200 = "#e5e5e5";
const N100 = "#f5f5f5";
const N50 = "#fafafa";
const EMERALD = "#059669";
const AMBER = "#d97706";
const RED_700 = "#b91c1c";

const MARGIN = (14 / 25.4) * 72; // the sheet's 14mm padding
const CONTENT_WIDTH = 595.28 - 2 * MARGIN;
const PAGE_HEIGHT = 841.89;
const BOTTOM_MARGIN = MARGIN + px(22); // leaves room for the footer line and note
const LOGO_IMAGE = "logo"; // key in the document's image dictionary

// The font's own line is 1.511em tall; CSS line-heights are expressed against that.
const NATURAL_LINE = 1.511;
const leading = (cssLineHeight: number) => cssLineHeight / NATURAL_LINE;
const lineHeightOf = (fontSize: number, cssLineHeight: number) => fontSize * cssLineHeight;

const REGULAR = "Noto"; // 400, bold = 700
const MEDIUM = "NotoMedium"; // 500, bold = 600

// The library is a singleton; give it the fonts once per server instance. Everything it needs
// lives in its in-memory file system, so it is not allowed to touch the disk or the network.
type PdfMakeServer = typeof pdfmake & { virtualfs: { writeFileSync: (name: string, content: Buffer) => void } };
const pdf = pdfmake as PdfMakeServer;
let prepared = false;

function prepare() {
  if (prepared) return;
  const fonts: Record<string, string> = {
    "NotoSansThai-Regular.ttf": notoSansThaiRegularBase64,
    "NotoSansThai-Medium.ttf": notoSansThaiMediumBase64,
    "NotoSansThai-SemiBold.ttf": notoSansThaiSemiBoldBase64,
    "NotoSansThai-Bold.ttf": notoSansThaiBoldBase64,
  };
  for (const [name, data] of Object.entries(fonts)) pdf.virtualfs.writeFileSync(name, Buffer.from(data, "base64"));
  pdf.setFonts({
    [REGULAR]: {
      normal: "NotoSansThai-Regular.ttf",
      bold: "NotoSansThai-Bold.ttf",
      italics: "NotoSansThai-Regular.ttf",
      bolditalics: "NotoSansThai-Bold.ttf",
    },
    [MEDIUM]: {
      normal: "NotoSansThai-Medium.ttf",
      bold: "NotoSansThai-SemiBold.ttf",
      italics: "NotoSansThai-Medium.ttf",
      bolditalics: "NotoSansThai-SemiBold.ttf",
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

// A bordered card with rounded corners. Tables cannot round their corners, so the outline is
// drawn first and the content is pulled back up over it. The layout cursor then sits at the end
// of the content rather than at the bottom of the outline; `boxBottomGap` is what is left to
// skip, given the content's height (known from the fixed type sizes).
function roundedBox(width: number, height: number, padding: number, inner: Content[]): Content {
  const box = {
    width,
    stack: [
      {
        canvas: [
          { type: "rect", x: 0.375, y: 0.375, w: width - 0.75, h: height - 0.75, r: px(8), lineWidth: 0.75, lineColor: N200 },
        ],
      },
      { stack: inner, margin: [padding, padding - height, padding, 0] },
    ],
  };
  return box as Content;
}
const boxBottomGap = (height: number, padding: number, innerHeight: number) => height - padding - innerHeight;

const SECTION_TITLE_SIZE = px(13);
const SECTION_TITLE_HEIGHT = lineHeightOf(SECTION_TITLE_SIZE, 1.25) + px(8);

function sectionTitle(text: string): Content {
  const height = lineHeightOf(SECTION_TITLE_SIZE, 1.25);
  return {
    columnGap: 0,
    columns: [
      { canvas: [{ type: "rect", x: 0, y: 0, w: px(3), h: height, color: BLUE_700 }], width: px(3) + px(8) },
      { text, bold: true, fontSize: SECTION_TITLE_SIZE, lineHeight: leading(1.25) },
    ],
    margin: [0, 0, 0, px(8)],
  };
}

// The small tables inside the two summary cards.
const SUMMARY_SIZE = px(11);
const SUMMARY_HEAD_SIZE = px(10);
const SUMMARY_PAD = px(6);
const SUMMARY_ROW_HEIGHT = lineHeightOf(SUMMARY_SIZE, 1.5) + 2 * SUMMARY_PAD + 0.75;
const SUMMARY_HEAD_HEIGHT = lineHeightOf(SUMMARY_HEAD_SIZE, 1.5) + 2 * SUMMARY_PAD + 0.75;

const summaryLayout: CustomTableLayout = {
  hLineWidth: (i, node) => (i === 0 || i === node.table.body.length ? 0 : 0.75),
  vLineWidth: () => 0,
  hLineColor: (i) => (i === 1 ? N300 : N100),
  paddingLeft: () => 0,
  paddingRight: () => 0,
  paddingTop: () => SUMMARY_PAD,
  paddingBottom: () => SUMMARY_PAD,
};

const TICKET_PAD = px(6);
const ticketLayout: CustomTableLayout = {
  hLineWidth: (i) => (i <= 1 ? 0 : 0.75),
  vLineWidth: () => 0,
  hLineColor: () => N200,
  // Row 0 is the header; every second ticket gets the faint tint, as on screen.
  fillColor: (row) => (row === 0 ? BLUE_700 : row % 2 === 0 ? N50 : null),
  paddingLeft: () => TICKET_PAD,
  paddingRight: () => TICKET_PAD,
  paddingTop: () => TICKET_PAD,
  paddingBottom: () => TICKET_PAD,
};

function statusCell(ticket: Ticket, fontSize: number): TableCell {
  const done = ticket.status === "completed";
  const middle = lineHeightOf(fontSize, 1.375) / 2;
  const radius = px(3);
  const lines: Content[] = [
    {
      columnGap: 0,
      columns: [
        {
          // Filled dot = finished, ring = still open, so the two differ without colour too.
          canvas: [
            done
              ? { type: "ellipse", x: radius, y: middle, r1: radius, r2: radius, color: EMERALD }
              : { type: "ellipse", x: radius, y: middle, r1: radius - 0.4, r2: radius - 0.4, lineColor: AMBER, lineWidth: 0.75 },
          ],
          width: 2 * radius + px(4),
        },
        { text: statusLabels[ticket.status], font: MEDIUM, noWrap: true },
      ],
    },
  ];
  if (ticket.priority !== "normal") {
    lines.push({ text: priorityLabels[ticket.priority], font: MEDIUM, bold: true, color: RED_700 });
  }
  return { stack: lines };
}

const SIGNATURE_SIZE = px(11);
const SIGNATURE_LINE_GAP = px(6);
const SIGNATURE_HEIGHT = 4 * lineHeightOf(SIGNATURE_SIZE, 1.5) + 3 * SIGNATURE_LINE_GAP;

function signature(role: string, width: number): Content {
  const gap = SIGNATURE_LINE_GAP;
  const block = {
    width,
    alignment: "center",
    fontSize: SIGNATURE_SIZE,
    stack: [
      { text: "ลงชื่อ ........................................................" },
      { text: "( ........................................................ )", margin: [0, gap, 0, 0] },
      { text: role, font: MEDIUM, margin: [0, gap, 0, 0] },
      { text: "วันที่ ........ / ........ / ............", color: N500, margin: [0, gap, 0, 0] },
    ],
  };
  return block as Content;
}

// Builds the monthly repair report as an A4 PDF that matches the on-screen document.
export async function buildReportPdf(monthKey: string, tickets: Ticket[], logo: Buffer | null): Promise<Buffer> {
  prepare();

  const summary = summarize(tickets);
  const monthName = formatThaiMonth(monthKey);
  const [year, month] = monthKey.split("-").map(Number);
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const sectionGap = px(24);

  // ---- header -----------------------------------------------------------------------------
  const logoSize = px(72);
  const metaSize = px(10);
  const titleBlockHeight = lineHeightOf(px(11), 1.5) + lineHeightOf(px(21), 1.25) + lineHeightOf(px(14), 1.5);
  const metaBlockHeight = 4 * lineHeightOf(metaSize, 1.625) + px(4);
  const centre = (blockHeight: number) => Math.max(0, (logoSize - blockHeight) / 2);

  const content: Content[] = [
    {
      columnGap: px(16),
      columns: [
        ...(logo ? [{ image: LOGO_IMAGE, width: logoSize, height: logoSize } as Content] : []),
        {
          width: "*",
          margin: [0, centre(titleBlockHeight), 0, 0],
          stack: [
            { text: "HKW Service · ระบบแจ้งซ่อมภายในโรงเรียน", fontSize: px(11), color: N500 },
            { text: "รายงานสรุปงานแจ้งซ่อม", fontSize: px(21), bold: true, lineHeight: leading(1.25) },
            { text: `ประจำเดือน${monthName}`, font: MEDIUM, bold: true, fontSize: px(14), color: BLUE_700 },
          ],
        },
        {
          width: "auto",
          alignment: "right",
          fontSize: metaSize,
          lineHeight: leading(1.625),
          margin: [0, centre(metaBlockHeight), 0, 0],
          stack: [
            { text: "ช่วงข้อมูล", color: N500 },
            { text: `1 – ${lastDay} ${monthName}`, font: MEDIUM, color: N800 },
            { text: "ข้อมูล ณ วันที่", color: N500, margin: [0, px(4), 0, 0] },
            { text: formatLongDate(new Date()), font: MEDIUM, color: N800 },
          ],
        },
      ],
    },
    {
      canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: px(2), lineColor: BLUE_700 }],
      margin: [0, px(16), 0, sectionGap],
    },
  ];

  // ---- headline numbers -------------------------------------------------------------------
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
  const kpiGap = px(12);
  const kpiWidth = (CONTENT_WIDTH - 3 * kpiGap) / 4;
  const kpiPad = px(13);
  const kpiInner = 2 * lineHeightOf(px(10), 1.5) + px(2) + lineHeightOf(px(22), 1.25);
  const kpiHeight = kpiInner + 2 * kpiPad;

  content.push({
    columnGap: kpiGap,
    columns: kpis.map((k) =>
      roundedBox(kpiWidth, kpiHeight, kpiPad, [
        { text: k.label, fontSize: px(10), color: N500 },
        { text: k.value, fontSize: px(22), bold: true, lineHeight: leading(1.25), margin: [0, px(2), 0, 0] },
        { text: k.unit, fontSize: px(10), color: N500 },
      ]),
    ),
    margin: [0, 0, 0, boxBottomGap(kpiHeight, kpiPad, kpiInner) + sectionGap],
  });

  if (summary.total === 0) {
    content.push({
      text: `ไม่มีงานแจ้งซ่อมในเดือน${monthName}`,
      alignment: "center",
      color: N500,
      fontSize: px(13),
      margin: [0, px(40), 0, px(40)],
    });
  } else {
    // ---- ticket table ---------------------------------------------------------------------
    const ticketSize = px(10);
    const head = (text: string, alignment: "left" | "center" = "left"): TableCell => ({
      text,
      font: MEDIUM,
      color: "#ffffff",
      alignment,
    });
    // Same proportions as the on-screen table (5/13/27/14/15/13/13%), minus the cell padding.
    const column = (percent: number) => (CONTENT_WIDTH * percent) / 100 - 2 * TICKET_PAD;

    content.push(sectionTitle(`รายการงานแจ้งซ่อม (${summary.total} รายการ)`), {
      fontSize: ticketSize,
      lineHeight: leading(1.375),
      table: {
        headerRows: 1, // repeated at the top of every page
        dontBreakRows: true,
        widths: [column(5), column(13), "*", column(14), column(15), column(13), column(13)],
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
            { text: String(index + 1), alignment: "center", color: N500 },
            { text: formatShortDateTime(t.createdAt) },
            {
              stack: [
                { text: wrappable(t.title), font: MEDIUM, bold: true },
                { text: wrappable(t.locationText), color: N600 },
                { text: t.ticketId, fontSize: px(9), color: N400 },
              ],
            },
            { text: wrappable(t.categoryNameSnapshot) },
            t.isAnonymous || !t.reporterName
              ? { text: "ไม่ระบุชื่อ", color: N500 }
              : {
                  stack: [
                    { text: wrappable(t.reporterName) },
                    ...(t.reporterPhone ? [{ text: t.reporterPhone, color: N600 }] : []),
                  ],
                },
            statusCell(t, ticketSize),
            t.completedAt
              ? {
                  stack: [
                    { text: formatShortDateTime(t.completedAt) },
                    ...(t.completedBy ? [{ text: wrappable(t.completedBy), color: N600 }] : []),
                  ],
                }
              : { text: "-", color: N400 },
          ]),
        ],
      },
      layout: ticketLayout,
      margin: [0, 0, 0, sectionGap],
    });

    // ---- the two summary cards ------------------------------------------------------------
    const boxGap = px(16);
    const unit = (CONTENT_WIDTH - 4 * boxGap) / 5; // a 5-column grid: 3 + 2
    const leftWidth = 3 * unit + 2 * boxGap;
    const rightWidth = 2 * unit + boxGap;
    const boxPad = px(16);
    const priorities = [
      { label: priorityLabels.normal, value: summary.total - summary.urgent - summary.critical },
      { label: priorityLabels.urgent, value: summary.urgent },
      { label: priorityLabels.critical, value: summary.critical },
    ];
    // Both cards are as tall as the one with more rows.
    const rows = Math.max(summary.categories.length, priorities.length);
    const boxInner = SECTION_TITLE_HEIGHT + SUMMARY_HEAD_HEIGHT + rows * SUMMARY_ROW_HEIGHT - 0.75;
    const boxHeight = boxInner + 2 * boxPad;

    const small = (text: string, alignment: "left" | "right" = "left"): TableCell => ({
      text,
      fontSize: SUMMARY_HEAD_SIZE,
      color: N500,
      font: MEDIUM,
      alignment,
    });
    const percentOf = (value: number) => Math.round((value / summary.total) * 100);
    const barWidth = px(84);
    const barHeight = px(6);
    const barTop = (lineHeightOf(SUMMARY_SIZE, 1.5) - barHeight) / 2;

    content.push({
      unbreakable: true,
      columnGap: boxGap,
      columns: [
        roundedBox(leftWidth, boxHeight, boxPad, [
          sectionTitle("สรุปตามประเภทงาน"),
          {
            fontSize: SUMMARY_SIZE,
            table: {
              widths: ["*", barWidth, px(40), px(46), px(36), px(32)],
              body: [
                [small("ประเภท"), small("สัดส่วน"), small(""), small("ทั้งหมด", "right"), small("เสร็จ", "right"), small("ค้าง", "right")],
                ...summary.categories.map((c): TableCell[] => {
                  const percent = percentOf(c.total);
                  return [
                    // Kept on one line: the card's height is worked out from one line per row.
                    { text: c.name, noWrap: true },
                    {
                      // The gray track is 100% of the month, so the bar reads as a share.
                      canvas: [
                        { type: "rect", x: 0, y: barTop, w: barWidth, h: barHeight, r: barHeight / 2, color: N100 },
                        {
                          type: "rect",
                          x: 0,
                          y: barTop,
                          w: Math.max(barHeight, (barWidth * percent) / 100),
                          h: barHeight,
                          r: barHeight / 2,
                          color: BLUE_600,
                        },
                      ],
                    },
                    { text: `${percent}%`, alignment: "right", noWrap: true },
                    { text: String(c.total), alignment: "right", font: MEDIUM, bold: true },
                    { text: String(c.completed), alignment: "right" },
                    { text: String(c.pending), alignment: "right" },
                  ];
                }),
              ],
            },
            layout: summaryLayout,
          },
        ]),
        roundedBox(rightWidth, boxHeight, boxPad, [
          sectionTitle("สรุปตามความเร่งด่วน"),
          {
            fontSize: SUMMARY_SIZE,
            table: {
              widths: ["*", px(54), px(54)],
              body: [
                [small("ระดับ"), small("จำนวน", "right"), small("สัดส่วน", "right")],
                ...priorities.map((p): TableCell[] => [
                  { text: p.label },
                  { text: String(p.value), alignment: "right", font: MEDIUM, bold: true },
                  { text: `${percentOf(p.value)}%`, alignment: "right" },
                ]),
              ],
            },
            layout: summaryLayout,
          },
        ]),
      ],
      margin: [0, 0, 0, boxBottomGap(boxHeight, boxPad, boxInner)],
    });
  }

  // ---- signatures ---------------------------------------------------------------------------
  // As on screen, the signatures sit at the foot of the last page. An invisible block of the
  // same height goes into the normal flow first: if it does not fit under the content it moves
  // to a new page, so the pinned signatures can never land on top of anything.
  const signatureGap = px(40);
  const signatureWidth = (CONTENT_WIDTH - signatureGap) / 2;
  const reserved = SIGNATURE_HEIGHT + px(32);
  content.push(
    { canvas: [{ type: "rect", x: 0, y: 0, w: 1, h: reserved, color: "#ffffff" }] },
    {
      columnGap: signatureGap,
      columns: [signature("ผู้จัดทำรายงาน", signatureWidth), signature("ผู้รับรองรายงาน", signatureWidth)],
      absolutePosition: { x: MARGIN, y: PAGE_HEIGHT - BOTTOM_MARGIN - SIGNATURE_HEIGHT - px(14) },
    },
  );

  const definition: TDocumentDefinitions = {
    pageSize: "A4",
    pageMargins: [MARGIN, MARGIN, MARGIN, BOTTOM_MARGIN],
    info: { title: `รายงานแจ้งซ่อม ${monthName}`, author: "HKW Service" },
    images: logo ? { [LOGO_IMAGE]: `data:image/png;base64,${logo.toString("base64")}` } : undefined,
    defaultStyle: { font: REGULAR, fontSize: px(11), color: INK, lineHeight: leading(1.5) },
    footer: (currentPage, pageCount) => ({
      margin: [MARGIN, px(10), MARGIN, 0],
      stack: [
        { canvas: [{ type: "line", x1: 0, y1: 0, x2: CONTENT_WIDTH, y2: 0, lineWidth: 0.75, lineColor: N200 }] },
        {
          text: `เอกสารนี้จัดทำโดยระบบ HKW Service · นับงานตามวันที่แจ้งซ่อม${
            pageCount > 1 ? ` · หน้า ${currentPage} / ${pageCount}` : ""
          }`,
          alignment: "center",
          fontSize: px(9),
          color: N400,
          margin: [0, px(8), 0, 0],
        },
      ],
    }),
    content,
  };

  return pdf.createPdf(definition).getBuffer();
}
