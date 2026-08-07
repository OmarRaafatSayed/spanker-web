"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { MenuIcon, XIcon, ChevronDownIcon } from "@/components/icons";

export function Navbar() {
  const { t, locale, isRTL, toggleLocale } = useI18n();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const NAV_ITEMS = [
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
      links: [
        { label: t.nav.specialOffers, href: "/en-eg/special-offers" },
        { label: t.nav.charterFlights, href: "/en-eg/charter-flights" },
      ],
    },
    {
      label: t.nav.experience,
      links: [
        { label: t.nav.onBoard, href: "/en-eg/on-board" },
        { label: t.nav.ourFleet, href: "/en-eg/our-fleet" },
      ],
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
        isScrolled ? "bg-white shadow-md" : "bg-transparent"
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
            isScrolled ? "text-brand-red" : "text-white"
          )}>
            {isRTL ? "سبانكر" : "Spanker"}
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded text-sm font-medium transition-colors duration-200",
                  isScrolled
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
          ))}
        </div>

        {/* Language Toggle + Mobile */}
        <div className="flex items-center gap-3">
          {/* Language switcher */}
          <button
            onClick={toggleLocale}
            aria-label={locale === "ar" ? "Switch to English" : "التبديل إلى العربية"}
            className={cn(
              "flex items-center gap-1.5 text-sm font-semibold border rounded-full px-4 py-1.5 transition-all duration-200",
              isScrolled
                ? "border-border-light text-text-primary hover:border-brand-red hover:text-brand-red"
                : "border-white/50 text-white hover:border-white hover:bg-white/10"
            )}
          >
            {/* Globe icon */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            {locale === "ar" ? "English" : "عربي"}
          </button>

          {/* Mobile hamburger */}
          <button
            className={cn(
              "lg:hidden p-2 rounded transition-colors",
              isScrolled ? "text-text-primary" : "text-white"
            )}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "إغلاق القائمة" : "فتح القائمة"}
          >
            {mobileOpen ? <XIcon size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border-light max-h-[80vh] overflow-y-auto">
          {NAV_ITEMS.map((item) => (
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
          ))}

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
        </div>
      )}
    </header>
  );
}
