"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";
import { AuthModalService } from "@/lib/auth-modal-service";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "login" | "signup";

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, signup } = useAuth();
  const { locale } = useI18n();
  const isAr = locale === "ar";

  // Form state
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const authService = useRef<AuthModalService | null>(null);

  // Initialize auth service
  useEffect(() => {
    authService.current = new AuthModalService({
      login,
      signup,
      isAr,
    });
  }, [login, signup, isAr]);

  // Mount client-side only (for Portal)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setError(null);
      setSuccessMsg(null);
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setTimeout(() => emailRef.current?.focus(), 50);
    }
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  // Handle form submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!authService.current) return;

    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (tab === "login") {
        const res = await authService.current.handleLoginSubmit(email, password);
        if (res.success) {
          onClose();
        } else {
          setError(res.error || (isAr ? "خطأ غير متوقع" : "Unexpected error"));
        }
      } else {
        const res = await authService.current.handleSignupSubmit(
          email,
          password,
          firstName,
          lastName
        );
        if (res.success) {
          if (res.requiresEmailConfirmation) {
            setSuccessMsg(
              isAr
                ? "تم إنشاء الحساب! إذا طُلب تأكيد الإيميل، افحص بريدك ثم سجّل الدخول."
                : "Account created! Check your inbox for confirmation, then log in."
            );
            setTab("login");
            setPassword("");
          } else {
            onClose();
          }
        } else {
          setError(res.error || (isAr ? "خطأ غير متوقع" : "Unexpected error"));
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full h-11 px-3 border border-border-light rounded-lg text-sm text-text-primary focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red transition bg-[#f8f6f1]";

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? "تسجيل الدخول" : "Login"}
    >
      <div className="bg-[#fffdf9] rounded-2xl shadow-2xl w-full max-w-sm p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 end-4 text-text-muted hover:text-text-primary transition"
          aria-label={isAr ? "إغلاق" : "Close"}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-4">
          <img 
            src="/assets/brand/icone-LOGO.png" 
            alt="Spanker Logo" 
            className="w-10 h-10 object-contain"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border-light mb-5">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); setSuccessMsg(null); }}
              className={cn(
                "flex-1 pb-2.5 text-sm font-semibold transition-colors relative",
                tab === t
                  ? "text-brand-red border-b-2 border-brand-red"
                  : "text-text-muted hover:text-text-primary"
              )}
            >
              {t === "login"
                ? isAr ? "تسجيل الدخول" : "Login"
                : isAr ? "إنشاء حساب" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Success message */}
        {successMsg && (
          <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4 text-center">
            {successMsg}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4 text-center">
            {error}
          </p>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3" noValidate>
          {/* First/Last name fields (signup only) */}
          {tab === "signup" && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {isAr ? "الاسم الأول" : "First name"}
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={isAr ? "أحمد" : "John"}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-text-secondary mb-1">
                  {isAr ? "الاسم الأخير" : "Last name"}
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={isAr ? "محمد" : "Doe"}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Email field */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {isAr ? "البريد الإلكتروني" : "Email"}
            </label>
            <input
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAr ? "مثال@بريد.com" : "you@example.com"}
              required
              autoComplete="email"
              className={inputClass}
            />
          </div>

          {/* Password field */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1">
              {isAr ? "كلمة المرور" : "Password"}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              className={inputClass}
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !email || !password}
            className={cn(
              "w-full h-11 rounded-lg text-white text-sm font-semibold transition-all duration-200 font-sans",
              loading || !email || !password
                ? "bg-brand-red/40 cursor-not-allowed opacity-50"
                : "bg-brand-red hover:bg-brand-red-dark active:scale-95 shadow-md hover:shadow-lg"
            )}
          >
            {loading
              ? isAr ? "جاري التحميل..." : "Loading..."
              : tab === "login"
                ? isAr ? "دخول" : "Sign in"
                : isAr ? "إنشاء الحساب" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );

  // Use Portal to render above all other content
  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}
