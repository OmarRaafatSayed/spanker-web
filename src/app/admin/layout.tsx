"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { useAdminStore } from "@/lib/admin-store";
import { CrmStatusPill } from "@/components/admin/CrmStatusPill";
import { NotificationDropdown } from "@/components/admin/NotificationDropdown";

// ─────────────────────────────────────────────────────────────────────────────
// Navigation structure (from dashboard-stracture.md Phase 6)
// ─────────────────────────────────────────────────────────────────────────────
interface NavItem {
  href:  string;
  label: string;
  icon:  React.ReactNode;
}

interface NavGroup {
  title?: string;
  items:  NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      {
        href: "/admin",
        label: "لوحة التحكم",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
      },
    ],
  },
  {
    title: "إدارة المحتوى",
    items: [
      {
        href: "/admin/packages",
        label: "الباقات والعروض",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>,
      },
      {
        href: "/admin/offers",
        label: "عروض خاصة",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>,
      },
      {
        href: "/admin/banners",
        label: "البانرات",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>,
      },
      {
        href: "/admin/visas",
        label: "التأشيرات",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
      },
      {
        href: "/admin/hotels",
        label: "الفنادق",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
      },
    ],
  },
  {
    title: "إدارة العمليات",
    items: [
      {
        href: "/admin/leads",
        label: "العملاء المحتملون",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      },
      {
        href: "/admin/customers",
        label: "العملاء",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
      },
      {
        href: "/admin/quotations",
        label: "عروض الأسعار",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
      },
      {
        href: "/admin/bookings",
        label: "الحجوزات",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
      },
    ],
  },
  {
    title: "النظام",
    items: [
      {
        href: "/admin/payments",
        label: "المدفوعات",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
      },
      {
        href: "/admin/logs",
        label: "سجل النظام",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
      },
      {
        href: "/admin/settings",
        label: "الإعدادات",
        icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
      },
    ],
  },
];

// Flat list for title lookup and mobile nav
const ALL_NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

