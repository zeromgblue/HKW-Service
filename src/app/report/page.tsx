import { Wrench } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";
import { ReportForm } from "@/components/report/ReportForm";

export const metadata = {
  title: "แจ้งซ่อม | ระบบแจ้งซ่อมโรงเรียน",
};

export default function ReportPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-7 px-6 py-10">
      <div className="flex flex-col gap-3">
        <BackLink href="/" label="กลับหน้าแรก" />
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-600/20">
            <Wrench className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-neutral-900">แจ้งซ่อม</h1>
            <p className="text-sm text-neutral-500">กรอกรายละเอียดปัญหาที่พบ ไม่ต้องเข้าสู่ระบบ</p>
          </div>
        </div>
      </div>

      <ReportForm />
    </main>
  );
}
