import type { Metadata } from "next";
import { StaffLiveProvider } from "@/components/staff/LiveUpdates";

// Staff pages install as their own app, separate from the one teachers use to report repairs.
export const metadata: Metadata = {
  manifest: "/c/manifest.webmanifest",
  appleWebApp: { capable: true, title: "HKW ช่าง", statusBarStyle: "default" },
};

// One live connection shared by every staff page, so it survives moving between the list and
// a job's detail page.
export default function StaffLayout({ children }: LayoutProps<"/c">) {
  return <StaffLiveProvider>{children}</StaffLiveProvider>;
}
