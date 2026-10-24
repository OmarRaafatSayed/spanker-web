"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/modules/auth";
import { LoginModal } from "@/components/ui/LoginModal";

interface NavLink { label: string; href: string }
interface NavItem { label: string; href?: string; links?: NavLink[] }

const HOVER_OPEN_DELAY = 80;
const HOVER_CLOSE_DELAY = 220;

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

function Dropdown({ item, id }: { item: NavItem; id: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const openMenu = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(true), HOVER_OPEN_DELAY);
  }, []);

  const closeMenu = useCallback(() => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  }, []);

  useEffect(() => clearTimer, []);

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
    <div
      ref={ref}
      className="relative"
      onMouseEnter={openMenu}
      onMouseLeave={closeMenu}
      onFocus={openMenu}
      onBlur={closeMenu}
    >
      <button
        type="button"
        id={id}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={`${id}-menu`}
        className={cn(
          "flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-full",
          "transition-all whitespace-nowrap",
          open
            ? "bg-white/25"
            : "hover:bg-white/20"
        )}
        style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
      >
        {item.label}
        <Chevron open={open} />
      </button>

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
        <div className="bg-white border border-[#3D6833]/15 rounded-xl shadow-2xl overflow-hidden py-2">
          {item.links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-sm font-medium transition-all hover:bg-[#3D6833]/08"
              style={{ color: "#1b4332" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Navbar({ announcementH = 0 }: { announcementH?: number }) {
  const { t, locale, toggleLocale } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const navItems = useNavItems(locale);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const isRtl = locale === "ar";
  const userName = (user as { first_name?: string; email: string; avatar_url?: string | null } | null);

  useEffect(() => {
    setMobileOpen(false);
    setMobileExpanded(null);
  }, [pathname]);

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
      <header
        dir={isRtl ? "rtl" : "ltr"}
        className="fixed inset-x-0 z-[100] pointer-events-none"
        style={{ top: announcementH + 12 }}
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Floating pill */}
          <div
            className="pointer-events-auto flex items-center justify-between h-14 gap-4 px-4 sm:px-5"
            style={{
              borderRadius: "9999px",
              background: "rgba(255,255,255,0.10)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.20)",
              boxShadow: "0 2px 12px rgba(0,0,0,0.10)",
            }}
          >
            {/* Logo */}
            <Link 
              href={`/${locale}`} 
              className="shrink-0 hover:opacity-90 transition-opacity"
            >
              <Image
                src="/width-logo.png"
                alt="Spanker"
                width={120}
                height={40}
                priority
                className="h-9 sm:h-10 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation - Centered */}
            <nav
              aria-label="Main navigation"
              className="hidden lg:flex items-center gap-1 flex-1 justify-center"
            >
              {navItems.map((item, i) =>
                item.links?.length ? (
                  <Dropdown key={item.label} item={item} id={`nav-dd-${i}`} />
                ) : (
                  <Link
                    key={item.label}
                    href={item.href!}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-full transition-all whitespace-nowrap",
                      pathname === item.href
                        ? "bg-white/25"
                        : "hover:bg-white/20"
                    )}
                    style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLocale}
                className="h-9 w-9 rounded-full text-sm font-bold transition-all flex items-center justify-center"
                style={{ background: "#F5C518", color: "#0d1f0d" }}
                aria-label={isRtl ? "Switch to English" : "التبديل للعربية"}
              >
                {isRtl ? "EN" : "ع"}
              </button>

              {/* User Profile or Login */}
              {user ? (
                <div className="relative group">
                  <Link
                    href="/profile"
                    className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden transition-all shadow-sm ring-2 ring-[#3D6833]/30 hover:ring-[#3D6833]/60"
                    style={{ background: "#3D6833" }}
                  >
                    {userName?.avatar_url ? (
                      <img
                        src={userName.avatar_url}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.85)" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                      </svg>
                    )}
                  </Link>
                  <div className="absolute end-0 top-full pt-2 hidden group-hover:block z-50">
                    <div className="bg-white border border-[#3D6833]/15 rounded-xl shadow-2xl overflow-hidden py-1 min-w-[200px]">
                      <Link
                        href="/profile"
                        className="block px-4 py-3 text-sm transition-colors hover:bg-[#3D6833]/08"
                        style={{ color: "#1b4332" }}
                      >
                        {isRtl ? 'الملف الشخصي' : 'Profile'}
                      </Link>
                      <div className="h-px bg-[#3D6833]/10 my-1" />
                      <button
                        type="button"
                        onClick={logout}
                        className="w-full text-start px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        {t.common.logout}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setLoginOpen(true)}
                    className="lg:hidden inline-flex items-center justify-center h-9 px-3 text-xs font-bold rounded-lg transition-all"
                    style={{ background: "#F5C518", color: "#0d1f0d" }}
                  >
                    {t.common.login}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginOpen(true)}
                    className="hidden lg:inline-flex items-center justify-center h-9 px-5 text-sm font-bold rounded-lg transition-all"
                    style={{ background: "#F5C518", color: "#0d1f0d" }}
                  >
                    {t.common.login}
                  </button>
                </>
              )}

              {/* Mobile Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                className="lg:hidden p-2 rounded-full transition-all hover:bg-white/20"
                style={{ color: "#fff" }}
                aria-label={mobileOpen ? t.common.closeMenu : t.common.openMenu}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
              >
                {mobileOpen ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                  </svg>
                )}
              </button>
            </div>
          </div>{/* end pill */}
        </div>{/* end max-w container */}
      </header>

      <div
        id="mobile-menu"
        className={cn(
          "lg:hidden fixed inset-x-0 bottom-0 z-[99]",
          "bg-white/95 border-t border-[#3D6833]/20 shadow-2xl",
          "overflow-y-auto overflow-x-hidden overscroll-contain",
          "transition-[opacity,transform] duration-200",
          mobileOpen
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-2 pointer-events-none"
        )}
        style={{ top: announcementH + 68, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        dir={isRtl ? "rtl" : "ltr"}
        aria-hidden={!mobileOpen}
      >
        <div className="px-4 py-4 space-y-1">
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
                      className="w-full flex items-center justify-between gap-2 px-4 py-3 text-sm font-semibold rounded-lg hover:bg-[#3D6833]/08 transition-all"
                      style={{ color: "#1b4332" }}
                    >
                      <span>{item.label}</span>
                      <Chevron open={expanded} />
                    </button>

                    <div
                      className={cn(
                        "grid transition-[grid-template-rows] duration-200",
                        expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      )}
                    >
                      <div className="overflow-hidden">
                        <div className="ms-4 mt-1 space-y-1 border-s-2 border-[#3D6833]/25 ps-4">
                          {item.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              onClick={() => setMobileOpen(false)}
                              className="block px-3 py-2.5 text-sm font-medium rounded-lg transition-all hover:bg-[#3D6833]/08"
                              style={{ color: "#2d5128" }}
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
                    className="block px-4 py-3 text-sm font-semibold rounded-lg hover:bg-[#3D6833]/08 transition-all"
                    style={{ color: "#1b4332" }}
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}

          <div className="pt-4 border-t border-[#3D6833]/15 mt-4">
            {user ? (
              <div className="space-y-2">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-[#3D6833]/08 transition-all"
                >
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: "#3D6833" }}>
                    {userName?.avatar_url ? (
                      <img src={userName.avatar_url} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" fill="rgba(255,255,255,0.85)" />
                        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="rgba(255,255,255,0.85)" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: "#1b4332" }}>
                      {userName?.first_name ?? userName?.email}
                    </div>
                    <div className="text-xs" style={{ color: "#3D6833" }}>{isRtl ? 'عرض الملف الشخصي' : 'View profile'}</div>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="w-full text-start px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-all"
                >
                  {t.common.logout}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                className="w-full h-12 text-white text-sm font-semibold rounded-xl transition-all shadow-md"
                style={{ background: "#3D6833" }}
              >
                {t.common.login}
              </button>
            )}
          </div>
        </div>
      </div>

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


