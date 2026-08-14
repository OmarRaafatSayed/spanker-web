"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { useRegistrationEvents } from "@/lib/hooks/useRegistrationEvents";

// ─── Validation schema ────────────────────────────────────────────────────────

const signupSchema = z
  .object({
    first_name: z.string().min(2, { message: "الاسم الأول مطلوب (حرفين على الأقل)" }),
    last_name: z.string().min(2, { message: "الاسم الأخير مطلوب (حرفين على الأقل)" }),
    phone: z
      .string()
      .min(10, { message: "رقم الهاتف غير صحيح" })
      .regex(/^[0-9+\-\s()]+$/, { message: "رقم الهاتف يحتوي على حروف غير مسموح بها" }),
    email: z.string().email({ message: "البريد الإلكتروني غير صحيح" }),
    password: z.string().min(8, { message: "كلمة المرور 8 أحرف على الأقل" }),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm_password"],
  });

type SignupFields = z.infer<typeof signupSchema>;

// ─── Component ────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const { dispatchUserRegistered } = useRegistrationEvents();

  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFields>({
    resolver: zodResolver(signupSchema),
  });

  async function onSubmit(data: SignupFields) {
    setServerError(null);
    setLoading(true);
    try {
      const res = await signup(
        data.email,
        data.password,
        data.first_name,
        data.last_name,
        data.phone
      );
      if (res.success) {
        // Dispatch registration event async (fire & forget)
        // This queues CRM provisioning without blocking navigation
        if (res.user) {
          dispatchUserRegistered(
            res.user.id,
            res.user.email,
            data.first_name,
            data.last_name,
            data.phone
          ).catch(err => {
            console.error("Event dispatch failed:", err);
            // Don't show error to user — provisioning continues in background
          });
        }

        // If backend returned a session → auto-logged in, go straight to dashboard
        if (res.session && res.user) {
          router.push("/dashboard");
        } else {
          // email_confirmation_required → send to login with clear notice
          router.push("/login?registered=1&confirm=1");
        }
      } else {
        setServerError(res.error ?? res.detail ?? (isAr ? "فشل إنشاء الحساب" : "Signup failed"));
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
      {/* Brand header */}
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

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-border-light p-8">
        <h1 className="text-xl font-bold text-text-primary mb-1 text-center">
          {isAr ? "إنشاء حساب جديد" : "Create your account"}
        </h1>
        <p className="text-sm text-text-muted text-center mb-6">
          {isAr ? "تتبّع طلباتك وحجوزاتك ومدفوعاتك" : "Track your applications, bookings and payments"}
        </p>

        {serverError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          {/* Name row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {isAr ? "الاسم الأول" : "First name"} <span className="text-red-500">*</span>
              </label>
              <input
                {...register("first_name")}
                type="text"
                placeholder={isAr ? "أحمد" : "Ahmed"}
                autoComplete="given-name"
                className={fieldCls(!!errors.first_name)}
              />
              {errors.first_name && (
                <p className="mt-1 text-xs text-red-500">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-1">
                {isAr ? "الاسم الأخير" : "Last name"} <span className="text-red-500">*</span>
              </label>
              <input
                {...register("last_name")}
                type="text"
                placeholder={isAr ? "محمد" : "Mohamed"}
                autoComplete="family-name"
                className={fieldCls(!!errors.last_name)}
              />
              {errors.last_name && (
                <p className="mt-1 text-xs text-red-500">{errors.last_name.message}</p>
              )}
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {isAr ? "رقم الهاتف (واتساب)" : "Phone number (WhatsApp)"}{" "}
              <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 start-3 flex items-center pointer-events-none">
                {/* WhatsApp icon */}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-green-500">
                  <path
                    d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <input
                {...register("phone")}
                type="tel"
                placeholder={isAr ? "01xxxxxxxxx" : "+201xxxxxxxxx"}
                autoComplete="tel"
                dir="ltr"
                className={cn(fieldCls(!!errors.phone), "ps-9")}
              />
            </div>
            {errors.phone ? (
              <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>
            ) : (
              <p className="mt-1 text-xs text-text-muted">
                {isAr ? "سيُستخدم للتواصل معك عبر واتساب" : "Used to contact you via WhatsApp"}
              </p>
            )}
          </div>

          {/* Email */}
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

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {isAr ? "كلمة المرور" : "Password"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className={cn(fieldCls(!!errors.password), "pe-10")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 end-3 flex items-center text-text-muted hover:text-text-primary"
                aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
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
            {errors.password ? (
              <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
            ) : (
              <p className="mt-1 text-xs text-text-muted">
                {isAr ? "8 أحرف على الأقل" : "At least 8 characters"}
              </p>
            )}
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {isAr ? "تأكيد كلمة المرور" : "Confirm password"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("confirm_password")}
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="new-password"
                className={cn(fieldCls(!!errors.confirm_password), "pe-10")}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 end-3 flex items-center text-text-muted hover:text-text-primary"
                aria-label={showConfirm ? "إخفاء" : "إظهار"}
              >
                {showConfirm ? (
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
            {errors.confirm_password && (
              <p className="mt-1 text-xs text-red-500">{errors.confirm_password.message}</p>
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
              ? isAr ? "جاري إنشاء الحساب..." : "Creating account..."
              : isAr ? "إنشاء الحساب" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          {isAr ? "لديك حساب بالفعل؟" : "Already have an account?"}{" "}
          <Link href="/login" className="text-brand-green font-semibold hover:underline">
            {isAr ? "سجّل الدخول" : "Log in"}
          </Link>
        </p>
      </div>
    </div>
  );
}
