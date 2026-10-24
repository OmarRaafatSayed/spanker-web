"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, Tag, Plane } from "lucide-react";
import { BRAND_COLORS } from "@/lib/brand/colors";

interface Offer {
  from: string; fromAr: string;
  to: string;   toAr: string;
  price: string; currency: string;
  image: string;
  badge: string | null;
}

const OFFERS: Offer[] = [
  { from: "Cairo",  fromAr: "القاهرة",  to: "Marsa Alam",     toAr: "مرسى علم",    price: "3,200", currency: "EGP", image: "/images/offers/marsa-alam.jpg",  badge: "HOT"  },
  { from: "Cairo",  fromAr: "القاهرة",  to: "Luxor",           toAr: "الأقصر",       price: "2,800", currency: "EGP", image: "/images/offers/luxor.jpg",       badge: null   },
  { from: "Cairo",  fromAr: "القاهرة",  to: "Aswan",           toAr: "أسوان",        price: "3,100", currency: "EGP", image: "/images/offers/aswan.jpg",       badge: null   },
  { from: "Cairo",  fromAr: "القاهرة",  to: "Sharm el-Sheikh", toAr: "شرم الشيخ",   price: "4,500", currency: "EGP", image: "/images/offers/sharm.jpg",       badge: "TOP"  },
  { from: "Cairo",  fromAr: "القاهرة",  to: "Hurghada",        toAr: "الغردقة",     price: "3,600", currency: "EGP", image: "/images/offers/hurghada.jpg",    badge: null   },
  { from: "Kuwait", fromAr: "الكويت",   to: "Alexandria",      toAr: "الإسكندرية",  price: "6,200", currency: "EGP", image: "/images/offers/alexandria.jpg",  badge: null   },
  { from: "Cairo",  fromAr: "القاهرة",  to: "Budapest",        toAr: "بودابست",     price: "6,481", currency: "EGP", image: "/images/offers/budapest.jpg",    badge: "NEW"  },
];

const BADGE_COLORS: Record<string, string> = {
  HOT: "#ef4444",
  TOP: BRAND_COLORS.green,
  NEW: "#2473BC",
};

/* ─── helpers ─── */
function getTransform(offset: number, isMobile: boolean): React.CSSProperties {
  const abs = Math.abs(offset);

  // Mobile: smaller cards, tighter spacing, less Z depth
  const gap    = isMobile ? 130 : 210;
  const tilt   = isMobile ? 38  : 42;
  const zPush  = isMobile ? 80  : 160;
  const scales = isMobile
    ? [1, 0.72, 0.55, 0.42]
    : [1, 0.78, 0.62, 0.50];

  if (offset === 0) {
    return {
      transform: "translateX(0) rotateY(0deg) scale(1)",
      zIndex: 20,
      opacity: 1,
      filter: "brightness(1)",
    };
  }

  const translateX = offset * gap;
  const rotateY    = offset < 0 ? tilt : -tilt;
  const scale      = scales[Math.min(abs, scales.length - 1)];
  const tz         = -zPush * abs;
  const opacity    = abs === 1 ? 1 : abs === 2 ? (isMobile ? 0.7 : 1) : abs === 3 ? 0.5 : 0;
  const brightness = abs === 1 ? 0.72 : 0.52;

  return {
    transform: `translateX(${translateX}px) translateZ(${tz}px) rotateY(${rotateY}deg) scale(${scale})`,
    zIndex: Math.max(0, 20 - abs * 4),
    opacity,
    filter: `brightness(${brightness})`,
  };
}

