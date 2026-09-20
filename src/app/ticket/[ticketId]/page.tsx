import { CheckCircle2, ClipboardList, Clock, Hourglass, MapPin, SearchX, Tag, Wrench } from "lucide-react";
import { getTicket } from "@/lib/tickets/getTicket";
import { getTicketImages } from "@/lib/tickets/getTicketImages";
import { isValidTicketId } from "@/lib/tickets/publicTicket";
import { formatThaiDateTime } from "@/lib/formatDate";
import { BackLink } from "@/components/ui/BackLink";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { PriorityBadge } from "@/components/tickets/Badges";
import { NotifyMe } from "@/components/tickets/NotifyMe";
import { TicketLive } from "@/components/tickets/TicketLive";

export const metadata = {
  title: "รายละเอียดงานแจ้งซ่อม | HKW Service",
  robots: { index: false, follow: false },
};

export default async function TicketPage(props: PageProps<"/ticket/[ticketId]">) {
  const { ticketId } = await props.params;
  const [ticket, images] = isValidTicketId(ticketId)
    ? await Promise.all([getTicket(ticketId), getTicketImages(ticketId)])
    : [null, []];

  if (!ticket) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
          <SearchX className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <p className="text-lg font-semibold text-neutral-900">ไม่พบงานนี้</p>
        <p className="text-sm text-neutral-500">กรุณาตรวจสอบ Ticket ID อีกครั้ง</p>
        <BackLink href="/" label="กลับหน้าแรก" />
      </main>
    );
  }

  const toGallery = (type: "before" | "after") =>
    images.filter((i) => i.type === type).map((i) => ({ id: i.imageId, url: i.downloadUrl }));
  const before = toGallery("before");
  const after = toGallery("after");
  const done = ticket.status === "completed";

  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-5 px-6 py-8">
      <TicketLive ticketId={ticket.ticketId} />
      <BackLink href="/" label="กลับหน้าแรก" />

      {done ? (
        <section className="flex flex-col items-center gap-2 rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/25">
            <CheckCircle2 className="h-8 w-8" strokeWidth={1.75} />
          </span>
          <p className="text-xl font-bold text-emerald-800">ซ่อมเสร็จแล้ว</p>
          <p className="text-sm text-emerald-700">
            {ticket.completedAt && formatThaiDateTime(ticket.completedAt)}
            {ticket.completedBy && ` · โดย ${ticket.completedBy}`}
          </p>
        </section>
      ) : (
        <section className="flex flex-col items-center gap-2 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-400 text-white">
            <Hourglass className="h-7 w-7" strokeWidth={1.75} />
          </span>
          <p className="text-xl font-bold text-amber-800">รอช่างดำเนินการ</p>
          <p className="text-sm text-amber-700">ช่างได้รับเรื่องของคุณแล้ว หน้านี้จะอัปเดตให้เองเมื่อซ่อมเสร็จ</p>
        </section>
      )}

      {!done && <NotifyMe ticketId={ticket.ticketId} />}

      <section className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-lg font-bold text-neutral-900">{ticket.title}</h1>
          <PriorityBadge priority={ticket.priority} />
        </div>
        <p className="-mt-2 text-xs text-neutral-400">{ticket.ticketId}</p>

        <dl className="flex flex-col divide-y divide-neutral-100 text-sm">
          <Row icon={Tag} label="ประเภท" value={ticket.categoryNameSnapshot} />
          <Row icon={MapPin} label="สถานที่" value={ticket.locationText} />
          <Row icon={Clock} label="แจ้งเมื่อ" value={formatThaiDateTime(ticket.createdAt)} />
        </dl>

        <div>
          <p className="mb-1.5 flex items-center gap-2 text-xs text-neutral-400">
            <ClipboardList className="h-3.5 w-3.5" strokeWidth={1.75} />
            รายละเอียดที่แจ้ง
          </p>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800">{ticket.description}</p>
        </div>

        {before.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-neutral-400">รูปที่คุณแนบ · แตะเพื่อดูรูปเต็ม</p>
            <ImageGallery images={before} alt="รูปที่แนบตอนแจ้งซ่อม" thumbClassName="h-20 w-20" />
          </div>
        )}
      </section>

      {done && after.length > 0 && (
        <section className="rounded-3xl border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <Wrench className="h-4 w-4" strokeWidth={1.75} />
            รูปหลังซ่อม · แตะเพื่อดูรูปเต็ม
          </p>
          <ImageGallery images={after} alt="รูปหลังซ่อม" thumbClassName="h-24 w-24" />
        </section>
      )}
    </main>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="flex shrink-0 items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
        {label}
      </dt>
      <dd className="break-words text-right font-medium text-neutral-900">{value}</dd>
    </div>
  );
}
