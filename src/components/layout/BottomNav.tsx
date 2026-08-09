"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

/* ─── Icons ─────────────────────────────────────────────────── */

function HomeIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" fill={filled ? "currentColor" : "none"} />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PlaneIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.6 1.1.5L8 9.5l-2 3.5L4 14c-.4.3-.4.8 0 1l2 2c.3.4.8.4 1 0l1.5-2 3.5-2-.5 4.2c-.1.5.2.9.7 1l2.5 1.5c.5.3 1 0 1.1-.5z" />
    </svg>
  );
}

function OffersIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44l-1.5-7.5A2.5 2.5 0 0 1 8 9h.5" fill={filled ? "currentColor" : "none"} />
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44l1.5-7.5A2.5 2.5 0 0 0 16 9h-.5" fill={filled ? "currentColor" : "none"} />
    </svg>
  );
}

function BookingIcon({ filled }: { filled?: boolean }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect width="20" height="14" x="2" y="5" rx="2" fill={filled ? "currentColor" : "none"} />
      <line x1="2" x2="22" y1="10" y2="10" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
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
  { labelAr: "تسجيل الوصول", labelEn: "Check-in", href: "/en-eg/check-in-online" },
  { labelAr: "حالة الرحلة", labelEn: "Flight Status", href: "/en-eg/flight-status" },
  { labelAr: "الأمتعة", labelEn: "Baggage", href: "/en-eg/baggage" },
  { labelAr: "اختيار المقعد", labelEn: "Seat Selection", href: "/en-eg/seat-selection" },
  { labelAr: "خريطة الرحلات", labelEn: "Route Map", href: "/en-eg/route-map" },
  { labelAr: "الأسئلة الشائعة", labelEn: "FAQs", href: "/en-eg/faqs" },
  { labelAr: "تواصل معنا", labelEn: "Contact Us", href: "/en-eg/office-contacts" },
  { labelAr: "من نحن", labelEn: "About Us", href: "/en-eg/about-air-cairo" },
  { labelAr: "أخبار السفر", labelEn: "Travel News", href: "/en-eg/travel-news" },
];

function MoreDrawer({ open, onClose, isRTL }: { open: boolean; onClose: () => void; isRTL: boolean }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white rounded-t-2xl shadow-2xl",
          "transition-transform duration-300 ease-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label={isRTL ? "المزيد من الخيارات" : "More options"}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* Header */}
        <div className={cn("flex items-center justify-between px-5 py-3", isRTL && "flex-row-reverse")}>
          <h2 className="text-base font-bold text-text-primary">
            {isRTL ? "المزيد من الخيارات" : "More Options"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-text-muted hover:bg-gray-100 hover:text-text-primary transition-colors"
            aria-label={isRTL ? "إغلاق" : "Close"}
          >
            <XIcon />
          </button>
        </div>

        {/* Links grid */}
        <div className="px-4 pb-4 grid grid-cols-3 gap-3">
          {MORE_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl bg-bg-alt hover:bg-brand-red/5 hover:text-brand-red transition-all duration-200 text-center",
                isRTL ? "text-right" : "text-left"
              )}
            >
              <span className="text-xs font-medium text-text-secondary leading-tight">
                {isRTL ? link.labelAr : link.labelEn}
              </span>
            </Link>
          ))}
        </div>

        {/* iOS safe area spacer */}
        <div className="pb-safe" style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      </div>
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
        className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 shadow-[0_-2px_16px_rgba(0,0,0,0.08)]"
        aria-label={isRTL ? "التنقل السريع" : "Quick navigation"}
      >
        <div className="flex items-stretch h-16">
          {/* Main 4 tabs */}
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const label = isRTL ? tab.labelAr : tab.labelEn;

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 relative",
                  "active:scale-95 transition-all duration-150",
                  isActive ? "text-brand-red" : "text-text-muted"
                )}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
              >
                {/* Active top pill */}
                <span
                  className={cn(
                    "absolute top-0 left-1/2 -translate-x-1/2 h-0.75 rounded-b-full bg-brand-red transition-all duration-300",
                    isActive ? "w-8 opacity-100" : "w-0 opacity-0"
                  )}
                />
                <span className={cn("transition-all duration-200", isActive && "scale-110")}>
                  {tab.icon(isActive)}
                </span>
                <span className={cn("text-[10px] leading-none", isActive ? "font-bold" : "font-medium")}>
                  {label}
                </span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={cn(
              "flex-1 flex flex-col items-center justify-center gap-0.5 relative",
              "active:scale-95 transition-all duration-150",
              drawerOpen ? "text-brand-red" : "text-text-muted"
            )}
            aria-label={isRTL ? "المزيد" : "More"}
            aria-expanded={drawerOpen}
          >
            <span className={cn(
              "absolute top-0 left-1/2 -translate-x-1/2 h-0.75 rounded-b-full bg-brand-red transition-all duration-300",
              drawerOpen ? "w-8 opacity-100" : "w-0 opacity-0"
            )} />
            <MoreIcon />
            <span className={cn("text-[10px] leading-none", drawerOpen ? "font-bold" : "font-medium")}>
              {isRTL ? "المزيد" : "More"}
            </span>
          </button>
        </div>

        {/* iOS home-indicator safe area */}
        <div style={{ height: "env(safe-area-inset-bottom)", background: "white" }} />
      </nav>
    </>
  );
}
