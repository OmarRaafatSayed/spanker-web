"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

/* ─── Icons ─────────────────────────────────────────────────── */

function HomeIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={filled ? "currentColor" : "none"} />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PlaneIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.6 1.1.5L8 9.5l-2 3.5L4 14c-.4.3-.4.8 0 1l2 2c.3.4.8.4 1 0l1.5-2 3.5-2-.5 4.2c-.1.5.2.9.7 1l2.5 1.5c.5.3 1 0 1.1-.5z" />
    </svg>
  );
}

function OffersIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44l-1.5-7.5A2.5 2.5 0 0 1 8 9h.5" fill={filled ? "currentColor" : "none"} />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44l1.5-7.5A2.5 2.5 0 0 0 16 9h-.5" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

function BookingIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="14" x="2" y="5" rx="2" fill={filled ? "currentColor" : "none"} />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function MoreIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5" r="1.5" fill={active ? "currentColor" : "none"} />
      <circle cx="12" cy="12" r="1.5" fill={active ? "currentColor" : "none"} />
      <circle cx="12" cy="19" r="1.5" fill={active ? "currentColor" : "none"} />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

/* ─── More Drawer ─────────────────────────────────────────────── */

const MORE_LINKS = [
  { labelAr: "تسجيل الوصول", labelEn: "Check-in", href: "/en-eg/check-in-online", icon: "✓" },
  { labelAr: "حالة الرحلة", labelEn: "Flight Status", href: "/en-eg/flight-status", icon: "✈" },
  { labelAr: "الأمتعة", labelEn: "Baggage", href: "/en-eg/baggage", icon: "🧳" },
  { labelAr: "اختيار المقعد", labelEn: "Seat Selection", href: "/en-eg/seat-selection", icon: "💺" },
  { labelAr: "خريطة الرحلات", labelEn: "Route Map", href: "/en-eg/route-map", icon: "🗺" },
  { labelAr: "الأسئلة الشائعة", labelEn: "FAQs", href: "/en-eg/faqs", icon: "❓" },
  { labelAr: "تواصل معنا", labelEn: "Contact Us", href: "/en-eg/office-contacts", icon: "📞" },
  { labelAr: "من نحن", labelEn: "About Us", href: "/en-eg/about-air-cairo", icon: "ℹ" },
  { labelAr: "أخبار السفر", labelEn: "Travel News", href: "/en-eg/travel-news", icon: "📰" },
];

