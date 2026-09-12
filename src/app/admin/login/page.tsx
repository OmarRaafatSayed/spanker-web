"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Check if already logged in as staff
  useEffect(() => {
    checkStaffAccess();
  }, []);

  async function checkStaffAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: staffRecord } = await supabase
        .from("profiles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (staffRecord && ['admin', 'agent', 'reviewer'].includes(staffRecord.role)) {
        router.push("/admin/visas");
      }
    } catch (err) {
      console.error("Error checking staff access:", err);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("فشل تسجيل الدخول");

      // 2. Check if user is staff
      const { data: staffRecord, error: staffError } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (staffError) throw staffError;

      if (!staffRecord || !['admin', 'agent', 'reviewer'].includes(staffRecord.role)) {
        await supabase.auth.signOut();
        throw new Error("هذا الحساب غير مسجل كموظف");
      }

      // 3. Redirect to admin panel
      router.push("/admin/visas");
    } catch (err: any) {
      console.error("Login error:", err);
      setError(err.message || "حدث خطأ أثناء تسجيل الدخول");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-bg-alt flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex flex-col items-center gap-2 mb-8">
        <div className="flex items-center justify-center">
          <img 
            src="/assets/brand/icone-LOGO.png" 
            alt="Spanker Logo" 
            className="w-12 h-12 object-contain"
          />
        </div>
        <span className="text-brand-dark font-bold text-lg tracking-tight">سبانكر</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-border-light p-8">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-brand-green/10 text-brand-green mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-text-primary mb-1">
            تسجيل الدخول
          </h1>
          <p className="text-sm text-text-muted">
            لوحة تحكم الموظفين
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              البريد الإلكتروني <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.com"
              required
              autoComplete="email"
              dir="ltr"
              className="w-full h-11 px-3 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:border-brand-green focus:ring-brand-green/30 transition bg-white placeholder:text-text-muted"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              كلمة المرور <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="current-password"
                className="w-full h-11 px-3 pe-10 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 focus:border-brand-green focus:ring-brand-green/30 transition bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 end-3 flex items-center text-text-muted hover:text-text-primary"
                aria-label={showPassword ? "إخفاء" : "إظهار"}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full h-12 rounded-xl text-white text-sm font-bold transition-all mt-2 ${
              loading
                ? "bg-brand-green/50 cursor-not-allowed"
                : "bg-brand-green hover:bg-brand-green-dark active:scale-[0.98]"
            }`}
          >
            {loading ? "جاري التحقق..." : "دخول"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border-light text-center">
          <p className="text-xs text-text-muted">
            لوحة التحكم مخصصة للموظفين فقط
          </p>
          <Link href="/login" className="text-sm text-brand-green font-semibold hover:underline mt-2 inline-block">
            تسجيل دخول كعميل ←
          </Link>
        </div>
      </div>
    </div>
  );
}
