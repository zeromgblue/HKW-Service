import { StaffLiveProvider } from "@/components/staff/LiveUpdates";

// One live connection shared by every staff page, so it survives moving between the list and
// a job's detail page.
export default function StaffLayout({ children }: LayoutProps<"/c">) {
  return <StaffLiveProvider>{children}</StaffLiveProvider>;
}
