"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth-context";

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

function RequestsIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

function ProfileIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill={filled ? "currentColor" : "none"} />
      <circle cx="12" cy="7" r="4" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

function MoreIcon({ active }: { active?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="5"  r="1.5" fill={active ? "currentColor" : "none"} />
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
  { labelAr: "تسجيل الوصول",   labelEn: "Check-in",      href: "/en-eg/check-in-online", icon: "✓" },
  { labelAr: "حالة الرحلة",    labelEn: "Flight Status",  href: "/en-eg/flight-status",   icon: "✈" },
  { labelAr: "الأمتعة",        labelEn: "Baggage",        href: "/en-eg/baggage",          icon: "🧳" },
  { labelAr: "اختيار المقعد",  labelEn: "Seat Selection", href: "/en-eg/seat-selection",   icon: "💺" },
  { labelAr: "خريطة الرحلات",  labelEn: "Route Map",      href: "/en-eg/route-map",        icon: "🗺" },
  { labelAr: "الأسئلة الشائعة",labelEn: "FAQs",           href: "/en-eg/faqs",             icon: "❓" },
  { labelAr: "تواصل معنا",     labelEn: "Contact Us",     href: "/en-eg/office-contacts",  icon: "📞" },
  { labelAr: "من نحن",         labelEn: "About Us",       href: "/en-eg/about-air-cairo",  icon: "ℹ" },
  { labelAr: "أخبار السفر",    labelEn: "Travel News",    href: "/en-eg/travel-news",      icon: "📰" },
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

      {/* Drawer panel — slides up from bottom */}
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
            {/* Handle bar */}
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
                  transition={{ duration: 0.25, delay: index * 0.04 }}
                >
                  <Link
                    href={link.href}
                    onClick={onClose}
                    className={cn(
                      "flex flex-col items-center gap-2 p-4 rounded-2xl",
                      "bg-gradient-to-br from-brand-green/5 to-brand-green/10",
                      "hover:from-brand-green/10 hover:to-brand-green/20 hover:shadow-lg",
                      "active:scale-95 transition-all duration-200 text-center border border-brand-green/10"
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

            {/* iOS safe-area bottom spacer */}
            <div style={{ height: "env(safe-area-inset-bottom)" }} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Main BottomNav ──────────────────────────────────────────── */

export function BottomNav() {
  const { isRTL } = useI18n();
  const { user } = useAuth();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Profile tab: authenticated → dashboard profile, guest → login
  const profileHref = user ? "/dashboard/profile" : "/login";

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
      href: "/my-requests",
      icon: (active: boolean) => <RequestsIcon filled={active} />,
      labelAr: "طلباتي",
      labelEn: "Requests",
    },
    {
      href: profileHref,
      icon: (active: boolean) => <ProfileIcon filled={active} />,
      labelAr: "حسابي",
      labelEn: "Profile",
    },
  ];

  return (
    <>
      <MoreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} isRTL={isRTL} />

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        aria-label={isRTL ? "التنقل السريع" : "Quick navigation"}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-brand-green/10 shadow-[0_-4px_24px_rgba(27,67,50,0.08)]" />

        <div className="relative flex items-stretch h-20 px-2">
          {/* 4 main tabs */}
          {tabs.map((tab, index) => {
            // Home: exact match. Others: prefix match so sub-routes stay highlighted
            const isActive = tab.href === "/"
              ? pathname === "/"
              : pathname.startsWith(tab.href);
            const label = isRTL ? tab.labelAr : tab.labelEn;

            return (
              <motion.div
                key={tab.labelEn}
                className="flex-1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.08 }}
              >
                <Link
                  href={tab.href}
                  className="relative h-full flex flex-col items-center justify-center gap-1 px-1"
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Active pill background */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="activeBottomTab"
                        className="absolute inset-0 mx-1.5 rounded-2xl bg-gradient-to-br from-brand-green/10 to-brand-green/5 border border-brand-green/20"
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
                      "relative z-10 transition-colors duration-200",
                      isActive ? "text-brand-green" : "text-gray-400"
                    )}
                    whileTap={{ scale: 0.88 }}
                  >
                    {tab.icon(isActive)}
                  </motion.div>

                  {/* Label */}
                  <span
                    className={cn(
                      "relative z-10 text-[10px] font-semibold transition-colors duration-200",
                      isActive ? "text-brand-green" : "text-gray-500"
                    )}
                  >
                    {label}
                  </span>

                  {/* Active dot */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="absolute bottom-1.5 w-1 h-1 rounded-full bg-brand-green"
                      />
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}

          {/* More button */}
          <motion.div
            className="flex-1"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.32 }}
          >
            <button
              onClick={() => setDrawerOpen(true)}
              className="relative h-full w-full flex flex-col items-center justify-center gap-1 px-1"
              aria-label={isRTL ? "المزيد" : "More"}
              aria-expanded={drawerOpen}
            >
              <AnimatePresence>
                {drawerOpen && (
                  <motion.div
                    layoutId="activeBottomTab"
                    className="absolute inset-0 mx-1.5 rounded-2xl bg-gradient-to-br from-brand-green/10 to-brand-green/5 border border-brand-green/20"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </AnimatePresence>

              <motion.div
                className={cn(
                  "relative z-10 transition-colors duration-200",
                  drawerOpen ? "text-brand-green" : "text-gray-400"
                )}
                whileTap={{ scale: 0.88 }}
              >
                <MoreIcon active={drawerOpen} />
              </motion.div>

              <span
                className={cn(
                  "relative z-10 text-[10px] font-semibold transition-colors duration-200",
                  drawerOpen ? "text-brand-green" : "text-gray-500"
                )}
              >
                {isRTL ? "المزيد" : "More"}
              </span>
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
