"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Shield } from "lucide-react";

const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? "stadium2034";
const AUTH_COOKIE = "demo_access";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password === DEMO_PASSWORD) {
      document.cookie = `${AUTH_COOKIE}=${DEMO_PASSWORD}; path=/; max-age=86400; SameSite=Strict`;
      const from = searchParams.get("from") ?? "/dashboard";
      router.push(from);
    } else {
      setError("Incorrect password. Please try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="relative">
        <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9AA6B6]" />
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Demo password"
          autoFocus
          className="w-full pl-10 pr-10 py-2.5 text-[13px] border border-[#E3E8F0] rounded-lg bg-[#F8F9FC] text-[#14223B] outline-none focus:border-[#E07B00] focus:ring-2 focus:ring-[#E07B00]/10 transition-all placeholder:text-[#9AA6B6]"
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9AA6B6] hover:text-[#6A788D]"
        >
          {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {error && (
        <div className="text-[12px] text-[#C0453F] bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full py-2.5 rounded-lg text-[13.5px] font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ background: "#E07B00" }}
      >
        {loading ? "Verifying…" : "Access Demo"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FB]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "#E07B00" }}>
            <Shield size={26} className="text-white" />
          </div>
          <h1 className="text-[22px] font-bold text-[#14223B] tracking-tight">StadiumOps</h1>
          <p className="text-[13px] text-[#6A788D] mt-1">Private Client Demo</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E3E8F0] p-8" style={{ boxShadow: "0 4px 24px rgba(20,34,59,0.08)" }}>
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#E07B00]" />
              <span className="text-[11px] font-bold tracking-[0.08em] uppercase text-[#6A788D]">Jeddah Stadium Procurement</span>
            </div>
            <h2 className="text-[17px] font-bold text-[#14223B]">Enter demo password</h2>
            <p className="text-[12.5px] text-[#6A788D] mt-1">
              This demo contains confidential procurement data. Access is restricted.
            </p>
          </div>

          <Suspense fallback={<div className="h-24 flex items-center justify-center text-[13px] text-[#6A788D]">Loading…</div>}>
            <LoginForm />
          </Suspense>

          <div className="mt-6 pt-5 border-t border-[#F0F3F8] text-center">
            <p className="text-[11.5px] text-[#9AA6B6]">
              This is a private client demo. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
