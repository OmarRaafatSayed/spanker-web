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
import { FeatureTour, TourTrigger } from "@/components/admin/FeatureTour";
import {
  Command, Menu, X, LogOut,
  LayoutDashboard, BookOpen, Users, Hotel,
  Map, Tag, FileText, BarChart3, Settings2,
  ShieldCheck, ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/admin",              label: "لوحة التحكم",       icon: LayoutDashboard },
  { href: "/admin/bookings",     label: "الحجوزات",          icon: BookOpen },
  { href: "/admin/leads",        label: "العملاء المحتملون", icon: Users },
  { href: "/admin/hotels",       label: "الفنادق",           icon: Hotel },
  { href: "/admin/packages",     label: "الرحلات",           icon: Map },
  { href: "/admin/offers",       label: "العروض الخاصة",     icon: Tag },
  { href: "/admin/documents",    label: "المستندات",         icon: FileText },
  { href: "/admin/analytics",    label: "التحليلات",         icon: BarChart3 },
  { href: "/admin/workflows",    label: "سير العمل",         icon: Settings2 },
  { href: "/admin/visas",        label: "التأشيرات",         icon: ShieldCheck },
];

const SIDEBAR_W = "w-60";  // expanded width
const SIDEBAR_W_COL = "w-16"; // collapsed width

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [checking,    setChecking]    = useState(true);
  const [staffInfo,   setStaffInfo]   = useState<{ full_name?: string; role?: string } | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [mobileOpen,  setMobileOpen]  = useState(false);
  const [collapsed,   setCollapsed]   = useState(false);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  useEffect(() => { checkAccess(); }, []);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  async function checkAccess() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/admin/login"); return; }
      const { data: staffRecord } = await supabase
        .from("profiles").select("role, full_name").eq("user_id", user.id).maybeSingle();
      if (!staffRecord || !["admin", "agent", "reviewer"].includes(staffRecord.role)) {
        router.push("/admin/login"); return;
      }
      setStaffInfo({ full_name: staffRecord.full_name ?? undefined, role: staffRecord.role ?? undefined });
      setChecking(false);
    } catch { router.push("/admin/login"); }
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
    <div className="min-h-screen bg-bg-alt" dir="rtl">
      <Toaster position="top-center" richColors />
      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
      <KeyboardShortcutsHelp />

      {/* ─────────────────────────────────────────────────────────────────
          DESKTOP SIDEBAR  (hidden on mobile — lg:flex)
          ───────────────────────────────────────────────────────────────── */}
      <aside className={cn(
        "hidden lg:flex flex-col fixed top-0 right-0 bottom-0 z-40",
        "bg-white border-l border-border-light shadow-sm",
        "transition-all duration-200 ease-in-out",
        collapsed ? SIDEBAR_W_COL : SIDEBAR_W
      )}>

        {/* Logo */}
        <div className={cn(
          "flex items-center gap-2.5 h-16 px-4 border-b border-border-light shrink-0",
          collapsed && "justify-center px-0"
        )}>
          <img src="/assets/brand/icone-LOGO.png" alt="Spanker" className="w-8 h-8 object-contain shrink-0" />
          {!collapsed && (
            <div className="overflow-hidden">
              <p className="font-black text-brand-dark text-sm leading-tight">سبانكر</p>
              <p className="text-[10px] text-brand-green font-semibold">لوحة الإدارة</p>
            </div>
          )}
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                title={collapsed ? label : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all group",
                  active
                    ? "bg-brand-green text-white shadow-sm"
                    : "text-text-secondary hover:bg-brand-green/8 hover:text-brand-green",
                  collapsed && "justify-center px-0"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", active ? "text-white" : "text-text-muted group-hover:text-brand-green")} />
                {!collapsed && <span className="truncate">{label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: user + collapse toggle */}
        <div className="border-t border-border-light px-2 py-3 space-y-1 shrink-0">
          {/* Command palette */}
          <button
            onClick={() => setCommandOpen(true)}
            title={collapsed ? "أوامر سريعة" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 w-full text-sm font-medium transition-all",
              "text-text-secondary hover:bg-muted hover:text-brand-green",
              collapsed && "justify-center px-0"
            )}
          >
            <Command className="w-5 h-5 shrink-0 text-text-muted" />
            {!collapsed && (
              <span className="flex-1 text-right">أوامر سريعة</span>
            )}
            {!collapsed && (
              <kbd className="hidden xl:inline-flex h-5 select-none items-center rounded border bg-muted px-1.5 font-mono text-[10px] font-medium">
                Ctrl+K
              </kbd>
            )}
          </button>

          {/* User info */}
          {!collapsed && (
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-muted/50">
              <div className="w-8 h-8 rounded-full bg-brand-green/20 flex items-center justify-center text-brand-green font-bold text-sm shrink-0">
                {(staffInfo?.full_name ?? "م")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{staffInfo?.full_name ?? "موظف"}</p>
                <p className="text-xs text-text-muted">{roleLabel[staffInfo?.role ?? ""] ?? staffInfo?.role}</p>
              </div>
              <button onClick={handleLogout} title="تسجيل الخروج"
                className="p-1.5 rounded-lg text-text-muted hover:text-red-500 hover:bg-red-50 transition-all">
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {collapsed && (
            <button onClick={handleLogout} title="تسجيل الخروج"
              className="flex items-center justify-center w-full py-2 rounded-xl text-text-muted hover:text-red-500 hover:bg-red-50 transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          )}

          {/* Collapse toggle */}
          <div className="flex items-center gap-1">
            <TourTrigger pathname={pathname} className="flex-1 justify-start" />
            <button
              onClick={() => setCollapsed(v => !v)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 flex-1 text-xs font-medium transition-all",
                "text-text-muted hover:bg-muted hover:text-text-secondary",
                collapsed && "justify-center px-0"
              )}
            >
              <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
              {!collapsed && <span>طي القائمة</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* ─────────────────────────────────────────────────────────────────
          MOBILE TOPBAR  (only on mobile — lg:hidden)
          ───────────────────────────────────────────────────────────────── */}
      <header className="lg:hidden bg-white border-b border-border-light sticky top-0 z-40">
        <div className="px-4 h-14 flex items-center justify-between gap-3">
          <Link href="/admin" className="flex items-center gap-2">
            <img src="/assets/brand/icone-LOGO.png" alt="Spanker" className="w-7 h-7 object-contain" />
            <span className="font-bold text-brand-dark text-sm">سبانكر</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={() => setCommandOpen(true)}
              className="p-2 rounded-lg text-text-secondary hover:bg-muted transition-all">
              <Command className="w-5 h-5" />
            </button>
            <button onClick={() => setMobileOpen(v => !v)}
              className="p-2 rounded-lg text-text-secondary hover:bg-muted transition-all">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div className="border-t border-border-light bg-white px-4 pb-4 pt-2 shadow-lg">
            <nav className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                    isActive(href)
                      ? "bg-brand-green/10 text-brand-green"
                      : "text-text-secondary hover:bg-muted hover:text-brand-green"
                  )}>
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 flex items-center justify-between px-4 py-3 bg-muted/50 rounded-xl">
              <div>
                <p className="font-medium text-sm">{staffInfo?.full_name ?? "موظف"}</p>
                <p className="text-xs text-text-muted">{roleLabel[staffInfo?.role ?? ""] ?? staffInfo?.role}</p>
              </div>
              <button onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors">
                <LogOut className="w-4 h-4" /> خروج
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ─────────────────────────────────────────────────────────────────
          MAIN CONTENT — offset by sidebar width on desktop
          ───────────────────────────────────────────────────────────────── */}
      <main className={cn(
        "transition-all duration-200 ease-in-out",
        // On desktop: push content left to make room for the sidebar (sidebar is on the RIGHT in RTL)
        collapsed ? "lg:mr-16" : "lg:mr-60",
        // Padding
        "px-4 sm:px-6 py-6 pb-24 lg:pb-6"
      )}>
        <AdminOnboarding />
        {children}
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav />

      {/* Feature tour — shows once per section */}
      <FeatureTour pathname={pathname} />
    </div>
  );
}
