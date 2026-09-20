"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, ClipboardList, Eye, Home, Info, MapPin, Tag } from "lucide-react";
import { CopyTicketId } from "@/components/tickets/CopyTicketId";
import { NotifyMe } from "@/components/tickets/NotifyMe";
import type { Ticket, TicketImage } from "@/types/ticket";

export function SuccessView({ ticket, images }: { ticket: Ticket; images: TicketImage[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
      className="flex flex-col gap-5"
    >
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="flex flex-col items-center gap-3 rounded-3xl border border-green-100 bg-green-50 p-7 text-center"
      >
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.1 }}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600 text-white shadow-lg shadow-green-600/25"
        >
          <CheckCircle2 className="h-9 w-9" strokeWidth={1.75} />
        </motion.div>
        <div>
          <p className="text-lg font-semibold text-green-800">แจ้งซ่อมสำเร็จ</p>
          <p className="mt-1 text-sm text-green-700">เจ้าหน้าที่จะดำเนินการโดยเร็วที่สุด</p>
        </div>
      </motion.div>

      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
        className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm"
      >
        <p className="text-xs text-neutral-400">Ticket ID</p>
        <p className="mt-1 text-2xl font-bold tracking-wide text-neutral-900">{ticket.ticketId}</p>
        <div className="mt-3">
          <CopyTicketId ticketId={ticket.ticketId} />
        </div>

        <dl className="mt-6 flex flex-col divide-y divide-neutral-100 text-sm">
          <InfoRow icon={Tag} label="ประเภท" value={ticket.categoryNameSnapshot} />
          <InfoRow icon={ClipboardList} label="หัวข้อ" value={ticket.title} />
          <InfoRow icon={MapPin} label="สถานที่" value={ticket.locationText} />
        </dl>

        {images.length > 0 && (
          <div className="mt-5 border-t border-neutral-100 pt-5">
            <p className="mb-2.5 text-xs text-neutral-400">รูปที่แนบ ({images.length})</p>
            <div className="flex flex-wrap gap-2.5">
              {images.map((img) => (
                <div
                  key={img.imageId}
                  className="relative h-20 w-20 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100"
                >
                  <Image
                    src={img.downloadUrl}
                    alt="รูปประกอบการแจ้งซ่อม"
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex flex-col gap-3">
        <NotifyMe ticketId={ticket.ticketId} />
        <Link
          href={`/ticket/${ticket.ticketId}`}
          className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-center text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
        >
          <Eye className="h-4 w-4" strokeWidth={1.75} />
          ดูรายละเอียดและติดตามงาน
        </Link>
        <Link
          href="/"
          className="flex items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white px-6 py-3 text-center text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50"
        >
          <Home className="h-4 w-4" strokeWidth={1.75} />
          กลับหน้าแรก
        </Link>
      </motion.div>
    </motion.div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Info;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <dt className="flex items-center gap-2 text-neutral-500">
        <Icon className="h-4 w-4 text-neutral-400" strokeWidth={1.75} />
        {label}
      </dt>
      <dd
        className={`text-right font-medium ${highlight ? "text-blue-600" : "text-neutral-900"}`}
      >
        {value}
      </dd>
    </div>
  );
}