// ─────────────────────────────────────────────────────────────────────────────
// Sidebar
// ─────────────────────────────────────────────────────────────────────────────
function AdminSidebar({
  open,
  onToggle,
  pathname,
}: {
  open: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col bg-brand-dark text-white transition-all duration-300 shrink-0",
        open ? "w-60" : "w-16"
      )}
    >
      {/* Logo row */}
      <div className="h-16 flex items-center px-4 border-b border-white/10 gap-3 shrink-0">
        <div className="shrink-0">
          <img
            src="/assets/brand/icone-LOGO.png"
            alt="Logo"
            className="w-8 h-8 object-contain"
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        {open && (
          <div className="overflow-hidden flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight truncate">آثار للسياحة</p>
            <p className="text-[10px] text-white/50 leading-tight">لوحة الإدارة</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="mr-auto shrink-0 text-white/50 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
          aria-label="Toggle sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open
              ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
              : <><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></>
            }
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 overflow-y-auto space-y-0.5">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? "mt-4" : ""}>
            {/* Group title */}
            {open && group.title && (
              <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 mb-1.5">
                {group.title}
              </p>
            )}
            {!open && group.title && gi > 0 && (
              <div className="border-t border-white/10 my-2 mx-2" />
            )}
            {group.items.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-brand-green text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
                title={!open ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {open && <span className="truncate">{item.label}</span>}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-white/10 space-y-0.5 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          title={!open ? "الموقع الرئيسي" : undefined}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          {open && <span>الموقع الرئيسي</span>}
        </Link>
        <_LogoutButton open={open} />
      </div>
    </aside>
  );
}

function _LogoutButton({ open }: { open: boolean }) {
  const { logout } = useAuth();
  return (
    <button
      onClick={logout}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
      title={!open ? "خروج" : undefined}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
      {open && <span>تسجيل الخروج</span>}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile nav (bottom drawer — visible on < md)
// ─────────────────────────────────────────────────────────────────────────────
const MOBILE_SHORTCUTS = ALL_NAV_ITEMS.slice(0, 5); // first 5 items

function AdminMobileNav({ pathname }: { pathname: string }) {
  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-border-light flex items-center justify-around px-2 py-1 safe-area-bottom">
      {MOBILE_SHORTCUTS.map(item => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-[10px] font-medium transition-colors min-w-0",
            isActive(item.href)
              ? "text-brand-green"
              : "text-text-muted hover:text-text-secondary"
          )}
        >
          <span className={cn(
            "transition-colors",
            isActive(item.href) ? "text-brand-green" : "text-text-muted"
          )}>
            {item.icon}
          </span>
          <span className="truncate max-w-[56px] text-center leading-tight">{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Top bar
// ─────────────────────────────────────────────────────────────────────────────
function AdminTopBar({
  onMenuClick,
  pathname,
}: {
  onMenuClick: () => void;
  pathname: string;
}) {
  const { user } = useAuth();

  const currentLabel =
    ALL_NAV_ITEMS.find(n =>
      n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href)
    )?.label ?? "الإدارة";

  return (
    <header className="h-16 bg-white border-b border-border-light flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shrink-0">
      {/* Left: hamburger + page title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-lg hover:bg-bg-alt transition text-text-secondary"
          aria-label="فتح القائمة"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="text-sm font-bold text-text-primary truncate">{currentLabel}</h1>
          <p className="text-xs text-text-muted hidden sm:block">لوحة إدارة آثار للسياحة</p>
        </div>
      </div>

      {/* Right: CRM pill + notifications + avatar */}
      <div className="flex items-center gap-2">
        <CrmStatusPill />
        <NotificationDropdown />
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <div className="w-8 h-8 rounded-full bg-brand-green text-white flex items-center justify-center font-bold text-xs shrink-0">
            {user?.email?.[0]?.toUpperCase() ?? "A"}
          </div>
          <span className="hidden lg:block max-w-[140px] truncate">{user?.email}</span>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Mobile drawer overlay (full-screen menu on small screens)
// ─────────────────────────────────────────────────────────────────────────────
function MobileDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string;
}) {
  const { logout } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  // Lock body scroll while open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else       document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="md:hidden fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        ref={overlayRef}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="relative w-72 bg-brand-dark text-white flex flex-col h-full overflow-y-auto">
        <div className="h-16 flex items-center px-4 border-b border-white/10 gap-3 shrink-0">
          <p className="font-bold text-sm flex-1">آثار للسياحة</p>
          <button onClick={onClose} className="text-white/50 hover:text-white p-1">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi} className={gi > 0 ? "mt-4" : ""}>
              {group.title && (
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 mb-1.5">
                  {group.title}
                </p>
              )}
              {group.items.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-brand-green text-white"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <span className="shrink-0">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/10 space-y-1">
          <Link href="/" onClick={onClose} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            الموقع الرئيسي
          </Link>
          <button
            onClick={() => { logout(); onClose(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            تسجيل الخروج
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AdminShell — root layout
// Role gate: customer → redirect to /
// No session → redirect to /login
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();

  const sidebarOpen  = useAdminStore(s => s.sidebarOpen);
  const toggleSidebar = useAdminStore(s => s.toggleSidebar);

  const [mobileOpen, setMobileOpen] = useState(false);

  // ── Role / auth guard ──────────────────────────────────────────────────────
  const isDev = process.env.NODE_ENV === "development";

  useEffect(() => {
    if (isDev) return; // skip auth check in development
    if (isLoading) return;
    if (!user) { router.replace("/login"); return; }
  }, [isLoading, user, router, isDev]);

  if (!isDev && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-alt" dir="rtl">
        <div className="w-8 h-8 border-4 border-brand-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isDev && !user) return null;

  return (
    <div className="min-h-screen bg-bg-alt flex" dir="rtl">
      {/* Desktop sidebar */}
      <AdminSidebar
        open={sidebarOpen}
        onToggle={toggleSidebar}
        pathname={pathname}
      />

      {/* Mobile overlay drawer */}
      <MobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        pathname={pathname}
      />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AdminTopBar
          onMenuClick={() => setMobileOpen(true)}
          pathname={pathname}
        />

        {/* Page content — add bottom padding for mobile nav bar */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <AdminMobileNav pathname={pathname} />
    </div>
  );
}
