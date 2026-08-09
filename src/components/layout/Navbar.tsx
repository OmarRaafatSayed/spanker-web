"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { MenuIcon, XIcon, ChevronDownIcon } from "@/components/icons";
import { LoginModal } from "@/components/ui/LoginModal";

export function Navbar() {
  const { t, locale, isRTL, toggleLocale } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);

  // Only the homepage has a full-screen hero behind the navbar
  const isHomePage = pathname === "/";
  // Navbar is "dark" (solid bg, dark text) when scrolled OR not on homepage
  const isDark = isScrolled || !isHomePage;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const NAV_ITEMS: { label: string; href?: string; links: { label: string; href: string }[] }[] = [
    {
      label: t.nav.book,
      links: [
        { label: t.nav.bookFlight, href: "/en-eg/book-flight" },
        { label: t.nav.myBooking, href: "/en-eg/my-booking" },
      ],
    },
    {
      label: t.nav.checkin,
      links: [
        { label: t.nav.onlineCheckin, href: "/en-eg/check-in-online" },
        { label: t.nav.airportCheckin, href: "/en-eg/airport-check-in" },
      ],
    },
    {
      label: t.nav.travelInfo,
      links: [
        { label: t.nav.baggage, href: "/en-eg/baggage" },
        { label: t.nav.seatSelection, href: "/en-eg/seat-selection" },
        { label: t.nav.flightStatus, href: "/en-eg/flight-status" },
        { label: t.nav.routeMap, href: "/en-eg/route-map" },
        { label: t.nav.visaHealth, href: "/en-eg/visa-and-health" },
      ],
    },
    {
      label: t.nav.destinationsOffers,
      href: "/en-eg/special-offers",
      links: [],
    },
    {
      label: t.nav.passengerReviews,
      href: "/en-eg/passenger-reviews",
      links: [],
    },
    {
      label: t.nav.about,
      links: [
        { label: t.nav.aboutAirCairo, href: "/en-eg/about-air-cairo" },
        { label: t.nav.missionVision, href: "/en-eg/mission-vision" },
        { label: t.nav.travelNews, href: "/en-eg/travel-news" },
        { label: t.nav.pressRelease, href: "/en-eg/press-release" },
        { label: t.nav.officeContacts, href: "/en-eg/office-contacts" },
        { label: t.nav.faqs, href: "/en-eg/faqs" },
      ],
    },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isDark ? "bg-white shadow-md" : "bg-transparent"
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-18">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <circle cx="18" cy="18" r="18" fill="#3D6833" />
            <path d="M8 20 L18 10 L28 20 L24 20 L18 14 L12 20 Z" fill="white" />
            <path d="M14 20 L18 16 L22 20 L20 20 L18 18 L16 20 Z" fill="#FDD12A" />
            <rect x="16" y="20" width="4" height="6" rx="1" fill="white" />
          </svg>
          <span className={cn(
            "font-bold text-xl tracking-tight transition-colors duration-300",
            isDark ? "text-brand-red" : "text-white"
          )}>
            {isRTL ? "سبانكر" : "Spanker"}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) =>
            item.href ? (
              // Direct link — no dropdown
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "px-3 py-2 rounded text-sm font-medium transition-colors duration-200",
                  isDark
                    ? "text-text-primary hover:text-brand-red"
                    : "text-white hover:text-white/80"
                )}
              >
                {item.label}
              </Link>
            ) : (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors duration-200",
                  isDark
                    ? "text-text-primary hover:text-brand-red"
                    : "text-white hover:text-white/80"
                )}
              >
                {item.label}
                <ChevronDownIcon size={14} />
              </button>

              {/* Dropdown */}
              <div
                className={cn(
                  "absolute top-full mt-1 w-52 bg-white shadow-lg rounded-lg py-2 z-100",
                  isRTL ? "right-0" : "left-0",
                  "transition-all duration-150 origin-top",
                  openDropdown === item.label
                    ? "opacity-100 scale-y-100 pointer-events-auto"
                    : "opacity-0 scale-y-95 pointer-events-none"
                )}
              >
                {item.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "block px-4 py-2 text-sm text-text-primary hover:bg-bg-alt hover:text-brand-red transition-colors",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            )
          )}
        </div>

        {/* Language Toggle + Login + Mobile */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <button
            onClick={toggleLocale}
            aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold border rounded-full px-4 py-1.5 transition-all duration-200",
              isDark
                ? "border-border-light text-text-primary hover:border-brand-red hover:text-brand-red"
                : "border-white/50 text-white hover:border-white hover:bg-white/10"
            )}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            {locale === "ar" ? "English" : "عربي"}
          </button>

          {/* Auth button — desktop only */}
          <div className="hidden lg:block">
            {user ? (
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-xs font-medium max-w-[120px] truncate",
                  isDark ? "text-text-secondary" : "text-white/80"
                )}>
                  {user.email}
                </span>
                <button
                  onClick={logout}
                  className={cn(
                    "text-xs font-semibold border rounded-full px-3 py-1.5 transition-all duration-200",
                    isDark
                      ? "border-border-light text-text-primary hover:border-red-400 hover:text-red-500"
                      : "border-white/40 text-white hover:border-white/80"
                  )}
                >
                  {locale === "ar" ? "خروج" : "Logout"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className={cn(
                  "text-sm font-semibold rounded-full px-4 py-1.5 transition-all duration-200",
                  isDark
                    ? "bg-brand-red text-white hover:bg-brand-red-dark"
                    : "bg-white/15 text-white border border-white/50 hover:bg-white/25"
                )}
              >
                {locale === "ar" ? "دخول" : "Login"}
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={cn(
              "lg:hidden p-2 rounded transition-colors",
              isDark ? "text-text-primary" : "text-white"
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border-light max-h-[80vh] overflow-y-auto">
          {NAV_ITEMS.map((item) =>
            item.href ? (
              <div key={item.label} className="border-b border-border-light">
                <Link
                  href={item.href}
                  className={cn(
                    "block w-full px-4 py-3 text-sm font-semibold text-text-primary",
                    isRTL ? "text-right" : "text-left"
                  )}
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              </div>
            ) : (
            <div key={item.label} className="border-b border-border-light">
              <button
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-text-primary",
                  isRTL ? "flex-row-reverse" : ""
                )}
                onClick={() =>
                  setOpenDropdown(openDropdown === item.label ? null : item.label)
                }
              >
                {item.label}
                <ChevronDownIcon
                  size={16}
                  className={cn(
                    "transition-transform",
                    openDropdown === item.label ? "rotate-180" : ""
                  )}
                />
              </button>
              {openDropdown === item.label && (
                <div className="bg-bg-alt pb-2">
                  {item.links.map((link) => (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={cn(
                        "block py-2 text-sm text-text-secondary hover:text-brand-red",
                        isRTL ? "pr-6 text-right" : "pl-6 text-left"
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            )
          )}

          {/* Mobile language toggle */}
          <div className={cn("px-4 py-3", isRTL ? "text-right" : "text-left")}>
            <button
              onClick={toggleLocale}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-red"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                <path d="M2 12h20" />
              </svg>
              {locale === "ar" ? "English" : "عربي"}
            </button>
          </div>

          {/* Mobile auth */}
          <div className={cn("px-4 py-3 border-t border-border-light", isRTL ? "text-right" : "text-left")}>
            {user ? (
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-muted truncate max-w-[180px]">{user.email}</span>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="text-xs font-semibold text-red-500"
                >
                  {locale === "ar" ? "خروج" : "Logout"}
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                className="w-full py-2.5 bg-brand-red text-white text-sm font-semibold rounded-lg"
              >
                {locale === "ar" ? "تسجيل الدخول" : "Login"}
              </button>
            )}
          </div>
        </div>
      )}

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </header>
  );
}
