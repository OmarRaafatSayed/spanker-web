"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth-context";
import { MenuIcon, XIcon, ChevronDownIcon } from "@/components/icons";
import { LoginModal } from "@/components/ui/LoginModal";
import { Button } from "@/components/ui/button";

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
    <motion.header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isDark ? "glass-panel shadow-luxury" : "bg-transparent"
      )}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <nav className="max-w-7xl mx-auto px-4 lg:px-8 flex items-center justify-between h-18">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <motion.svg 
              width="36" 
              height="36" 
              viewBox="0 0 36 36" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              aria-hidden="true"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.6 }}
            >
              <circle cx="18" cy="18" r="18" fill="url(#logoGradient)" />
              <path d="M8 20 L18 10 L28 20 L24 20 L18 14 L12 20 Z" fill="white" />
              <path d="M14 20 L18 16 L22 20 L20 20 L18 18 L16 20 Z" fill="#d4af37" />
              <rect x="16" y="20" width="4" height="6" rx="1" fill="white" />
              <defs>
                <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1b4332" />
                  <stop offset="100%" stopColor="#2d6a4f" />
                </linearGradient>
              </defs>
            </motion.svg>
            <span className={cn(
              "font-bold text-xl tracking-tight transition-colors duration-300",
              isDark ? "text-brand-green" : "text-white"
            )}>
              {isRTL ? "سبانكر" : "Spanker"}
            </span>
          </Link>
        </motion.div>

        {/* Desktop Nav */}
        <motion.div 
          className="hidden lg:flex items-center gap-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {NAV_ITEMS.map((item, index) =>
            item.href ? (
              // Direct link — no dropdown
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "px-3 py-2 rounded text-sm font-medium transition-all duration-300 hover:glass-card",
                    isDark
                      ? "text-text-luxury hover:text-brand-green"
                      : "text-white hover:text-white/80"
                  )}
                >
                  {item.label}
                </Link>
              </motion.div>
            ) : (
              // Dropdown menu
              <motion.div
                key={item.label}
                className="relative"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * index }}
                onMouseEnter={() => setOpenDropdown(item.label)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <button
                  className={cn(
                    "px-3 py-2 rounded text-sm font-medium transition-all duration-300 flex items-center gap-1 hover:glass-card",
                    isDark
                      ? "text-text-luxury hover:text-brand-green"
                      : "text-white hover:text-white/80"
                  )}
                >
                  {item.label}
                  <motion.div
                    animate={{ rotate: openDropdown === item.label ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDownIcon size={16} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {openDropdown === item.label && (
                    <motion.div
                      className="absolute top-full mt-2 min-w-56 glass-panel rounded-xl shadow-luxury overflow-hidden"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    >
                      {item.links.map((link, linkIndex) => (
                        <motion.div
                          key={link.href}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, delay: linkIndex * 0.05 }}
                        >
                          <Link
                            href={link.href}
                            className="block px-4 py-3 text-sm text-text-luxury hover:glass-card hover:text-brand-green transition-all duration-200"
                            onClick={() => setOpenDropdown(null)}
                          >
                            {link.label}
                          </Link>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          )}
        </motion.div>

        {/* Right side actions */}
        <motion.div 
          className="flex items-center gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {/* Language toggle pill */}
          <div
            className={cn(
              "relative flex items-center rounded-full p-0.5 cursor-pointer select-none shrink-0",
              isDark
                ? "bg-brand-green/10 border border-brand-green/25"
                : "bg-white/15 border border-white/30"
            )}
            onClick={toggleLocale}
            role="button"
            aria-label="Toggle language"
          >
            {/* sliding indicator */}
            <motion.div
              className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full bg-brand-green shadow-sm"
              animate={{ left: locale === "ar" ? "calc(50% + 2px)" : "2px" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              aria-hidden="true"
            />
            <span className={cn(
              "relative z-10 px-3 py-1 text-xs font-bold rounded-full transition-colors duration-200 w-10 text-center",
              locale === "en" ? "text-white" : isDark ? "text-text-luxury" : "text-white/70"
            )}>EN</span>
            <span className={cn(
              "relative z-10 px-3 py-1 text-xs font-bold rounded-full transition-colors duration-200 w-10 text-center",
              locale === "ar" ? "text-white" : isDark ? "text-text-luxury" : "text-white/70"
            )}>ع</span>
          </div>

          {/* Auth buttons */}
          {user ? (
            <motion.div className="flex items-center gap-2">
              <span className={cn(
                "text-sm",
                isDark ? "text-text-luxury" : "text-white"
              )}>
                {user.name}
              </span>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className={cn(
                  "transition-all duration-300",
                  !isDark && "border-white/20 text-white hover:glass-card"
                )}
              >
                {t.common.logout}
              </Button>
            </motion.div>
          ) : (
            <Button
              onClick={() => setLoginOpen(true)}
              variant={isDark ? "default" : "glass"}
              size="sm"
            >
              {t.common.login}
            </Button>
          )}

          {/* Mobile menu button */}
          <motion.button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={cn(
              "lg:hidden p-2 rounded-md transition-all duration-300",
              isDark
                ? "text-text-luxury hover:text-brand-green hover:glass-card"
                : "text-white hover:text-white/80"
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Toggle menu"
          >
            <AnimatePresence mode="wait">
              {mobileOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <XIcon size={24} />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <MenuIcon size={24} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="lg:hidden glass-panel border-t border-white/20"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="max-w-7xl mx-auto px-4 py-6">
              {NAV_ITEMS.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="mb-4"
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="block py-2 text-text-luxury hover:text-brand-green transition-colors duration-200"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <div>
                      <div className="py-2 text-text-luxury font-medium">{item.label}</div>
                      <div className="pl-4 space-y-2">
                        {item.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block py-1 text-sm text-text-secondary hover:text-brand-green transition-colors duration-200"
                            onClick={() => setMobileOpen(false)}
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </motion.header>
  );
}
