"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";

const OFFERS = [
  {
    id: "marsa-alam",
    from: "Cairo",        fromAr: "القاهرة",
    to: "Marsa Alam",     toAr: "مرسى علم",
    price: "3,200",       currency: "EGP",
    image: "/images/offers/marsa-alam.jpg",
    validUntil: "30 Sep 2026", validUntilAr: "30 سبتمبر 2026",
    descEn: "Crystal-clear Red Sea waters, world-class diving, and white sandy beaches. Escape to Marsa Alam this season.",
    descAr: "مياه البحر الأحمر الصافية، غوص عالمي المستوى، وشواطئ رملية بيضاء. هرّب نفسك إلى مرسى علم هذا الموسم.",
  },
  {
    id: "luxor",
    from: "Cairo",        fromAr: "القاهرة",
    to: "Luxor",          toAr: "الأقصر",
    price: "2,800",       currency: "EGP",
    image: "/images/offers/luxor.jpg",
    validUntil: "31 Dec 2026", validUntilAr: "31 ديسمبر 2026",
    descEn: "Walk among ancient temples and the Valley of the Kings. Luxor is open year-round and now more affordable than ever.",
    descAr: "تجوّل بين المعابد الفرعونية ووادي الملوك. الأقصر مفتوحة طوال العام وبأسعار لا تُقاوَم.",
  },
  {
    id: "aswan",
    from: "Cairo",        fromAr: "القاهرة",
    to: "Aswan",          toAr: "أسوان",
    price: "3,100",       currency: "EGP",
    image: "/images/offers/aswan.jpg",
    validUntil: "31 Dec 2026", validUntilAr: "31 ديسمبر 2026",
    descEn: "Sail on the Nile, visit Abu Simbel, and feel the warmth of Upper Egypt. Aswan awaits.",
    descAr: "أبحر على النيل، زر أبو سمبل، وأحس بدفء صعيد مصر. أسوان تنتظرك.",
  },
  {
    id: "sharm",
    from: "Cairo",        fromAr: "القاهرة",
    to: "Sharm el-Sheikh", toAr: "شرم الشيخ",
    price: "4,500",       currency: "EGP",
    image: "/images/offers/sharm.jpg",
    validUntil: "30 Nov 2026", validUntilAr: "30 نوفمبر 2026",
    descEn: "Sun, sea, and world-famous coral reefs. Sharm el-Sheikh is Egypt's premier resort destination.",
    descAr: "شمس وبحر وشعاب مرجانية عالمية الشهرة. شرم الشيخ هي الوجهة الأولى في مصر.",
  },
  {
    id: "hurghada",
    from: "Cairo",        fromAr: "القاهرة",
    to: "Hurghada",       toAr: "الغردقة",
    price: "3,600",       currency: "EGP",
    image: "/images/offers/hurghada.jpg",
    validUntil: "30 Nov 2026", validUntilAr: "30 نوفمبر 2026",
    descEn: "Family-friendly resorts, vibrant nightlife, and endless watersports on the Red Sea coast.",
    descAr: "منتجعات مناسبة للعائلات، حياة ليلية نابضة، ورياضات مائية لا نهاية لها على ساحل البحر الأحمر.",
  },
  {
    id: "alexandria",
    from: "Kuwait",       fromAr: "الكويت",
    to: "Alexandria",     toAr: "الإسكندرية",
    price: "6,200",       currency: "EGP",
    image: "/images/offers/alexandria.jpg",
    validUntil: "31 Oct 2026", validUntilAr: "31 أكتوبر 2026",
    descEn: "The pearl of the Mediterranean — history, culture, and fresh seafood await you in Alexandria.",
    descAr: "عروس البحر المتوسط — التاريخ والثقافة والمأكولات البحرية الطازجة تنتظرك في الإسكندرية.",
  },
  {
    id: "budapest",
    from: "Cairo",        fromAr: "القاهرة",
    to: "Budapest",       toAr: "بودابست",
    price: "6,481",       currency: "EGP",
    image: "/images/offers/budapest.jpg",
    validUntil: "30 Nov 2026", validUntilAr: "30 نوفمبر 2026",
    descEn: "Europe's most romantic city — thermal baths, stunning architecture, and vibrant culture. Discover Budapest in autumn.",
    descAr: "أجمل مدينة رومانسية في أوروبا — حمامات حرارية، معمار رائع، وثقافة نابضة. اكتشف بودابست في الخريف.",
  },
];

function PlaneIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.6 1.1.5L8 9.5l-2 3.5L4 14c-.4.3-.4.8 0 1l2 2c.3.4.8.4 1 0l1.5-2 3.5-2-.5 4.2c-.1.5.2.9.7 1l2.5 1.5c.5.3 1 0 1.1-.5z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

export default function SpecialOffersPage() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-alt pt-18 pb-20 lg:pb-0" dir={isRTL ? "rtl" : "ltr"}>

        {/* Hero */}
        <section className="bg-brand-red text-white py-14 sm:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              {isAr ? "العروض الخاصة" : "Special Offers"}
            </h1>
            <p className="text-white/80 text-base">
              {isAr
                ? "أفضل أسعار الرحلات المتاحة الآن — احجز قبل أن تنتهي"
                : "Best available fares right now — book before they're gone"}
            </p>
            <p className="text-white/60 text-sm mt-2">
              {isAr ? `${OFFERS.length} عرض متاح` : `${OFFERS.length} offers available`}
            </p>
          </div>
        </section>

        {/* Offers grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {OFFERS.map((offer) => (
              <article
                key={offer.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 group flex flex-col"
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <Image
                    src={offer.image}
                    alt={isAr ? offer.toAr : offer.to}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />

                  {/* Route overlay */}
                  <div className="absolute bottom-3 start-3 end-3 flex items-end justify-between text-white">
                    <div>
                      <p className="text-xs opacity-75 mb-0.5">
                        {isAr ? offer.fromAr : offer.from}
                        {" → "}
                        {isAr ? offer.toAr : offer.to}
                      </p>
                    </div>
                    <div className="text-brand-yellow opacity-90">
                      <PlaneIcon />
                    </div>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex flex-col gap-3 flex-1">
                  {/* Destination name */}
                  <h2 className={cn("text-lg font-bold text-text-primary", isAr ? "text-right" : "")}>
                    {isAr ? offer.toAr : offer.to}
                  </h2>

                  {/* Description */}
                  <p className={cn("text-sm text-text-secondary leading-relaxed flex-1", isAr ? "text-right" : "")}>
                    {isAr ? offer.descAr : offer.descEn}
                  </p>

                  {/* Valid until */}
                  <div className={cn("flex items-center gap-1.5 text-xs text-text-muted", isAr ? "flex-row-reverse" : "")}>
                    <CalendarIcon />
                    <span>
                      {isAr ? "صالح حتى" : "Valid until"}{" "}
                      {isAr ? offer.validUntilAr : offer.validUntil}
                    </span>
                  </div>

                  {/* Price + CTA */}
                  <div className={cn("flex items-center justify-between pt-3 border-t border-border-light", isAr ? "flex-row-reverse" : "")}>
                    <div className={isAr ? "text-right" : ""}>
                      <p className="text-xs text-text-muted mb-0.5">
                        {isAr ? "من" : "From"}
                      </p>
                      <p className="text-2xl font-extrabold text-brand-red tabular-nums">
                        {offer.price}
                        <span className="text-sm font-semibold text-text-secondary ms-1">{offer.currency}</span>
                      </p>
                    </div>
                    <Link
                      href="/en-eg/book-flight"
                      className="px-5 py-2.5 bg-brand-red text-white text-sm font-semibold rounded-xl hover:bg-brand-red-dark transition-colors"
                    >
                      {isAr ? "احجز الآن" : "Book Now"}
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
      <BottomNav />
    </>
  );
}
