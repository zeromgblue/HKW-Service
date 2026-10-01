import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "hkw_admin";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

// The admin account lives in environment variables, never in the (public) repository.
const adminUsername = process.env.ADMIN_USERNAME;
const adminPassword = process.env.ADMIN_PASSWORD;

export function isAdminConfigured(): boolean {
  return Boolean(adminUsername && adminPassword);
}

// Hashing both sides first gives equal-length buffers, so the comparison leaks nothing about
// the real value's length or content through timing.
function safeEqual(a: string, b: string): boolean {
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(a), digest(b));
}

export function checkAdminCredentials(username: string, password: string): boolean {
  if (!isAdminConfigured()) return false;
  const userOk = safeEqual(username, adminUsername!);
  const passOk = safeEqual(password, adminPassword!);
  return userOk && passOk;
}

// The signing key is derived from the credentials, so changing the password also signs
// everyone out.
function sign(payload: string): string {
  const key = createHash("sha256").update(`hkw-admin-session:${adminUsername}:${adminPassword}`).digest();
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export async function startAdminSession() {
  const expiresAt = String(Date.now() + SESSION_SECONDS * 1000);
  (await cookies()).set(COOKIE_NAME, `${expiresAt}.${sign(expiresAt)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function endAdminSession() {
  (await cookies()).delete(COOKIE_NAME);
}

export async function isAdmin(): Promise<boolean> {
  if (!isAdminConfigured()) return false;
  const value = (await cookies()).get(COOKIE_NAME)?.value ?? "";
  const [expiresAt, signature] = value.split(".");
  if (!expiresAt || !signature) return false;
  if (!safeEqual(signature, sign(expiresAt))) return false;
  return Number(expiresAt) > Date.now();
}

// Call at the top of every admin page: a layout check alone does not protect the pages
// beneath it.
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}
