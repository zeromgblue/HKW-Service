"use client";

import { useActionState } from "react";
import { AlertTriangle, Loader2, LogIn } from "lucide-react";
import { loginAdmin } from "@/lib/actions/admin";

const inputClass =
  "rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base text-neutral-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-100";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAdmin, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="username" className="text-sm font-medium text-neutral-800">
          ชื่อผู้ใช้
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          autoCapitalize="none"
          required
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-sm font-medium text-neutral-800">
          รหัสผ่าน
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>

      {state?.error && (
        <p role="alert" className="flex items-start gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} />
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm shadow-blue-600/20 transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <LogIn className="h-4.5 w-4.5" strokeWidth={1.75} />}
        เข้าสู่ระบบ
      </button>
    </form>
  );
}
