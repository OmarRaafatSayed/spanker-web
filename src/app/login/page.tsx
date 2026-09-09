"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";
import { usePortalAuth } from "@/modules/auth";
import { useI18n } from "@/lib/i18n/context";

const loginSchema = z.object({
  email: z.string().email({ message: "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ ØºÙŠØ± ØµØ­ÙŠØ­" }),
  password: z.string().min(1, { message: "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ù…Ø·Ù„ÙˆØ¨Ø©" }),
});
type LoginFields = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const needsConfirm = searchParams.get("confirm") === "1";

  const { login, isLoading, error: authError, clearError } = usePortalAuth();
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginFields) {
    clearError();
    await login({ email: data.email, password: data.password });
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
        <div className="flex items-center justify-center">
          <img 
            src="/assets/brand/icone-LOGO.png" 
            alt="Spanker Logo" 
            className="w-12 h-12 object-contain"
          />
        </div>
        <span className="text-brand-dark font-bold text-lg tracking-tight">Ø³Ø¨Ø§Ù†ÙƒØ±</span>
      </Link>

      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-border-light p-8">
        <h1 className="text-xl font-bold text-text-primary mb-1 text-center">
          {isAr ? "ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„" : "Sign in"}
        </h1>
        <p className="text-sm text-text-muted text-center mb-6">
          {isAr ? "Ø§Ø¯Ø®Ù„ Ø­Ø³Ø§Ø¨Ùƒ Ù„Ù…ØªØ§Ø¨Ø¹Ø© Ø·Ù„Ø¨Ø§ØªÙƒ" : "Access your account and track your requests"}
        </p>

        {justRegistered && needsConfirm && (
          <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
            </svg>
            <div>
              <p className="font-bold mb-0.5">
                {isAr ? "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨Ùƒ Ø¨Ù†Ø¬Ø§Ø­!" : "Account created successfully!"}
              </p>
              <p>
                {isAr
                  ? "ØªÙ… Ø¥Ø±Ø³Ø§Ù„ Ø±Ø³Ø§Ù„Ø© ØªØ£ÙƒÙŠØ¯ Ø¹Ù„Ù‰ Ø¨Ø±ÙŠØ¯Ùƒ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ. Ø§ÙØªØ­ Ø§Ù„Ø¥ÙŠÙ…ÙŠÙ„ ÙˆØ§Ø¶ØºØ· Ø¹Ù„Ù‰ Ø±Ø§Ø¨Ø· Ø§Ù„ØªØ£ÙƒÙŠØ¯ Ø£ÙˆÙ„Ø§ Ø«Ù… Ø§Ø±Ø¬Ø¹ ÙˆØ³Ø¬Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„."
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
            {isAr ? "ØªÙ… Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨Ùƒ! Ø³Ø¬Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ø§Ù„Ø¢Ù†." : "Account created! Please sign in."}
          </div>
        )}

        {authError && (
          <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm text-center">
            {authError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary mb-1">
              {isAr ? "Ø§Ù„Ø¨Ø±ÙŠØ¯ Ø§Ù„Ø¥Ù„ÙƒØªØ±ÙˆÙ†ÙŠ" : "Email address"} <span className="text-red-500">*</span>
            </label>
            <input
              {...register("email")}
              type="email"
              placeholder={isAr ? "Ù…Ø«Ø§Ù„@Ø¨Ø±ÙŠØ¯.com" : "you@example.com"}
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
              {isAr ? "ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±" : "Password"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                {...register("password")}
                type={showPassword ? "text" : "password"}
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                autoComplete="current-password"
                className={cn(fieldCls(!!errors.password), "pe-10")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute inset-y-0 end-3 flex items-center text-text-muted hover:text-text-primary"
                aria-label={showPassword ? "Ø¥Ø®ÙØ§Ø¡" : "Ø¥Ø¸Ù‡Ø§Ø±"}
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
            disabled={isLoading}
            className={cn(
              "w-full h-12 rounded-xl text-white text-sm font-bold transition-colors mt-2",
              isLoading
                ? "bg-brand-green/50 cursor-not-allowed"
                : "bg-brand-green hover:bg-brand-green-dark active:scale-[0.98]"
            )}
          >
            {isLoading
              ? isAr ? "Ø¬Ø§Ø±ÙŠ Ø§Ù„Ø¯Ø®ÙˆÙ„..." : "Signing in..."
              : isAr ? "Ø¯Ø®ÙˆÙ„" : "Sign in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-muted">
          {isAr ? "Ù„ÙŠØ³ Ù„Ø¯ÙŠÙƒ Ø­Ø³Ø§Ø¨" : "Don't have an account?"}{" "}
          <Link href="/signup" className="text-brand-green font-semibold hover:underline">
            {isAr ? "Ø¥Ù†Ø´Ø§Ø¡ Ø­Ø³Ø§Ø¨" : "Sign up"}
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