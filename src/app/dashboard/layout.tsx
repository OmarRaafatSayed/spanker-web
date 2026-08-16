"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useI18n } from "@/lib/i18n/context";

// ─── Nav items ────────────────────────────────────────────────────────────────
const NAV = [
  {
    href: "/dashboard",
    ar: "الرئيسية",
    en: "Home",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    href: "/dashboard/travel",
    ar: "طلبات السفر",
    en: "Travel",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      </svg>
    ),
  },
  {
    href: "/dashboard/visa",
    ar: "طلبات الفيزا",
    en: "Visa",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>
    ),
  },
  {
    href: "/dashboard/payments",
    ar: "المدفوعات",
    en: "Payments",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    href: "/dashboard/profile",
    ar: "حسابي",
    en: "Profile",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
];

// ─── Layout ───────────────────────────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, logout } = useAuth();
  const { locale } = useI18n();
  const router   = useRouter();
  const pathname = usePathname();
  const isAr     = locale === "ar";

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-alt">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

  const initials = (user as { first_name?: string; email: string }).first_name?.[0]?.toUpperCase()
    ?? user.email[0].toUpperCase();

  return (
    <div className="min-h-screen bg-bg-alt" dir={isAr ? "rtl" : "ltr"}>

      {/* ── Top bar ── */}
      <header className="sticky top-0 z-40 h-14 bg-white border-b border-border-light flex items-center px-4">
        <div className="flex-1 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/width-logo.png" alt="Spanker" className="h-7 w-auto object-contain" />
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-bg-alt">
            <div className="w-6 h-6 rounded-full bg-brand-green text-white text-xs font-bold flex items-center justify-center">
              {initials}
            </div>
            <span className="text-xs text-text-secondary max-w-[160px] truncate">{user.email}</span>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 h-8 px-3 text-xs font-medium text-text-secondary hover:text-red-600 hover:bg-red-50 rounded-lg border border-border-light transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            {isAr ? "خروج" : "Logout"}
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-5 flex gap-5">

        {/* ── Desktop sidebar ── */}
        <aside className="hidden md:block w-52 shrink-0">
          <div className="bg-white rounded-2xl border border-border-light p-2 sticky top-20">
            <nav className="space-y-0.5">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-brand-green text-white"
                      : "text-text-secondary hover:bg-bg-alt hover:text-text-primary"
                  )}
                >
                  {item.icon}
                  {isAr ? item.ar : item.en}
                </Link>
              ))}
            </nav>
            <div className="mt-2 pt-2 border-t border-border-light">
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-muted hover:bg-bg-alt hover:text-text-primary transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 5l-7 7 7 7" />
                </svg>
                {isAr ? "العودة للموقع" : "Back to site"}
              </Link>
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="flex-1 min-w-0 pb-24 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border-light safe-area-bottom">
        <div className="flex">
          {NAV.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-brand-green" : "text-text-muted"
                )}
              >
                <span className={cn(
                  "p-1 rounded-lg transition-colors",
                  active && "bg-brand-green/10"
                )}>
                  {item.icon}
                </span>
                <span>{isAr ? item.ar : item.en}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </div>
  );
}
