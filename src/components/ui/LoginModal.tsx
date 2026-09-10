"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/modules/auth";
import { useI18n } from "@/lib/i18n/context";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

type Tab = "login" | "signup";

export function LoginModal({ open, onClose }: LoginModalProps) {
  const { signIn, signUp } = useAuth();
  const { locale } = useI18n();
  const router = useRouter();
  const isAr = locale === "ar";

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setError("");
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setShowPassword(false);
      setTimeout(() => emailRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !mounted) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "login") {
        await signIn(email, password);
        onClose();
        router.push("/profile");
      } else {
        const { session } = await signUp(email, password, { first_name: firstName, last_name: lastName });
        if (!session) {
          alert(isAr ? "تم إنشاء الحساب! افحص بريدك للتأكيد ثم سجل الدخول." : "Account created! Check your email for confirmation.");
          setTab("login");
          setPassword("");
        } else {
          onClose();
          router.push("/profile");
        }
      }
    } catch (err: any) {
      setError(err.message || (isAr ? "حدث خطأ" : "An error occurred"));
    } finally {
      setLoading(false);
    }
  }

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 end-4 text-gray-500 hover:text-gray-900 transition"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="flex justify-center mb-4">
          <img 
            src="/assets/brand/icone-LOGO.png" 
            alt="Logo" 
            className="w-10 h-10 object-contain"
          />
        </div>

        <div className="flex border-b border-gray-200 mb-5">
          {(["login", "signup"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => { setTab(t); setError(""); }}
              className={cn(
                "flex-1 pb-2.5 text-sm font-semibold transition-colors",
                tab === t
                  ? "text-brand-red border-b-2 border-brand-red"
                  : "text-gray-500 hover:text-gray-900"
              )}
            >
              {t === "login"
                ? isAr ? "تسجيل الدخول" : "Login"
                : isAr ? "إنشاء حساب" : "Sign Up"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === "signup" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {isAr ? "الاسم الأول" : "First name"}
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={isAr ? "أحمد" : "John"}
                  disabled={loading}
                  style={{ color: '#000000' }}
                  className="w-full h-11 px-3 border-2 border-gray-300 rounded-lg text-base font-medium focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/30 transition bg-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {isAr ? "الاسم الأخير" : "Last name"}
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder={isAr ? "محمد" : "Doe"}
                  disabled={loading}
                  style={{ color: '#000000' }}
                  className="w-full h-11 px-3 border-2 border-gray-300 rounded-lg text-base font-medium focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/30 transition bg-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
              {isAr ? "البريد الإلكتروني" : "Email"}
            </label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={isAr ? "مثال@بريد.com" : "you@example.com"}
              required
              autoComplete="email"
              disabled={loading}
              style={{ color: '#000000' }}
              className="w-full h-11 px-3 border-2 border-gray-300 rounded-lg text-base font-medium focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/30 transition bg-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
              {isAr ? "كلمة المرور" : "Password"}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={tab === "login" ? "current-password" : "new-password"}
                disabled={loading}
                style={{ color: '#000000' }}
                className="w-full h-11 px-3 pe-11 border-2 border-gray-300 rounded-lg text-base font-medium focus:outline-none focus:border-brand-red focus:ring-2 focus:ring-brand-red/30 transition bg-white placeholder-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute inset-y-0 end-3 flex items-center text-gray-500 hover:text-gray-900 transition disabled:opacity-50"
                tabIndex={-1}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {showPassword ? (
                    <>
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </>
                  ) : (
                    <>
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </>
                  )}
                </svg>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email || !password}
            className={cn(
              "w-full h-12 rounded-lg text-white text-base font-bold transition-all duration-200",
              loading || !email || !password
                ? "bg-red-300 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 active:scale-[0.98] shadow-md hover:shadow-lg"
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

  if (typeof document === "undefined") return null;
  return createPortal(modalContent, document.body);
}