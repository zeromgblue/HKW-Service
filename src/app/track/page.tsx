import { Search } from "lucide-react";
import { BackLink } from "@/components/ui/BackLink";

export const metadata = {
  title: "ติดตามงาน | ระบบแจ้งซ่อมโรงเรียน",
};

export default function TrackPage() {
  return (
    <main className="mx-auto flex w-full max-w-lg flex-1 flex-col gap-7 px-6 py-10">
      <div className="flex flex-col gap-3">
        <BackLink href="/" label="กลับหน้าแรก" />
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-900 text-white">
            <Search className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <h1 className="text-xl font-bold text-neutral-900">ติดตามงาน</h1>
        </div>
      </div>

      <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-neutral-200 bg-white/60 p-10 text-center">
        <p className="text-sm font-medium text-neutral-600">เร็ว ๆ นี้</p>
        <p className="text-sm text-neutral-400">
          ฟีเจอร์ติดตามสถานะงานจะเปิดใช้งานใน Phase ถัดไป
        </p>
      </div>
    </main>
  );
}