export function SpecialOffersSection() {
  const { isRTL, locale } = useI18n();
  const isAr = locale === "ar";

  const [active, setActive] = useState(0);
  const total = OFFERS.length;
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const go = useCallback((dir: 1 | -1) => {    setActive((prev) => (prev + dir + total) % total);
  }, [total]);

  /* keyboard navigation */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  go(isRTL ?  1 : -1);
      if (e.key === "ArrowRight") go(isRTL ? -1 :  1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [go, isRTL]);

  /* auto-advance */
  useEffect(() => {
    autoRef.current = setInterval(() => go(1), 4200);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [go]);

  const pauseAuto = () => { if (autoRef.current) clearInterval(autoRef.current); };
  const resumeAuto = () => { autoRef.current = setInterval(() => go(1), 4200); };

  // Touch swipe
  const touchStartX = useRef<number>(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) go(diff > 0 ? 1 : -1);
  };


  return (
    <section
      className="relative w-full overflow-hidden py-16 md:py-24"
      style={{ background: "#0f2d1a" }}
      aria-label={isAr ? "عروض خاصة" : "Special Offers"}
      onMouseEnter={pauseAuto}
      onMouseLeave={resumeAuto}
    >
      {/* ambient glow behind active card */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 50% 55%, ${BRAND_COLORS.green}45 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      {/* subtle grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${BRAND_COLORS.green} 1px, transparent 1px),
                            linear-gradient(90deg, ${BRAND_COLORS.green} 1px, transparent 1px)`,
          backgroundSize: "48px 48px",
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* ── Header ── */}
        <motion.div
          className="flex items-end justify-between mb-12 gap-4 flex-wrap"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <span
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] rounded-full px-4 py-1.5 mb-3 border"
              style={{
                color: BRAND_COLORS.yellow,
                borderColor: `${BRAND_COLORS.yellow}35`,
                background: `${BRAND_COLORS.yellow}12`,
              }}
            >
              <Tag size={11} />
              {isAr ? "عروض حصرية" : "Exclusive Deals"}
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black text-white"
              style={
                isAr
                  ? { fontFamily: "var(--font-cairo), sans-serif" }
                  : { fontFamily: "var(--font-playfair), Georgia, serif", fontStyle: "italic", fontWeight: 700 }
              }
            >
              {isAr ? "عروض خاصة" : "Special Offers"}
            </h2>
          </div>

          <Link
            href="/special-offers"
            className="inline-flex items-center gap-2 text-sm font-bold transition-opacity hover:opacity-75"
            style={{ color: BRAND_COLORS.yellow }}
          >
            {isAr ? "عرض الكل" : "View All"}
            {isRTL ? <ArrowLeft size={15} /> : <ArrowRight size={15} />}
          </Link>
        </motion.div>

        {/* ── Cover Flow stage ── */}
        <div
          className="relative flex items-center justify-center"
          style={{ perspective: "1200px", height: isMobile ? "280px" : "400px" }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {OFFERS.map((item, i) => {
            const offset = ((i - active + total + Math.floor(total / 2)) % total) - Math.floor(total / 2);
            const style = getTransform(offset, isMobile);
            const isCenter = offset === 0;

            // Card dimensions responsive
            const cardW = isMobile ? 200 : 320;
            const cardH = isMobile ? 240 : 360;

            return (
              <div
                key={item.to}
                className="absolute cursor-pointer transition-all duration-500"
                style={{
                  width: `${cardW}px`,
                  height: `${cardH}px`,
                  transformStyle: "preserve-3d",
                  transformOrigin: "center center",
                  transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
                  ...style,
                }}
                onClick={() => {
                  if (!isCenter) { setActive(i); pauseAuto(); }
                }}
                role="button"
                tabIndex={0}
                aria-label={isAr ? item.toAr : item.to}
                onKeyDown={(e) => { if (e.key === "Enter") setActive(i); }}
              >
                {/* Card face */}
                <div className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src={item.image}
                    alt={isAr ? item.toAr : item.to}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 200px, 320px"
                    priority={i === 0}
                  />

                  {/* Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Badge */}
                  {item.badge && (
                    <div
                      className="absolute top-3 start-3 text-[10px] font-black px-2.5 py-1 rounded-full tracking-widest text-white"
                      style={{ background: BADGE_COLORS[item.badge] ?? BRAND_COLORS.green }}
                    >
                      {item.badge}
                    </div>
                  )}

                  {/* Price pill */}
                  <div
                    className="absolute top-3 end-3 rounded-full px-3 py-1.5 flex items-center gap-1"
                    style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)" }}
                  >
                    <span className="text-[10px] font-semibold" style={{ color: BRAND_COLORS.green }}>{item.currency}</span>
                    <span className="text-sm font-black" style={{ color: "#111" }}>{item.price}</span>
                  </div>

                  {/* Info */}
                  <div className="absolute bottom-0 inset-x-0 p-5">
                    <p className="text-white font-black text-xl leading-tight mb-0.5">
                      {isAr ? item.toAr : item.to}
                    </p>
                    <p className="text-white/55 text-xs mb-4">
                      {isAr ? `من ${item.fromAr}` : `from ${item.from}`}
                    </p>

                    {/* Book button — only visible on active */}
                    {isCenter && (
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.25 }}
                        className="inline-flex items-center gap-2 font-bold text-white rounded-xl transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: BRAND_COLORS.green,
                          boxShadow: `0 4px 20px ${BRAND_COLORS.green}60`,
                          fontSize: isMobile ? "11px" : "14px",
                          padding: isMobile ? "6px 12px" : "10px 20px",
                        }}
                      >
                        <Plane size={isMobile ? 12 : 14} />
                        {!isMobile && (isAr ? "احجز الآن" : "Book Now")}
                        {isMobile && (isAr ? "احجز" : "Book")}
                      </motion.button>
                    )}
                  </div>
                </div>


              </div>
            );
          })}
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center justify-center gap-6 mt-16">
          <motion.button
            type="button"
            onClick={() => { go(isRTL ? 1 : -1); pauseAuto(); }}
            className="w-11 h-11 rounded-full flex items-center justify-center border border-white/20 text-white hover:bg-white/10 transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isAr ? "السابق" : "Previous"}
          >
            <ChevronLeft size={20} />
          </motion.button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {OFFERS.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setActive(i); pauseAuto(); }}
                aria-label={`Go to ${i + 1}`}
                className="rounded-full transition-all duration-300"
                style={{
                  width:  i === active ? "1.8rem" : "0.45rem",
                  height: "0.45rem",
                  background: i === active ? BRAND_COLORS.yellow : "rgba(255,255,255,0.25)",
                }}
              />
            ))}
          </div>

          <motion.button
            type="button"
            onClick={() => { go(isRTL ? -1 : 1); pauseAuto(); }}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white transition-colors"
            style={{ background: BRAND_COLORS.green }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label={isAr ? "التالي" : "Next"}
          >
            <ChevronRight size={20} />
          </motion.button>
        </div>

      </div>
    </section>
  );
}
