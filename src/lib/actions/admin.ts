"use server";

import { redirect } from "next/navigation";
import {
  checkAdminCredentials,
  endAdminSession,
  isAdminConfigured,
  startAdminSession,
} from "@/lib/admin/session";

export interface AdminLoginState {
  error: string;
}

export async function loginAdmin(_previous: AdminLoginState | undefined, formData: FormData): Promise<AdminLoginState> {
  if (!isAdminConfigured()) {
    return { error: "ยังไม่ได้ตั้งค่าบัญชีผู้ดูแลระบบ (ADMIN_USERNAME / ADMIN_PASSWORD)" };
  }

  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!checkAdminCredentials(username, password)) {
    // Slows down anyone guessing passwords by hand or by script.
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  await startAdminSession();
  redirect("/admin");
}

export async function logoutAdmin() {
  await endAdminSession();
  redirect("/admin/login");
}
