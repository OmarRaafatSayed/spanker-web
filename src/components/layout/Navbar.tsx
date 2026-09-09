"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/modules/auth";
import { LoginModal } from "@/components/ui/LoginModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavLink { label: string; href: string }
interface NavItem { label: string; href?: string; links?: NavLink[] }

const HOVER_OPEN_DELAY = 80;
const HOVER_CLOSE_DELAY = 220;

// ─── Nav structure ────────────────────────────────────────────────────────────
// ✅ FIX #6: اللينكات بقت نسبية، والـ locale بيتضاف ديناميكياً
function useNavItems(locale: string): NavItem[] {
  const { t } = useI18n();
  const p = (path: string) => `/${locale}${path}`;

  return [
    {
      label: t.nav.book,
      links: [
        { label: t.nav.bookFlight, href: p("/book-flight")      },
        { label: t.nav.bookHotel,  href: p("/hotel-booking")    },
        { label: t.nav.bookVisa,   href: p("/visa-application") },
        { label: t.nav.bookTours,  href: p("/tours")            },
        { label: t.nav.myBooking,  href: p("/my-booking")       },
      ],
    },
    {
      label: t.nav.checkin,
      links: [
        { label: t.nav.onlineCheckin,  href: p("/check-in-online") },
        { label: t.nav.airportCheckin, href: p("/airport-check-in") },
      ],
    },
    {
      label: t.nav.travelInfo,
      links: [
        { label: t.nav.baggage,       href: p("/baggage") },
        { label: t.nav.seatSelection, href: p("/seat-selection") },
        { label: t.nav.flightStatus,  href: p("/flight-status") },
        { label: t.nav.routeMap,      href: p("/route-map") },
        { label: t.nav.visaHealth,    href: p("/visa-and-health") },
      ],
    },
    { label: t.nav.destinationsOffers, href: p("/special-offers") },
    { label: t.nav.passengerReviews,   href: p("/passenger-reviews") },
    {
      label: t.nav.about,
      links: [
        { label: t.nav.aboutAirCairo,  href: p("/about-air-cairo") },
        { label: t.nav.missionVision,  href: p("/mission-vision") },
        { label: t.nav.travelNews,     href: p("/travel-news") },
        { label: t.nav.pressRelease,   href: p("/press-release") },
        { label: t.nav.officeContacts, href: p("/office-contacts") },
        { label: t.nav.faqs,           href: p("/faqs") },
      ],
    },
  ];
}

// ─── Chevron icon (shared) ────────────────────────────────────────────────────
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" aria-hidden="true"
      className={cn("transition-transform duration-200 shrink-0", open && "rotate-180")}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// ─── Dropdown (Desktop) ───────────────────────────────────────────────────────
