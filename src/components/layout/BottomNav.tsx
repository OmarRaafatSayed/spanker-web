"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/modules/auth";

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

function HotelIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 17h20v2H2z"/>
      <path d="M2 7h20v10H2z"/>
      <path d="M6 7V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3"/>
      <path d="M13 7V4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1v3"/>
    </svg>
  );
}

function TourIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="10" r="3"/>
      <path d="M12 2v6M12 14v8"/>
      <path d="m17 7-5 5-5-5"/>
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

/* ─── Main BottomNav ──────────────────────────────────────────── */

export function BottomNav() {
  const { isRTL } = useI18n();
  const { user } = useAuth();
  const pathname = usePathname();

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
      labelAr: "طيران",
      labelEn: "Flights",
    },
    {
      href: "/en-eg/hotels",
      icon: (active: boolean) => <HotelIcon filled={active} />,
      labelAr: "فنادق",
      labelEn: "Hotels",
    },
    {
      href: "/en-eg/tours",
      icon: (active: boolean) => <TourIcon filled={active} />,
      labelAr: "رحلات",
      labelEn: "Tours",
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
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
        aria-label={isRTL ? "التنقل السريع" : "Quick navigation"}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-brand-dark/95 backdrop-blur-xl border-t border-white/10 shadow-[0_-4px_24px_rgba(0,0,0,0.15)]" />

        <div className="relative flex items-stretch h-20 px-1">
          {/* 5 main tabs */}
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
                        className="absolute inset-0 mx-1.5 rounded-2xl bg-gradient-to-br from-white/15 to-white/10 border border-white/20"
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
                      isActive ? "text-white" : "text-white/60"
                    )}
                    whileTap={{ scale: 0.88 }}
                  >
                    {tab.icon(isActive)}
                  </motion.div>

                  {/* Label */}
                  <span
                    className={cn(
                      "relative z-10 text-[10px] font-semibold transition-colors duration-200",
                      isActive ? "text-white" : "text-white/60"
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
                        className="absolute bottom-1.5 w-1 h-1 rounded-full bg-white"
                      />
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}

        </div>

        {/* iOS home-indicator safe area */}
        <div
          className="bg-brand-dark/95 backdrop-blur-xl"
          style={{ height: "env(safe-area-inset-bottom)" }}
        />
      </nav>
    </>
  );
}
