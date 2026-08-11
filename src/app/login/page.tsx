"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";

const loginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});
type LoginFields = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const needsConfirm = searchParams.get("confirm") === "1";

  const { login } = useAuth();
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFields) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await login(data.email, data.password);
      if (res.success) {
        router.push("/dashboard");
      } else {
        setServerError(
          res.error ?? res.detail ?? (isAr ? "بيانات خاطئة، حاول مجدداً" : "Invalid credentials")
        );
      }
    } catch (err) {
      setServerError(err instanceof Error ? err.message : isAr ? "خطأ غير متوقع" : "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  const inputBase =
    "w-full h-11 px-3 border rounded-lg text-sm text-text-primary focus:outline-none focus:ring-2 transition bg-white placeholder:text-text-muted";

  function fieldCls(hasError: boolean) {
    return cn(
      inputBase,
      hasError
        ? "border-red-400 focus:ring-red-300"
        : "border-border-light focus:border-brand-green focus:ring-brand-green/30"
    );
  }

  return (
    <div className="min-h-screen bg-bg-alt flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex flex-col items-center gap-2 mb-8">
        <div className="w-12 h-12 rounded-full bg-brand-green flex items-center justify-center shadow">
          <svg width="24" height="24" viewBox="0 0 36 36" fill="none" aria-hidden="true">
            <path d="M4 22 L18 8 L32 22 L27 22 L18 13 L9 22 Z" fill="white" />
            <path d="M13 22 L18 17 L23 22 L21 22 L18 19 L15 22 Z" fill="#FDD12A" />
            <rect x="16" y="22" width="4" height="7" rx="1" fill="white" />
          </svg>
        </div>
        <span className="text-brand-dark font-bold text-lg tracking-tight">سبانكر</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-border-light p-8">
        <h1 className="text-xl font-bold text-text-primary mb-1 text-center">
          {isAr ? "تسجيل الدخول" : "Sign in"}
        </h1>
        <p className="text-sm text-text-muted text-center mb-6">
          {isAr ? "ادخل حسابك لمتابعة طلباتك" : "Access your account and track your requests"}
        </p>

        {justRegistered && needsConfirm && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <div>
              <p className="font-bold mb-0.5">
                {isAr ? "تم إنشاء حسابك بنجاح!" : "Account created successfully!"}
              </p>
              <p>
                {isAr
                  ? "تم إرسال رسالة تأكيد على بريدك الإلكتروني. افتح الإيميل واضغط على رابط التأكيد أولاً، ثم ارجع وسجّل الدخول."
                  : "A confirmation email was sent to your inbox. Click the confirmation link first, then come back to sign in."}
              </p>
            </div>
          </div>
        )}

        {justRegistered && !needsConfirm && (
          <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {isAr ? "تم إنشاء حسابك! سجّل الدخول الآن." : "Account created! Please sign in."}
          </div>
        )}

        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {isAr ? "البريد الإلكتروني" : "Email address"} <span className="text-red-500">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder={isAr ? "مثال@بريد.com" : "you@example.com"}
              autoComplete="email"
              dir="ltr"
              className={fieldCls(!!errors.email)}
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {isAr ? "كلمة المرور" : "Password"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                className={cn(fieldCls(!!errors.password), "pe-10")}
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
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={cn(
              "w-full h-12 rounded-xl text-white text-sm font-bold transition-colors mt-2",
              loading
                ? "bg-brand-green/50 cursor-not-allowed"
                : "bg-brand-green hover:bg-brand-green-dark active:scale-[0.98]"
            )}
          >
            {loading
              ? isAr ? "جاري الدخول..." : "Signing in..."
              : isAr ? "دخول" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          {isAr ? "ليس لديك حساب؟" : "Don't have an account?"}{" "}
          <Link href="/signup" className="text-brand-green font-semibold hover:underline">
            {isAr ? "إنشاء حساب" : "Sign up"}
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
