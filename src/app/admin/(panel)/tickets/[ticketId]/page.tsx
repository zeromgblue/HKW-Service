import Link from "next/link";
import {
  CheckCircle2,
  ClipboardList,
  Clock,
  MapPin,
  MessageCircle,
  Phone,
  SearchX,
  Tag,
  Timer,
  UserRound,
  Wrench,
} from "lucide-react";
import { requireAdmin } from "@/lib/admin/session";
import { getTicket } from "@/lib/tickets/getTicket";
import { getTicketImages } from "@/lib/tickets/getTicketImages";
import { formatThaiDateTime } from "@/lib/formatDate";
import { formatDuration, repairDurationMs } from "@/lib/reports/month";
import { BackLink } from "@/components/ui/BackLink";
import { ImageGallery } from "@/components/ui/ImageGallery";
import { PriorityBadge, StatusBadge } from "@/components/tickets/Badges";
import { DeleteTicket } from "@/components/staff/DeleteTicket";
import { Reveal } from "@/components/ui/Reveal";

export default async function AdminTicketPage(props: { params: Promise<{ ticketId: string }> }) {
  await requireAdmin();

  const { ticketId } = await props.params;
  const [ticket, images] = await Promise.all([getTicket(ticketId), getTicketImages(ticketId)]);

  if (!ticket) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
          <SearchX className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <p className="text-lg font-semibold text-neutral-900">ไม่พบงานนี้</p>
        <BackLink href="/admin/tickets" label="กลับหน้ารายการงาน" />
      </main>
    );
  }

  const toGallery = (type: "before" | "after") =>
    images.filter((i) => i.type === type).map((i) => ({ id: i.imageId, url: i.downloadUrl }));
  const before = toGallery("before");
  const after = toGallery("after");
  const duration = repairDurationMs(ticket);
  const named = !ticket.isAnonymous && Boolean(ticket.reporterName);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-4 py-6 sm:px-5 sm:py-7">
      <Reveal className="flex flex-col gap-5">
      <BackLink href="/admin/tickets" label="กลับหน้ารายการงาน" />

      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={ticket.status} />
          <PriorityBadge priority={ticket.priority} />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900">{ticket.title}</h1>
        <p className="text-sm text-neutral-400">{ticket.ticketId}</p>
      </header>
      </Reveal>

      <Reveal index={1}>
      <section className="flex flex-col gap-4 rounded-3xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-5">
        <dl className="flex flex-col divide-y divide-neutral-100 text-sm">
          <Row icon={Tag} label="ประเภท" value={ticket.categoryNameSnapshot} />
          <Row icon={MapPin} label="สถานที่" value={ticket.locationText} />
          <Row icon={Clock} label="แจ้งเมื่อ" value={formatThaiDateTime(ticket.createdAt)} />
          <Row icon={UserRound} label="ผู้แจ้ง" value={named ? ticket.reporterName! : "ไม่ระบุชื่อ"} />
          {named && ticket.reporterPhone && (
            <Row icon={Phone} label="เบอร์โทร" value={ticket.reporterPhone} href={`tel:${ticket.reporterPhone}`} />
          )}
          {named && ticket.reporterContact && (
            <Row icon={MessageCircle} label="ช่องทางติดต่อ" value={ticket.reporterContact} />
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
      </Reveal>

      <Reveal index={2}>
      {ticket.status === "completed" ? (
        <section className="flex flex-col gap-3 rounded-3xl border border-emerald-200 bg-emerald-50/50 p-5">
          <h2 className="flex items-center gap-2 text-base font-semibold text-emerald-800">
            <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} />
            ซ่อมเสร็จแล้ว
          </h2>
          <dl className="flex flex-col divide-y divide-emerald-100 text-sm">
            {ticket.completedAt && <Row icon={Clock} label="เสร็จเมื่อ" value={formatThaiDateTime(ticket.completedAt)} />}
            {ticket.completedBy && <Row icon={Wrench} label="ผู้ดำเนินการ" value={ticket.completedBy} />}
            {duration !== null && <Row icon={Timer} label="ใช้เวลา" value={formatDuration(duration)} />}
          </dl>
          {after.length > 0 && (
            <div>
              <p className="mb-2 text-xs text-emerald-700">รูปหลังซ่อม ({after.length}) · แตะเพื่อดูรูปเต็ม</p>
              <ImageGallery images={after} alt="รูปหลังซ่อม" thumbClassName="h-24 w-24" />
            </div>
          )}
        </section>
      ) : (
        <section className="flex flex-col gap-3 rounded-3xl border border-amber-200 bg-amber-50/60 p-5">
          <h2 className="text-base font-semibold text-amber-800">ยังรอช่างดำเนินการ</h2>
          <p className="text-sm text-amber-700">
            การจบงานต้องแนบรูปหลังซ่อมและใส่ชื่อผู้ดำเนินการ ทำได้ที่หน้าของช่าง
          </p>
          <Link
            href={`/c/tickets/${ticket.ticketId}`}
            className="flex items-center justify-center gap-2 self-start rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-800"
          >
            <Wrench className="h-4 w-4" strokeWidth={1.75} />
            เปิดหน้าจบงาน
          </Link>
        </section>
      )}
      </Reveal>

      <div className="flex justify-center pt-2">
        <DeleteTicket ticketId={ticket.ticketId} redirectTo="/admin/tickets" />
      </div>
    </main>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: typeof Tag;
  label: string;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="flex shrink-0 items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
        {label}
      </dt>
      <dd className="break-words text-right font-medium text-neutral-900">
        {href ? (
          <a href={href} className="text-blue-600 underline-offset-2 hover:underline">
            {value}
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  );
}
