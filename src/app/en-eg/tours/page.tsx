"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { PageShell } from "@/components/layout/PageShell";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/modules/auth";
import { LoginModal } from "@/components/ui/LoginModal";
import { cn } from "@/lib/utils";

// ─── Static data ──────────────────────────────────────────────────────────────

const TOURS = [
  {
    id: "nile-cruise",
    emoji: "🚢",
    titleAr: "كروز النيل الفاخر",
    titleEn: "Luxury Nile Cruise",
    descAr: "رحلة لا تُنسى على نهر النيل بين الأقصر وأسوان مع زيارة أشهر المعابد الفرعونية.",
    descEn: "An unforgettable journey along the Nile between Luxor and Aswan, visiting Egypt's most iconic temples.",
    daysAr: "5 أيام / 4 ليالي",
    daysEn: "5 Days / 4 Nights",
    priceAr: "يبدأ من 8,500 جنيه",
    priceEn: "From EGP 8,500",
    tag: "الأكثر حجزاً",
    tagEn: "Most Booked",
  },
  {
    id: "sharm-package",
    emoji: "🤿",
    titleAr: "باقة شرم الشيخ",
    titleEn: "Sharm El-Sheikh Package",
    descAr: "استمتع بشواطئ شرم الشيخ الساحرة وغوص في المياه الكريستالية لأجمل شعاب مرجانية.",
    descEn: "Enjoy Sharm's stunning beaches and dive into crystal-clear waters with world-class coral reefs.",
    daysAr: "4 أيام / 3 ليالي",
    daysEn: "4 Days / 3 Nights",
    priceAr: "يبدأ من 6,200 جنيه",
    priceEn: "From EGP 6,200",
    tag: "عرض محدود",
    tagEn: "Limited Offer",
  },
  {
    id: "cairo-pyramids",
    emoji: "🏛️",
    titleAr: "القاهرة والأهرامات",
    titleEn: "Cairo & Pyramids",
    descAr: "جولة شاملة في القاهرة التاريخية تشمل الأهرامات وأبو الهول والمتحف المصري والخان الخليلي.",
    descEn: "A full guided tour of historic Cairo including the Pyramids, Sphinx, Egyptian Museum, and Khan El-Khalili.",
    daysAr: "3 أيام / 2 ليالي",
    daysEn: "3 Days / 2 Nights",
    priceAr: "يبدأ من 4,500 جنيه",
    priceEn: "From EGP 4,500",
    tag: null,
    tagEn: null,
  },
  {
    id: "budapest-europe",
    emoji: "🏰",
    titleAr: "بودابست — أوروبا القلب",
    titleEn: "Budapest — Heart of Europe",
    descAr: "اكتشف جمال بودابست الرومانسي بجولة شاملة تتضمن الطيران والفندق والجولات السياحية.",
    descEn: "Discover Budapest's romantic charm with an all-inclusive package covering flights, hotel, and guided tours.",
    daysAr: "7 أيام / 6 ليالي",
    daysEn: "7 Days / 6 Nights",
    priceAr: "يبدأ من 6,481 جنيه",
    priceEn: "From EGP 6,481",
    tag: "شامل الطيران",
    tagEn: "Incl. Flights",
  },
  {
    id: "hurghada-diving",
    emoji: "🌊",
    titleAr: "باقة الغردقة والغطس",
    titleEn: "Hurghada Diving Package",
    descAr: "رحلة مثالية لعشاق البحر مع دروس غطس احترافية وجولات بحرية يومية في البحر الأحمر.",
    descEn: "Perfect for sea lovers — professional diving lessons and daily boat trips on the Red Sea.",
    daysAr: "5 أيام / 4 ليالي",
    daysEn: "5 Days / 4 Nights",
    priceAr: "يبدأ من 5,800 جنيه",
    priceEn: "From EGP 5,800",
    tag: null,
    tagEn: null,
  },
  {
    id: "aswan-abu-simbel",
    emoji: "⛩️",
    titleAr: "أسوان وأبو سمبل",
    titleEn: "Aswan & Abu Simbel",
    descAr: "زيارة معبد أبو سمبل الأسطوري وسد أسوان العالي وجزيرة فيلة في رحلة لا تُنسى.",
    descEn: "Visit the legendary Abu Simbel temple, Aswan High Dam, and the island of Philae on this unforgettable trip.",
    daysAr: "3 أيام / 2 ليالي",
    daysEn: "3 Days / 2 Nights",
    priceAr: "يبدأ من 5,000 جنيه",
    priceEn: "From EGP 5,000",
    tag: null,
    tagEn: null,
  },
];

const FEATURES = [
  {
    iconPath: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    titleAr: "باقات شاملة",
    titleEn: "All-Inclusive Packages",
    descAr: "طيران + فندق + جولات سياحية في باقة واحدة بسعر مميز",
    descEn: "Flights + hotel + tours bundled into one great-value package",
  },
  {
    iconPath: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    titleAr: "مرشد سياحي متخصص",
    titleEn: "Expert Tour Guide",
    descAr: "مرشدون محترفون ثنائيو اللغة في كل الجولات",
    descEn: "Professional bilingual guides accompany every tour",
  },
  {
    iconPath: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    titleAr: "أسعار مضمونة",
    titleEn: "Price Guaranteed",
    descAr: "لا رسوم خفية — السعر المعروض هو السعر النهائي",
    descEn: "No hidden fees — the price you see is the final price",
  },
];

