"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

// ─── Feature cards data ──────────────────────────────────────────────────────
const FEATURES_AR = [
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect x="6" y="18" width="36" height="26" rx="3" stroke="currentColor" strokeWidth="2"/>
        <path d="M6 28h36M16 28v16M32 28v16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <path d="M14 18v-4a10 10 0 0 1 20 0v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="24" cy="10" r="3" fill="currentColor" opacity=".3"/>
      </svg>
    ),
    title: "أفضل الأسعار مضمونة",
    desc: "نقارن مئات الفنادق في وجهتك ونضمن لك أفضل سعر — لو لاقيت أرخص منه بنرجعلك الفرق.",
    color: "from-[#1b4332] to-[#2d6a4f]",
    accent: "#d4af37",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <circle cx="24" cy="24" r="18" stroke="currentColor" strokeWidth="2"/>
        <path d="M24 12v12l8 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M12 38l4-4M36 38l-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "حجز فوري ٢٤/٧",
    desc: "احجز في أي وقت من اليوم والليل — تأكيد فوري على إيميلك خلال ثوانٍ.",
    color: "from-[#2d6a4f] to-[#52b788]",
    accent: "#d4af37",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <path d="M24 4l4 8h9l-7 6 3 9-9-6-9 6 3-9-7-6h9z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/>
        <path d="M10 36c0 4 6.268 8 14 8s14-4 14-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    title: "فنادق مُختارة بعناية",
    desc: "كل فندق في قائمتنا اتراجع بشكل شخصي — تقييمات حقيقية وخدمة مضمونة.",
    color: "from-[#1b4332] to-[#2d6a4f]",
    accent: "#f4d03f",
  },
  {
    icon: (
      <svg viewBox="0 0 48 48" fill="none" className="w-8 h-8" aria-hidden="true">
        <rect x="8" y="8" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
        <rect x="26" y="8" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
        <rect x="8" y="26" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="2"/>
        <path d="M26 33h14M33 26v14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    title: "باقات متكاملة",
    desc: "طيران + فندق + فيزا في حجز واحد — وفّر وقتك ومنك التخطيط.",
    color: "from-[#d4af37] to-[#b8941f]",
    accent: "#1b4332",
  },
];

const FEATURES_EN = [
  {
    ...FEATURES_AR[0],
    title: "Best Price Guaranteed",
    desc: "We compare hundreds of hotels at your destination and guarantee the best price — find it cheaper and we'll refund the difference.",
  },
  {
    ...FEATURES_AR[1],
    title: "Instant Booking 24/7",
    desc: "Book any time of day or night — instant confirmation to your email within seconds.",
  },
  {
    ...FEATURES_AR[2],
    title: "Handpicked Hotels",
    desc: "Every hotel on our list has been personally reviewed — real ratings and guaranteed service.",
  },
  {
    ...FEATURES_AR[3],
    title: "Full Packages",
    desc: "Flight + hotel + visa in one booking — save time and let us handle the planning.",
  },
];

// ─── Hotel images from Unsplash (free, no download needed) ───────────────────
const HOTEL_IMAGES = {
  cairo:    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&q=80&auto=format&fit=crop",   // luxury hotel lobby
  hurghada: "https://images.unsplash.com/photo-1506059612708-99d6c258160e?w=400&q=80&auto=format&fit=crop", // resort pool
  main:     "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80&auto=format&fit=crop", // hotel exterior
};
function Stars({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <svg key={i} viewBox="0 0 16 16" className="w-3.5 h-3.5 text-brand-yellow fill-current" aria-hidden="true">
          <path d="M8 1l1.8 3.6L14 5.3l-3 2.9.7 4.1L8 10.3l-3.7 2 .7-4.1L2 5.3l4.2-.7z"/>
        </svg>
      ))}
    </div>
  );
}

