import { isAdmin } from "@/lib/admin/session";
import { buildReportPdf } from "@/lib/reports/buildReportPdf";
import { listMonthTickets } from "@/lib/reports/listMonthTickets";
import { formatThaiMonth, isMonthKey } from "@/lib/reports/month";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// The school logo is a public file of this same site; without it the report still builds.
async function loadLogo(request: Request): Promise<Buffer | null> {
  try {
    const response = await fetch(new URL("/school-logo.png", request.url), { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

// Monthly repair report as a PDF file. It is built on the server and sent as an ordinary
// download, so it saves the same way on a computer, a phone or inside an in-app browser.
export async function GET(request: Request) {
  if (!(await isAdmin())) return new Response("Unauthorized", { status: 401 });

  const monthKey = new URL(request.url).searchParams.get("month");
  if (!isMonthKey(monthKey)) return new Response("Invalid month", { status: 400 });

  try {
    const [tickets, logo] = await Promise.all([listMonthTickets(monthKey), loadLogo(request)]);
    const file = await buildReportPdf(monthKey, tickets, logo);
    const thaiName = encodeURIComponent(`รายงานแจ้งซ่อม-${formatThaiMonth(monthKey)}.pdf`);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="hkw-repair-report-${monthKey}.pdf"; filename*=UTF-8''${thaiName}`,
        "Content-Length": String(file.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("report pdf failed", err);
    return new Response("สร้างไฟล์ PDF ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
