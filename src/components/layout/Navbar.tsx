"use client";

import { useState, useEffect } from "react";
import { BRAND_ASSETS } from "@/lib/brand/assets";
import { SEMANTIC_COLORS } from "@/lib/brand/colors";
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

  // Navbar always starts with green background
  const isDark = true;

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
      className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300"
      style={{
        backgroundColor: isDark ? SEMANTIC_COLORS.navbarBg : "transparent",
        boxShadow: isDark ? "0 4px 6px -1px rgba(0, 0, 0, 0.1)" : "none",
        borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "none",
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
    >
      <nav className="max-w-7xl mx-auto px-4 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Logo - Left Side */}
        <motion.div
          className="shrink-0"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <img
              src="/width-logo.png"
              alt="Spanker Logo"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
            />
          </Link>
        </motion.div>

        {/* Desktop Nav - Center */}
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
                      ? "text-white hover:opacity-80"
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
                      ? "text-white hover:opacity-80"
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

        {/* Right side actions - Hamburger, Language Toggle, Login Button */}
        <motion.div 
          className="flex items-center justify-end gap-4"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {/* Language toggle pill */}
          <div
            className="relative flex items-center rounded-full p-0.5 cursor-pointer select-none shrink-0 transition-all bg-white/10 border border-white/20 hover:border-white/30"
            onClick={toggleLocale}
            role="button"
            aria-label="Toggle language"
          >
            <motion.div
              className="absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-full shadow-sm"
              style={{ backgroundColor: SEMANTIC_COLORS.secondary }}
              animate={{ left: locale === "ar" ? "calc(50% + 2px)" : "2px" }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              aria-hidden="true"
            />
            <span className={cn(
              "relative z-10 px-2.5 py-1 text-xs font-bold rounded-full transition-colors duration-200 w-9 text-center",
              locale === "en" ? "text-white" : "text-white/50"
            )}>EN</span>
            <span className={cn(
              "relative z-10 px-2.5 py-1 text-xs font-bold rounded-full transition-colors duration-200 w-9 text-center",
              locale === "ar" ? "text-white" : "text-white/50"
            )}>ع</span>
          </div>

          {/* Auth buttons */}
          {user ? (
            <motion.div className="hidden sm:flex items-center gap-2 shrink-0">
              <span className={cn(
                "text-sm font-medium",
                isDark ? "text-text-luxury" : "text-white"
              )}>
                {(user as { first_name?: string; email: string }).first_name ?? user.email}
              </span>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="transition-all duration-200 h-9 border-white/30 text-white hover:bg-white/10 hover:border-white/50"
              >
                {t.common.logout}
              </Button>
            </motion.div>
          ) : (
            <Button
              onClick={() => setLoginOpen(true)}
              size="sm"
              className="h-9 font-semibold transition-all duration-200 shrink-0 hidden sm:inline-flex text-white shadow-md hover:shadow-lg"
              style={{ 
                backgroundColor: SEMANTIC_COLORS.buttonPrimary,
              }}
            >
              {t.common.login}
            </Button>
          )}

          {/* Mobile menu button - Simple icon, no border */}
          <motion.button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 transition-all duration-200 shrink-0 text-white hover:opacity-80"
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
            className="lg:hidden absolute top-18 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-border-light shadow-lg overflow-hidden"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-2">
              {NAV_ITEMS.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.04 }}
                  className="border-b border-border-light/50 pb-3 last:border-b-0 last:pb-0"
                >
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="block py-2 font-medium text-text-primary hover:text-brand-green transition-colors duration-200"
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <div>
                      <div className="py-2 font-semibold text-text-primary">{item.label}</div>
                      <div className="pl-3 space-y-1">
                        {item.links.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            className="block py-1.5 text-sm text-text-secondary hover:text-brand-green transition-colors duration-200"
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
              {!user && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.3 }}
                  className="pt-3 border-t border-border-light/50"
                >
                  <Button
                    onClick={() => {
                      setLoginOpen(true);
                      setMobileOpen(false);
                    }}
                    className="w-full text-white font-semibold"
                    style={{ backgroundColor: SEMANTIC_COLORS.buttonPrimary }}
                  >
                    {t.common.login}
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login Modal */}
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </motion.header>
  );
}