// ─── Floating hotel card (decorative) ────────────────────────────────────────
function HotelCard({
  name, location, price, stars, delay, className, image,
}: {
  name: string; location: string; price: string; stars: number;
  delay: number; className?: string; image: string;
}) {
  return (
    <motion.div
      className={`absolute bg-white/8 border border-white/15 rounded-2xl shadow-xl p-3 w-48 ${className ?? ""}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.6 }}
      whileHover={{ y: -4 }}
    >
      {/* Hotel photo */}
      <div className="w-full h-24 rounded-xl overflow-hidden mb-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      <p className="text-xs font-bold text-white truncate">{name}</p>
      <p className="text-[10px] text-white/50 truncate mb-1">{location}</p>
      <Stars count={stars} />
      <p className="text-xs font-bold text-brand-yellow mt-1">{price}</p>
    </motion.div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({ feature, index }: { feature: typeof FEATURES_AR[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      className={`relative rounded-2xl bg-gradient-to-br ${feature.color} p-5 overflow-hidden`}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      {/* Decorative circle */}
      <div
        className="absolute -top-8 -end-8 w-32 h-32 rounded-full opacity-10"
        style={{ background: feature.accent }}
        aria-hidden="true"
      />
      <div className="relative" style={{ color: feature.accent }}>
        {feature.icon}
      </div>
      <h3 className="relative mt-3 text-sm font-bold text-white leading-snug">{feature.title}</h3>
      <p className="relative mt-1 text-xs text-white/65 leading-relaxed">{feature.desc}</p>
    </motion.div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────
export function HotelServiceSection() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const features = isAr ? FEATURES_AR : FEATURES_EN;

  return (
    <section className="section-dark relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="max-w-7xl mx-auto px-2 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left: Visual ── */}
          <motion.div
            className={`relative h-[420px] hidden lg:block ${isRTL ? "order-2" : "order-1"}`}
            initial={{ opacity: 0, x: isRTL ? 40 : -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            {/* Main illustration — hotel photo */}
            <div className="absolute inset-8 rounded-3xl overflow-hidden border border-brand-green/10 shadow-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HOTEL_IMAGES.main}
                alt="Luxury hotel"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* Overlay tint */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>

            {/* Floating cards */}
            <HotelCard
              name={isAr ? "فندق النيل الكبير" : "Grand Nile Hotel"}
              location={isAr ? "القاهرة، مصر" : "Cairo, Egypt"}
              price={isAr ? "من ٨٥٠ ج" : "From 850 EGP"}
              stars={5} delay={0.3}
              image={HOTEL_IMAGES.cairo}
              className="top-4 start-0"
            />
            <HotelCard
              name={isAr ? "ريزورت البحر الأحمر" : "Red Sea Resort"}
              location={isAr ? "الغردقة، مصر" : "Hurghada, Egypt"}
              price={isAr ? "من ١٢٠٠ ج" : "From 1200 EGP"}
              stars={4} delay={0.5}
              image={HOTEL_IMAGES.hurghada}
              className="bottom-8 end-0"
            />

            {/* Stat badge */}
            <motion.div
              className="absolute top-1/2 end-4 -translate-y-1/2 bg-brand-green rounded-2xl p-3 text-white shadow-xl"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.7 }}
            >
              <p className="text-2xl font-black">500+</p>
              <p className="text-[10px] text-white/70 leading-tight">{isAr ? "فندق\nمتاح" : "Hotels\nAvailable"}</p>
            </motion.div>

            {/* Review badge */}
            <motion.div
              className="absolute bottom-4 start-8 bg-white/10 border border-white/15 rounded-xl px-3 py-2 shadow-md flex items-center gap-2"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9 }}
            >
              <div className="w-7 h-7 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-yellow text-sm">★</div>
              <div>
                <p className="text-xs font-bold text-white">4.9 / 5</p>
                <p className="text-[10px] text-white/50">{isAr ? "تقييم العملاء" : "Customer Rating"}</p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── Right: Content ── */}
          <div className={`${isRTL ? "order-1" : "order-2"}`}>
            {/* Pill */}
            <motion.span
              className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-yellow bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-5"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse" />
              {isAr ? "خدمة الفنادق" : "Hotel Service"}
            </motion.span>

            <motion.h2
              className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              {isAr
                ? <>نامَ بارتياح —<br /><span className="text-brand-yellow">الفندق المثالي</span> ينتظرك</>
                : <>Sleep in Comfort —<br /><span className="text-brand-yellow">Your Perfect Hotel</span> Awaits</>
              }
            </motion.h2>

            <motion.p
              className="text-white/65 text-base leading-relaxed mb-8 max-w-md"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {isAr
                ? "من الغرفة الاقتصادية للجناح الفاخر — عندنا كل ما تحتاجه في وجهتك. احجز فندقك مع تذكرة الطيران وفيزا السفر في خطوة واحدة."
                : "From budget rooms to luxury suites — we have everything you need at your destination. Book your hotel with your flight ticket and travel visa in one step."
              }
            </motion.p>

            {/* Feature grid */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {features.map((f, i) => (
                <FeatureCard key={i} feature={f} index={i} />
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Link
                href="/hotel-booking"
                className="group inline-flex items-center gap-3 bg-brand-green text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-lg shadow-brand-green/25 hover:bg-brand-green-light hover:-translate-y-px transition-all duration-200"
              >
                <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4" aria-hidden="true">
                  <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.8"/>
                  <path d="M3 9h14M7 5V3M13 5V3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                {isAr ? "احجز فندقك الآن" : "Book Your Hotel Now"}
                <svg viewBox="0 0 16 16" fill="none" className={`w-3.5 h-3.5 transition-transform group-hover:translate-x-1 ${isRTL ? "rotate-180 group-hover:-translate-x-1 group-hover:translate-x-0" : ""}`} aria-hidden="true">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
