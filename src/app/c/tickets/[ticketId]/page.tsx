import { CheckCircle2, ClipboardList, Clock, MapPin, Phone, SearchX, Tag, UserRound } from "lucide-react";
import { getTicket } from "@/lib/tickets/getTicket";
import { getTicketImages } from "@/lib/tickets/getTicketImages";
import { formatThaiDateTime } from "@/lib/formatDate";
import { BackLink } from "@/components/ui/BackLink";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { PriorityBadge, StatusBadge } from "@/components/tickets/Badges";
import { CompleteJob } from "@/components/staff/CompleteJob";
import { DeleteTicket } from "@/components/staff/DeleteTicket";

export const metadata = {
  title: "รายละเอียดงาน | HKW Service",
  robots: { index: false, follow: false },
};

export default async function StaffTicketPage(props: PageProps<"/c/tickets/[ticketId]">) {
  const { ticketId } = await props.params;
  const [ticket, images] = await Promise.all([getTicket(ticketId), getTicketImages(ticketId)]);

  if (!ticket) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
          <SearchX className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <p className="text-lg font-semibold text-neutral-900">ไม่พบงานนี้</p>
        <BackLink href="/c" label="กลับหน้ารายการงาน" />
      </main>
    );
  }

  const toGallery = (list: typeof images) => list.map((i) => ({ id: i.imageId, url: i.downloadUrl }));
  const before = toGallery(images.filter((i) => i.type === "before"));
  const after = toGallery(images.filter((i) => i.type === "after"));

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-8">
      <BackLink href="/c" label="กลับหน้ารายการงาน" />

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">{ticket.title}</h1>
        <p className="text-sm text-neutral-400">{ticket.ticketId}</p>
      </header>

      <section className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <dl className="flex flex-col divide-y divide-neutral-100 text-sm">
          <Row icon={Tag} label="ประเภท" value={ticket.categoryNameSnapshot} />
          <Row icon={MapPin} label="สถานที่" value={ticket.locationText} />
          <Row icon={Clock} label="แจ้งเมื่อ" value={formatThaiDateTime(ticket.createdAt)} />
          <Row
            icon={UserRound}
            label="ผู้แจ้ง"
            value={ticket.isAnonymous || !ticket.reporterName ? "ไม่ระบุชื่อ" : ticket.reporterName}
          />
          {!ticket.isAnonymous && ticket.reporterContact && (
            <Row icon={Phone} label="ติดต่อ" value={ticket.reporterContact} />
          )}
        </dl>

        <div>
          <p className="mb-1.5 flex items-center gap-2 text-xs text-neutral-400">
            <ClipboardList className="h-3.5 w-3.5" strokeWidth={1.75} />
            รายละเอียด
          </p>
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-neutral-800">
            {ticket.description}
          </p>
        </div>

        {before.length > 0 && (
          <div>
            <p className="mb-2 text-xs text-neutral-400">รูปที่ผู้แจ้งแนบ ({before.length}) · แตะเพื่อดูรูปเต็ม</p>
            <ImageGallery images={before} alt="รูปก่อนซ่อม" thumbClassName="h-24 w-24" />
          </div>
        )}
      </section>

      {ticket.status === "pending" && (
        <section className="rounded-3xl border border-blue-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-neutral-900">จบงาน</h2>
          <CompleteJob ticketId={ticket.ticketId} afterImages={after} />
        </section>
      )}

      {ticket.status === "completed" && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="mb-3 flex items-center gap-2 text-base font-semibold text-emerald-800">
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
            จบงานแล้ว
          </h2>
          <p className="text-xs text-emerald-700">
            {ticket.completedAt && `เมื่อ ${formatThaiDateTime(ticket.completedAt)}`}
            {ticket.completedBy && ` · โดย ${ticket.completedBy}`}
          </p>
          {after.length > 0 && (
            <div className="mt-3">
              <p className="mb-2 text-xs text-emerald-700">รูปหลังซ่อม · แตะเพื่อดูรูปเต็ม</p>
              <ImageGallery images={after} alt="รูปหลังซ่อม" thumbClassName="h-24 w-24" />
            </div>
          )}
        </section>
      )}

      <div className="flex justify-center pt-2">
        <DeleteTicket ticketId={ticket.ticketId} />
      </div>
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
