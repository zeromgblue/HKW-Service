"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 14; // matches the sheet's own padding

// Where the sheet may be cut between pages: never through a table row or a block marked
// `report-avoid-break`. All values are CSS pixels measured from the top of the sheet.
function findPageBreaks(sheet: HTMLElement, pxPerMm: number): number[] {
  const top = sheet.getBoundingClientRect().top;
  const total = sheet.getBoundingClientRect().height;
  const blocks = [...sheet.querySelectorAll("tr, header, footer, h2, .report-avoid-break")].map((el) => {
    const rect = el.getBoundingClientRect();
    return { top: rect.top - top, bottom: rect.bottom - top };
  });
  const cutsThrough = (y: number) => blocks.some((b) => b.top < y - 0.5 && y + 0.5 < b.bottom);
  const candidates = blocks.flatMap((b) => [b.top, b.bottom]).filter((y) => !cutsThrough(y));

  const breaks: number[] = [];
  let start = 0;
  for (;;) {
    // The first page's top margin is the sheet's own padding; later pages get one added in the
    // PDF. What is left ends with the sheet's bottom padding, so it may run to the page edge.
    const topMargin = start === 0 ? 0 : MARGIN_MM;
    if (total - start <= (PAGE_HEIGHT_MM - topMargin) * pxPerMm + 1) break;
    const limit = start + (PAGE_HEIGHT_MM - topMargin - MARGIN_MM) * pxPerMm;
    const fitting = candidates.filter((y) => y > start + 1 && y <= limit);
    start = fitting.length ? Math.max(...fitting) : limit;
    breaks.push(start);
  }
  return breaks;
}

// Turns the on-screen report sheet into an A4 PDF file and downloads it. The page is drawn by
// the browser itself, so Thai text and the layout come out exactly as shown.
// `autoStart` begins the download once on arrival (used by the buttons on the documents list).
export function DownloadPdfButton({
  targetId,
  fileName,
  autoStart = false,
}: {
  targetId: string;
  fileName: string;
  autoStart?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (!autoStart || started.current) return;
    started.current = true;
    // Drop the trigger from the address so a refresh does not download again.
    window.history.replaceState(null, "", window.location.pathname);
    download();
    // Runs once on arrival; `download` only reads the props above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  async function download() {
    const sheet = document.getElementById(targetId);
    if (!sheet || busy) return;
    setBusy(true);
    setError(null);

    // On a phone the sheet is shown shrunk to fit; measure and draw it at real size.
    const fit = sheet.closest<HTMLElement>("[data-report-fit]");
    const shownZoom = fit?.style.zoom ?? "";
    if (fit) fit.style.zoom = "1";

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import("html2canvas-pro"), import("jspdf")]);
      await document.fonts.ready;

      const width = sheet.getBoundingClientRect().width;
      const height = sheet.getBoundingClientRect().height;
      const pxPerMm = width / PAGE_WIDTH_MM;
      const edges = [0, ...findPageBreaks(sheet, pxPerMm), height];
      const pageCount = edges.length - 1;
      // ~300dpi on a computer; a little less on phones, where memory is tight.
      const scale = window.innerWidth < 768 ? 2.5 : 3;

      const pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });

      // One page is drawn at a time so a long report never needs one enormous canvas, which
      // phones refuse to create.
      for (let i = 0; i < pageCount; i++) {
        const sliceHeight = edges[i + 1] - edges[i];
        if (sliceHeight < 1) continue;

        const page = await html2canvas(sheet, {
          scale,
          backgroundColor: "#ffffff",
          useCORS: true,
          logging: false,
          // Lay the copy out in a desktop-wide window so nothing wraps differently on a phone.
          windowWidth: Math.max(window.innerWidth, 1024),
          x: 0,
          y: edges[i],
          width,
          height: sliceHeight,
          onclone: (_doc, clone) => {
            // The on-screen paper outline and shadow do not belong in the file.
            clone.style.boxShadow = "none";
          },
        });

        if (i > 0) pdf.addPage();
        pdf.addImage(
          page.toDataURL("image/jpeg", 0.95),
          "JPEG",
          0,
          i === 0 ? 0 : MARGIN_MM,
          PAGE_WIDTH_MM,
          sliceHeight / pxPerMm,
        );
        if (pageCount > 1) {
          pdf.setFontSize(8);
          pdf.setTextColor(150);
          pdf.text(`${i + 1} / ${pageCount}`, PAGE_WIDTH_MM / 2, PAGE_HEIGHT_MM - 6, { align: "center" });
        }
      }

      pdf.save(fileName);
    } catch (err) {
      console.error("PDF export failed", err);
      setError("สร้างไฟล์ PDF ไม่สำเร็จ กรุณาลองใหม่ หรือใช้ปุ่มพิมพ์เอกสารแทน");
    } finally {
      if (fit) fit.style.zoom = shownZoom;
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={download}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-3 py-2.5 text-sm sm:px-4 font-semibold text-white shadow-sm transition hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" strokeWidth={1.75} />}
        {busy ? "กำลังสร้าง PDF..." : "ดาวน์โหลด PDF"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
