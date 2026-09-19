import { SearchX } from "lucide-react";
import { getTicket } from "@/lib/tickets/getTicket";
import { getTicketImages } from "@/lib/tickets/getTicketImages";
import { SuccessView } from "@/components/tickets/SuccessView";
import { BackLink } from "@/components/ui/BackLink";

export const metadata = {
  title: "แจ้งซ่อมสำเร็จ | ระบบแจ้งซ่อมโรงเรียน",
};

export default async function SuccessPage(props: PageProps<"/success/[ticketId]">) {
  const { ticketId } = await props.params;
  const ticket = await getTicket(ticketId);
  const images = ticket ? await getTicketImages(ticketId) : [];

  if (!ticket) {
    return (
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400">
          <SearchX className="h-7 w-7" strokeWidth={1.75} />
        </div>
        <p className="text-lg font-semibold text-neutral-900">ไม่พบ Ticket ID นี้</p>
        <p className="text-sm text-neutral-500">
          กรุณาตรวจสอบ Ticket ID อีกครั้ง หรือแจ้งซ่อมใหม่
        </p>
        <BackLink href="/report" label="กลับไปแจ้งซ่อม" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
      <SuccessView ticket={ticket} images={images} />
    </main>
  );
}
