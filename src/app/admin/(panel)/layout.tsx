import Image from "next/image";
import { LogOut } from "lucide-react";
import { requireAdmin } from "@/lib/admin/session";
import { logoutAdmin } from "@/lib/actions/admin";
import { AdminNav } from "@/components/admin/AdminNav";
import { LiveStatus, StaffLiveProvider } from "@/components/staff/LiveUpdates";

export const metadata = {
  title: "ผู้ดูแลระบบ | HKW Service",
  robots: { index: false, follow: false },
};

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();

  return (
    <StaffLiveProvider ticketBasePath="/admin/tickets">
      <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/90 backdrop-blur print:hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <Image src="/school-logo.png" alt="" width={384} height={384} className="h-9 w-9 shrink-0 object-contain" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-neutral-900">ผู้ดูแลระบบ</p>
                <p className="truncate text-xs text-neutral-400">HKW Service</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <LiveStatus />
              <form action={logoutAdmin}>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 text-xs font-medium text-neutral-500 transition hover:text-red-600"
                >
                  <LogOut className="h-4 w-4" strokeWidth={1.75} />
                  ออกจากระบบ
                </button>
              </form>
            </div>
          </div>
          <AdminNav />
        </div>
      </header>
      {children}
    </StaffLiveProvider>
  );
}