function MoreDrawer({ open, onClose, isRTL }: { open: boolean; onClose: () => void; isRTL: boolean }) {
  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Drawer panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white/95 backdrop-blur-xl rounded-t-3xl shadow-2xl border-t border-brand-green/10"
            role="dialog"
            aria-modal="true"
            aria-label={isRTL ? "المزيد من الخيارات" : "More options"}
          >
            {/* Handle */}
            <div className="flex justify-center pt-4 pb-2">
              <div className="w-12 h-1.5 rounded-full bg-gray-300" />
            </div>

            {/* Header */}
            <div className={cn("flex items-center justify-between px-6 py-3", isRTL && "flex-row-reverse")}>
              <h2 className="text-lg font-bold text-brand-green">
                {isRTL ? "المزيد من الخيارات" : "More Options"}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 rounded-full text-text-muted hover:bg-brand-green/10 hover:text-brand-green transition-colors"
                aria-label={isRTL ? "إغلاق" : "Close"}
              >
                <XIcon />
              </motion.button>
            </div>

            {/* Links grid */}
            <div className="px-5 pb-6 grid grid-cols-3 gap-3">
              {MORE_LINKS.map((link, index) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl bg-gradient-to-br from-brand-green/5 to-brand-green/10",
                      "hover:from-brand-green/10 hover:to-brand-green/20 hover:shadow-lg",
                      "active:scale-95 transition-all duration-200 text-center border border-brand-green/10",
                      isRTL ? "text-right" : "text-left"
                    )}
                  >
                    <span className="text-2xl">{link.icon}</span>
                    <span className="text-xs font-semibold text-text-primary leading-tight">
                      {isRTL ? link.labelAr : link.labelEn}
                    </span>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* iOS safe area spacer */}
            <div className="h-safe" style={{ height: "env(safe-area-inset-bottom)" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main BottomNav ──────────────────────────────────────────── */

export function BottomNav() {
  const { isRTL } = useI18n();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const tabs = [
    {
      href: "/",
      icon: (active: boolean) => <HomeIcon filled={active} />,
      labelAr: "الرئيسية",
      labelEn: "Home",
    },
    {
      href: "/en-eg/book-flight",
      icon: (active: boolean) => <PlaneIcon filled={active} />,
      labelAr: "رحلات",
      labelEn: "Flights",
    },
    {
      href: "/en-eg/special-offers",
      icon: (active: boolean) => <OffersIcon filled={active} />,
      labelAr: "عروض",
      labelEn: "Offers",
    },
    {
      href: "/en-eg/my-booking",
      icon: (active: boolean) => <BookingIcon filled={active} />,
      labelAr: "حجوزاتي",
      labelEn: "Bookings",
    },
  ];

  return (
    <>
      <MoreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} isRTL={isRTL} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        aria-label={isRTL ? "التنقل السريع" : "Quick navigation"}
      >
        {/* Glass morphism background */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-brand-green/10 shadow-[0_-4px_24px_rgba(27,67,50,0.08)]" />
        
        <div className="relative flex items-stretch h-20 px-2">
          {/* Main 4 tabs */}
          {tabs.map((tab, index) => {
            const isActive = pathname === tab.href;
            const label = isRTL ? tab.labelAr : tab.labelEn;

            return (
              <motion.div
                key={tab.href}
                className="flex-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Link
                  href={tab.href}
                  className="relative h-full flex flex-col items-center justify-center gap-1 px-1"
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Active background bubble */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 mx-2 rounded-2xl bg-gradient-to-br from-brand-green/10 to-brand-green/5 border border-brand-green/20"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon container */}
                  <motion.div
                    className={cn(
                      "relative z-10 transition-all duration-300",
                      isActive ? "text-brand-green" : "text-gray-400"
                    )}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {tab.icon(isActive)}
                  </motion.div>

                  {/* Label */}
                  <motion.span
                    className={cn(
                      "relative z-10 text-[10px] font-semibold transition-all duration-300",
                      isActive ? "text-brand-green" : "text-gray-500"
                    )}
                    animate={isActive ? { y: [0, -2, 0] } : {}}
                    transition={{ duration: 0.3 }}
                  >
                    {label}
                  </motion.span>

                  {/* Active dot indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-green"
                      />
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}

          {/* More button with special styling */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative h-full w-full flex flex-col items-center justify-center gap-1 px-1"
              aria-label={isRTL ? "المزيد" : "More"}
              aria-expanded={drawerOpen}
            >
              {/* Active background bubble */}
              <AnimatePresence>
                {drawerOpen && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 mx-2 rounded-2xl bg-gradient-to-br from-brand-green/10 to-brand-green/5 border border-brand-green/20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              {/* Icon */}
              <motion.div
                className={cn(
                  "relative z-10 transition-all duration-300",
                  drawerOpen ? "text-brand-green" : "text-gray-400"
                )}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                animate={drawerOpen ? { scale: [1, 1.2, 1], rotate: 90 } : { rotate: 0 }}
                transition={{ duration: 0.3 }}
              >
                <MoreIcon active={drawerOpen} />
              </motion.div>

              {/* Label */}
              <motion.span
                className={cn(
                  "relative z-10 text-[10px] font-semibold transition-all duration-300",
                  drawerOpen ? "text-brand-green" : "text-gray-500"
                )}
              >
                {isRTL ? "المزيد" : "More"}
              </motion.span>

              {/* Active dot indicator */}
              <AnimatePresence>
                {drawerOpen && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-brand-green"
                  />
                )}
              </AnimatePresence>
            </button>
          </motion.div>
        </div>

        {/* iOS home-indicator safe area */}
        <div 
          className="bg-white/90 backdrop-blur-xl" 
          style={{ height: "env(safe-area-inset-bottom)" }} 
        />
      </nav>
    </>
  );
}