// ─── Tour Card ────────────────────────────────────────────────────────────────

function TourCard({
  tour,
  isAr,
  onBook,
}: {
  tour: typeof TOURS[0];
  isAr: boolean;
  onBook: (tourId: string) => void;
}) {
  const tag = isAr ? tour.tag : tour.tagEn;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col gap-3 hover:border-brand-green/40 transition-all duration-200 group"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">{tour.emoji}</span>
          <div>
            <h3 className="font-bold text-white text-base leading-tight">
              {isAr ? tour.titleAr : tour.titleEn}
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              {isAr ? tour.daysAr : tour.daysEn}
            </p>
          </div>
        </div>
        {tag && (
          <span className="shrink-0 text-[10px] font-bold px-2 py-1 rounded-full bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/30">
            {tag}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-sm text-white/60 leading-relaxed flex-1">
        {isAr ? tour.descAr : tour.descEn}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/10">
        <span className="text-sm font-bold text-brand-yellow">
          {isAr ? tour.priceAr : tour.priceEn}
        </span>
        <button
          onClick={() => onBook(tour.id)}
          className="h-9 px-4 bg-brand-green text-white text-sm font-bold rounded-xl hover:bg-brand-green-light active:scale-95 transition-all duration-150 shadow-sm shadow-brand-green/20"
        >
          {isAr ? "احجز الآن" : "Book Now"}
        </button>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ToursPage() {
  const { locale } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  const isAr = locale === "ar";

  const [loginOpen, setLoginOpen] = useState(false);
  const [requested, setRequested] = useState<string | null>(null);

  function handleBook(tourId: string) {
    if (!user) {
      setLoginOpen(true);
      return;
    }
    // For now, redirect to special-offers or submit request
    // Future: dedicated tour booking flow per tourId
    setRequested(tourId);
  }

  return (
    <>
      <PageShell
        pageId="tours"
        heroTitle={isAr ? "رحلات سياحية مميزة" : "Tours & Packages"}
        heroSubtitle={
          isAr
            ? "اكتشف أجمل وجهاتنا مع باقات شاملة بأسعار لا تُنافس"
            : "Discover our top destinations with all-inclusive packages at unbeatable prices"
        }
        maxWidth="xl"
        heroIcon={
          <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        }
      >
        {/* ── Success banner after booking request ── */}
        {requested && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-brand-green/15 border border-brand-green/40 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">✅</span>
              <div>
                <p className="text-sm font-bold text-white">
                  {isAr ? "تم استلام طلبك!" : "Request Received!"}
                </p>
                <p className="text-xs text-white/60">
                  {isAr
                    ? "سيتواصل معك فريقنا خلال 24 ساعة بتفاصيل الباقة وسعرها النهائي."
                    : "Our team will contact you within 24 hours with full package details and pricing."}
                </p>
              </div>
            </div>
            <button
              onClick={() => setRequested(null)}
              className="text-white/40 hover:text-white transition shrink-0"
              aria-label="close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </motion.div>
        )}

        {/* ── Features ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {FEATURES.map((f) => (
            <div key={f.titleEn} className="bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
              <div className="w-11 h-11 rounded-xl bg-brand-green/20 border border-brand-green/30 flex items-center justify-center mx-auto mb-3 text-brand-green">
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d={f.iconPath} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="font-bold text-white text-sm mb-1">{isAr ? f.titleAr : f.titleEn}</h3>
              <p className="text-xs text-white/55 leading-relaxed">{isAr ? f.descAr : f.descEn}</p>
            </div>
          ))}
        </div>

        {/* ── Tours grid ── */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white mb-6">
            {isAr ? "الباقات المتاحة" : "Available Packages"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TOURS.map((tour, i) => (
              <motion.div
                key={tour.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <TourCard tour={tour} isAr={isAr} onBook={handleBook} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Custom trip CTA ── */}
        <div className="mt-10 bg-gradient-to-r from-brand-green/20 to-brand-green/5 border border-brand-green/30 rounded-3xl p-8 text-center">
          <p className="text-3xl mb-3">✈️</p>
          <h2 className="text-xl font-bold text-white mb-2">
            {isAr ? "باقة مخصصة لك؟" : "Want a Custom Package?"}
          </h2>
          <p className="text-white/60 text-sm mb-6 max-w-md mx-auto">
            {isAr
              ? "أخبرنا بوجهتك وتواريخ سفرك وميزانيتك وسنصمم لك باقة مثالية تناسبك تماماً."
              : "Tell us your destination, dates, and budget — we'll design the perfect package just for you."}
          </p>
          <Link
            href="/en-eg/special-offers"
            className="inline-flex items-center gap-2 h-11 px-6 bg-brand-green text-white font-bold rounded-xl hover:bg-brand-green-light transition-colors text-sm shadow-lg shadow-brand-green/20"
          >
            {isAr ? "شوف العروض الخاصة" : "Browse Special Offers"}
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </div>
      </PageShell>

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </>
  );
}