function Dropdown({ item, id }: { item: NavItem; id: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  // ✅ FIX #3: delay عشان القائمة متقفلش لما الماوس يتحرك شوية
  const openMenu = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(true), HOVER_OPEN_DELAY);
  }, []);

  const closeMenu = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  }, []);

  useEffect(() => clearTimer, []);

  // ✅ FIX #8: قفل بـ Escape + click outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!item.links?.length) return null;

  return (
    // ✅ FIX #2: `relative` بدل `fixed inset-0`
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocus={openMenu}
      onBlur={closeMenu}
    >
      {/* ✅ FIX #9: onClick للتاتش + aria صحيح */}
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={`${id}-menu`}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg",
          "transition-colors whitespace-nowrap",
          open
            ? "text-white bg-white/15"
            : "text-white/90 hover:text-white hover:bg-white/10"
        )}
      >
        {item.label}
        <Chevron open={open} />
      </button>

      {/* ✅ FIX #2: absolute طبيعي + start-0 للـ RTL (FIX #5) */}
      <div
        id={`${id}-menu`}
        role="menu"
        aria-labelledby={id}
        className={cn(
          "absolute start-0 top-full pt-2 z-50 min-w-[240px]",
          "origin-top transition-all duration-150",
          open
            ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
            : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
        )}
      >
        <div className="bg-[#1a3a1f] border border-white/15 rounded-xl shadow-2xl overflow-hidden py-1">
          {item.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export function Navbar() {
  const { t, locale, toggleLocale } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const navItems = useNavItems(locale);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isRtl = locale === "ar";
  const userName = (user as { first_name?: string; email: string } | null);

  // قفل الـ menu عند تغيير الصفحة
  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ✅ FIX #8: body scroll lock + Escape للـ mobile menu
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileOpen]);

  return (
    <>
      {/* ✅ FIX #1: شيلنا overflow-x-hidden من هنا */}
      {/* ✅ FIX #4: dir ديناميكي حسب اللغة */}
      <header
        dir={isRtl ? "rtl" : "ltr"}
        className={cn(
          "fixed top-0 inset-x-0 z-[100] h-16 bg-brand-dark",
          "transition-shadow duration-300",
          scrolled && "shadow-lg shadow-black/30"
        )}
      >
        <div className="max-w-7xl mx-auto h-full px-2 sm:px-4 lg:px-8 flex items-center justify-between gap-2">

          {/* ── Logo ── */}
          {/* ✅ FIX #7: next/image بدل img */}
          <Link href={`/${locale}`} className="shrink-0 hover:opacity-85 transition-opacity">
            <Image
              src="/width-logo.png"
              alt="Spanker"
              width={100}
              height={34}
              priority
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* ── Desktop nav ── */}
          <nav
            aria-label="Main navigation"
            className="hidden lg:flex items-center gap-0.5 flex-1 justify-center min-w-0"
          >
            {navItems.map((item, i) =>
              item.links?.length ? (
                <Dropdown key={item.label} item={item} id={`nav-dd-${i}`} />
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap",
                    pathname === item.href
                      ? "text-white bg-white/15"
                      : "text-white/90 hover:text-white hover:bg-white/10"
                  )}
                >
                  {item.label}
                </Link>
              )
            )}
          </nav>

          {/* ── Right / End side ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle */}
            <button
              type="button"
              onClick={toggleLocale}
              className="h-8 px-3 rounded-full border border-white/25 text-xs font-bold text-white hover:bg-white/10 transition-colors"
              aria-label={isRtl ? "Switch to English" : "التبديل للعربية"}
            >
              {isRtl ? "EN" : "ع"}
            </button>

            {/* Auth */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-white/80 max-w-[140px] truncate">
                  {userName?.first_name ?? userName?.email}
                </span>
                <button
                  type="button"
                  onClick={logout}
                  className="h-8 px-3 text-xs font-semibold border border-white/25 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  {t.common.logout}
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="lg:hidden h-8 px-3 text-xs font-semibold bg-brand-green text-white rounded-xl hover:bg-brand-green-dark transition-colors shadow-sm"
                >
                  {t.common.login}
                </button>
                <button
                  type="button"
                  onClick={() => setLoginOpen(true)}
                  className="hidden lg:inline-flex h-9 px-4 text-sm font-semibold bg-brand-green text-white rounded-xl hover:bg-brand-green-dark transition-colors shadow-sm"
                >
                  {t.common.login}
                </button>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label={mobileOpen ? t.common.closeMenu : t.common.openMenu}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                  <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ✅ FIX #1: الـ mobile menu بقى OUTSIDE الـ header — مش جواه */}
      {/* ده أهم تغيير: لما كان جوه header بـ overflow، كان بيتقص */}
      <div
        id="mobile-menu"
        className={cn(
          "lg:hidden fixed top-16 inset-x-0 bottom-0 z-[99]",
          "bg-brand-dark border-t border-white/10 shadow-2xl",
          "overflow-y-auto overflow-x-hidden overscroll-contain",
          "transition-[opacity,transform] duration-200",
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        )}
        dir={isRtl ? "rtl" : "ltr"}
        aria-hidden={!mobileOpen}
      >
        <div className="px-4 py-3 space-y-1">
          {navItems.map((item) => {
            const expanded = mobileExpanded === item.label;
            return (
              <div key={item.label}>
                {item.links?.length ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setMobileExpanded(expanded ? null : item.label)}
                      aria-expanded={expanded}
                      className="w-full flex items-center justify-between gap-2 px-3 py-3 text-sm font-semibold text-white/90 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <span>{item.label}</span>
                      <Chevron open={expanded} />
                    </button>

                    {/* ✅ FIX #5: logical properties بدل mr/pr/border-r */}
                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-200",
                        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="ms-4 mt-1 space-y-0.5 border-s border-white/15 ps-3">
                          {item.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMobileOpen(false)}
                              className="block px-3 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-3 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}

          {/* Mobile auth */}
          <div className="pt-3 border-t border-white/10 mt-3">
            {user ? (
              <div className="flex items-center justify-between gap-2 px-3 py-2">
                <span className="text-sm text-white/70 truncate">
                  {userName?.first_name ?? userName?.email}
                </span>
                <button
                  type="button"
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="text-sm font-semibold text-red-400 hover:text-red-300 shrink-0"
                >
                  {t.common.logout}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                className="w-full h-11 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-brand-green-dark transition-colors"
              >
                {t.common.login}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Backdrop */}
      <div
        onClick={() => setMobileOpen(false)}
        className={cn(
          "lg:hidden fixed inset-0 z-[98] bg-black/50 transition-opacity duration-200",
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        aria-hidden="true"
      />

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
