"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/admin/CommandPalette";
import { KeyboardShortcutsHelp } from "@/components/admin/KeyboardShortcutsHelp";
import { AdminOnboarding } from "@/components/admin/AdminOnboarding";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";
import { Command, Menu, X, LogOut } from "lucide-react";

const NAV_LINKS = [
  { href: "/admin",              label: "لوحة التحكم" },
  { href: "/admin/bookings",     label: "الحجوزات" },
  { href: "/admin/leads",        label: "العملاء المحتملون" },
  { href: "/admin/hotels",       label: "الفنادق" },
  { href: "/admin/packages",     label: "الرحلات" },
  { href: "/admin/offers",       label: "العروض الخاصة" },
  { href: "/admin/documents",    label: "المستندات" },
  { href: "/admin/analytics",    label: "التحليلات" },
  { href: "/admin/workflows",    label: "سير العمل" },
  { href: "/admin/visas",        label: "التأشيرات" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [checking,     setChecking]     = useState(true);
  const [staffInfo,    setStaffInfo]    = useState<any>(null);
  const [commandOpen,  setCommandOpen]  = useState(false);
  const [mobileOpen,   setMobileOpen]   = useState(false);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  function navClass(href: string) {
    return `text-sm font-medium transition-colors whitespace-nowrap ${
      isActive(href)
        ? "text-brand-green border-b-2 border-brand-green pb-0.5"
        : "text-text-secondary hover:text-brand-green"
    }`;
  }

  function mobileNavClass(href: string) {
    return `flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
      isActive(href)
        ? "bg-brand-green/10 text-brand-green"
        : "text-text-secondary hover:bg-muted hover:text-brand-green"
    }`;
  }

  useEffect(() => { checkAccess(); }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/admin/login"); return; }

      const { data: staffRecord } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!staffRecord || !["admin", "agent", "reviewer"].includes(staffRecord.role)) {
        router.push("/admin/login");
        return;
      }

      setStaffInfo(staffRecord);
      setChecking(false);
    } catch {
      router.push("/admin/login");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
  }

  const roleLabel: Record<string, string> = {
    admin: "مدير", reviewer: "مراجع", agent: "وكيل",
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-bg-alt flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-brand-green/30 border-t-brand-green rounded-full animate-spin mb-4" />
          <p className="text-sm text-text-muted">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-alt">
      <Toaster position="top-center" richColors />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <KeyboardShortcutsHelp />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-border-light sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">

            {/* Logo */}
            <Link href="/admin" className="flex items-center gap-2 shrink-0">
              <img
                src="/assets/brand/icone-LOGO.png"
                alt="Spanker"
                className="w-8 h-8 object-contain"
              />
              <span className="text-brand-dark font-bold hidden sm:inline">سبانكر</span>
              <span className="text-xs px-2 py-1 rounded-full bg-brand-green/10 text-brand-green font-medium hidden sm:inline">
                لوحة الإدارة
              </span>
            </Link>

            {/* Desktop nav — hidden on small screens */}
            <nav className="hidden lg:flex items-center gap-5 flex-1 justify-center">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={navClass(href)}>
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Command palette trigger — desktop only */}
              <button
                onClick={() => setCommandOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-default hover:bg-muted transition-colors text-sm"
                title="Ctrl+K"
              >
                <Command className="h-4 w-4" />
                <span className="hidden lg:inline">أوامر سريعة</span>
                <kbd className="hidden lg:inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                  Ctrl+K
                </kbd>
              </button>

              {/* User info */}
              <div className="hidden sm:block text-sm text-right leading-tight">
                <p className="font-medium text-text-primary truncate max-w-[100px]">
                  {staffInfo?.full_name || "موظف"}
                </p>
                <p className="text-xs text-text-muted">
                  {roleLabel[staffInfo?.role] ?? staffInfo?.role}
                </p>
              </div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg text-text-secondary hover:bg-muted hover:text-red-500 transition-colors"
                title="تسجيل الخروج"
              >
                <LogOut className="h-4 w-4" />
              </button>

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden p-2 rounded-lg text-text-secondary hover:bg-muted transition-colors"
                aria-label="فتح القائمة"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-border-light bg-white px-4 pb-4 pt-2 shadow-lg">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link key={href} href={href} className={mobileNavClass(href)}>
                  {label}
                </Link>
              ))}
            </nav>

            {/* Command palette trigger inside mobile drawer */}
            <button
              onClick={() => { setCommandOpen(true); setMobileOpen(false); }}
              className="mt-3 flex items-center gap-2 w-full px-4 py-3 rounded-xl border border-border-default text-sm text-text-secondary hover:bg-muted transition-colors"
            >
              <Command className="h-4 w-4" />
              أوامر سريعة
            </button>

            {/* Mobile user info */}
            <div className="mt-3 flex items-center justify-between px-4 py-3 bg-muted/50 rounded-xl">
              <div>
                <p className="font-medium text-sm">{staffInfo?.full_name || "موظف"}</p>
                <p className="text-xs text-text-muted">{roleLabel[staffInfo?.role] ?? staffInfo?.role}</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                خروج
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ── Main ───────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Onboarding — shown once on first visit */}
        <AdminOnboarding />
        {children}
      </main>

      {/* Mobile bottom nav — rendered once here, available on all admin pages */}
      <MobileBottomNav />
    </div>
  );
}
