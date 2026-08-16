"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { LoginModal } from "@/components/ui/LoginModal";

// ─── Nav structure ────────────────────────────────────────────────────────────
interface NavLink  { label: string; href: string }
interface NavItem  { label: string; href?: string; links?: NavLink[] }

function useNavItems() {
  const { t } = useI18n();
  const items: NavItem[] = [
    {
      label: t.nav.book,
      links: [
        { label: t.nav.bookFlight,  href: "/en-eg/book-flight"  },
        { label: t.nav.myBooking,   href: "/en-eg/my-booking"   },
      ],
    },
    {
      label: t.nav.checkin,
      links: [
        { label: t.nav.onlineCheckin,  href: "/en-eg/check-in-online"  },
        { label: t.nav.airportCheckin, href: "/en-eg/airport-check-in" },
      ],
    },
    {
      label: t.nav.travelInfo,
      links: [
        { label: t.nav.baggage,      href: "/en-eg/baggage"         },
        { label: t.nav.seatSelection,href: "/en-eg/seat-selection"  },
        { label: t.nav.flightStatus, href: "/en-eg/flight-status"   },
        { label: t.nav.routeMap,     href: "/en-eg/route-map"       },
        { label: t.nav.visaHealth,   href: "/en-eg/visa-and-health" },
      ],
    },
    { label: t.nav.destinationsOffers, href: "/en-eg/special-offers"    },
    { label: t.nav.passengerReviews,   href: "/en-eg/passenger-reviews" },
    {
      label: t.nav.about,
      links: [
        { label: t.nav.aboutAirCairo, href: "/en-eg/about-air-cairo" },
        { label: t.nav.missionVision, href: "/en-eg/mission-vision"  },
        { label: t.nav.travelNews,    href: "/en-eg/travel-news"     },
        { label: t.nav.pressRelease,  href: "/en-eg/press-release"   },
        { label: t.nav.officeContacts,href: "/en-eg/office-contacts" },
        { label: t.nav.faqs,          href: "/en-eg/faqs"            },
      ],
    },
  ];
  return items;
}

// ─── Dropdown ─────────────────────────────────────────────────────────────────
function Dropdown({ item }: { item: NavItem }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!item.links?.length) return null;

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-white/90 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        aria-expanded={open}
      >
        {item.label}
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          className={cn("transition-transform duration-200", open && "rotate-180")}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full pt-1 z-50" style={{ minWidth: "200px", right: 0 }}>
          <div className="bg-[#1a3a1f] border border-white/15 rounded-xl shadow-2xl overflow-hidden py-1">
            {item.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Navbar ──────────────────────────────────────────────────────────────
export function Navbar() {
  const { t, locale, toggleLocale } = useI18n();
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const navItems = useNavItems();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // Scroll shadow
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 inset-x-0 z-50 h-16 bg-brand-dark transition-shadow duration-300 overflow-x-hidden",
          scrolled && "shadow-lg shadow-black/30"
        )}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 h-full flex items-center justify-between gap-2 w-full max-w-full">

          {/* ── Logo ── */}
          <Link href="/" className="shrink-0 hover:opacity-85 transition-opacity">
            <img
              src="/width-logo.png"
              alt="Spanker"
              width={100}
              height={34}
              className="h-8 sm:h-9 w-auto object-contain"
            />
          </Link>

          {/* ── Desktop nav ── */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1 justify-center">
            {navItems.map((item) =>
              item.links?.length ? (
                <Dropdown key={item.label} item={item} />
              ) : (
                <Link
                  key={item.label}
                  href={item.href!}
                  className={cn(
                    "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
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

          {/* ── Right side ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language toggle */}
            <button
              onClick={toggleLocale}
              className="h-8 px-3 rounded-full border border-white/25 text-xs font-bold text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle language"
            >
              {locale === "ar" ? "EN" : "ع"}
            </button>

            {/* Auth */}
            {user ? (
              <div className="hidden sm:flex items-center gap-2">
                <span className="text-sm text-white/80 max-w-[140px] truncate">
                  {(user as { first_name?: string; email: string }).first_name ?? user.email}
                </span>
                <button
                  onClick={logout}
                  className="h-8 px-3 text-xs font-semibold border border-white/25 text-white rounded-lg hover:bg-white/10 transition-colors"
                >
                  {t.common.logout}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setLoginOpen(true)}
                className="lg:hidden h-8 px-3 text-xs font-semibold bg-brand-green text-white rounded-xl hover:bg-brand-green-dark transition-colors shadow-sm"
              >
                {t.common.login}
              </button>
            )}

            {/* Desktop auth */}
            {!user && (
              <button
                onClick={() => setLoginOpen(true)}
                className="hidden lg:inline-flex h-9 px-4 text-sm font-semibold bg-brand-green text-white rounded-xl hover:bg-brand-green-dark transition-colors shadow-sm"
              >
                {t.common.login}
              </button>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="القائمة"
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* ── Mobile menu ── */}
        {mobileOpen && (
          <div className="lg:hidden absolute top-16 inset-x-0 bg-brand-dark border-t border-white/10 shadow-2xl max-h-[80vh] overflow-y-auto overflow-x-hidden">
            <div className="px-4 py-3 space-y-1 w-full max-w-full">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.links?.length ? (
                    <>
                      <button
                        onClick={() =>
                          setMobileExpanded((v) => (v === item.label ? null : item.label))
                        }
                        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-white/90 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        {item.label}
                        <svg
                          width="14" height="14" viewBox="0 0 24 24" fill="none"
                          stroke="currentColor" strokeWidth="2.5"
                          className={cn("transition-transform", mobileExpanded === item.label && "rotate-180")}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>
                      {mobileExpanded === item.label && (
                        <div className="mr-4 mt-1 space-y-0.5 border-r border-white/15 pr-3">
                          {item.links.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="block px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              onClick={() => setMobileOpen(false)}
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      className="block px-3 py-2.5 text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              {/* Mobile auth */}
              <div className="pt-3 border-t border-white/10 mt-3">
                {user ? (
                  <div className="flex items-center justify-between px-3">
                    <span className="text-sm text-white/70 truncate">{(user as { first_name?: string; email: string }).first_name ?? user.email}</span>
                    <button
                      onClick={() => { logout(); setMobileOpen(false); }}
                      className="text-sm font-semibold text-red-400 hover:text-red-300"
                    >
                      {t.common.logout}
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setLoginOpen(true); setMobileOpen(false); }}
                    className="w-full h-11 bg-brand-green text-white text-sm font-semibold rounded-xl hover:bg-brand-green-dark transition-colors"
                  >
                    {t.common.login}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
