import Image from "next/image";
import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin/session";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = {
  title: "เข้าสู่ระบบผู้ดูแล | HKW Service",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  if (await isAdmin()) redirect("/admin");

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-7 px-6 py-10">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-lg shadow-blue-600/15 ring-1 ring-neutral-200/60">
          <Image src="/school-logo.png" alt="โลโก้โรงเรียน" width={384} height={384} className="h-16 w-16 object-contain" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-neutral-900">ผู้ดูแลระบบ</h1>
          <p className="text-sm text-neutral-500">HKW Service · ระบบแจ้งซ่อมโรงเรียน</p>
        </div>
      </div>

      <section className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm">
        <LoginForm />
      </section>
    </main>
  );
}
