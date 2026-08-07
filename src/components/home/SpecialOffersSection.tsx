"use client";

import { useRef } from "react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const OFFERS = [
  { from: "Cairo", fromAr: "القاهرة", to: "Marsa Alam", toAr: "مرسى علم", price: "3,200", currency: "EGP", bgColor: "#2473BC" },
  { from: "Cairo", fromAr: "القاهرة", to: "Luxor", toAr: "الأقصر", price: "2,800", currency: "EGP", bgColor: "#3D6833" },
  { from: "Cairo", fromAr: "القاهرة", to: "Aswan", toAr: "أسوان", price: "3,100", currency: "EGP", bgColor: "#2E5026" },
  { from: "Cairo", fromAr: "القاهرة", to: "Sharm el-Sheikh", toAr: "شرم الشيخ", price: "4,500", currency: "EGP", bgColor: "#1A5C8A" },
  { from: "Cairo", fromAr: "القاهرة", to: "Hurghada", toAr: "الغردقة", price: "3,600", currency: "EGP", bgColor: "#3D6833" },
  { from: "Kuwait", fromAr: "الكويت", to: "Alexandria", toAr: "الإسكندرية", price: "6,200", currency: "EGP", bgColor: "#1A3A2A" },
];

function PlaneOfferIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-80" aria-hidden="true">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.6 1.1.5L8 9.5l-2 3.5L4 14c-.4.3-.4.8 0 1l2 2c.3.4.8.4 1 0l1.5-2 3.5-2-.5 4.2c-.1.5.2.9.7 1l2.5 1.5c.5.3 1 0 1.1-.5z" />
    </svg>
  );
}

export function SpecialOffersSection() {
  const { t, isRTL } = useI18n();
  const s = t.offers;
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(direction: "left" | "right") {
    if (!scrollRef.current) return;
    const card = scrollRef.current.querySelector<HTMLElement>("[data-offer-card]");
    const cardWidth = card ? card.offsetWidth + 20 : 300;
    // In RTL, visually "next" means scrolling left in the DOM
    const rtlMultiplier = isRTL ? -1 : 1;
    scrollRef.current.scrollBy({
      left: direction === "right" ? cardWidth * 2 * rtlMultiplier : -cardWidth * 2 * rtlMultiplier,
      behavior: "smooth",
    });
  }

  return (
    <section className="bg-bg-alt py-16" aria-labelledby="special-offers-title">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 id="special-offers-title" className="text-2xl md:text-3xl font-bold text-text-primary">
            {s.title}
          </h2>
          <Link href="/en-eg/special-offers" className="text-sm font-semibold text-brand-red hover:underline flex items-center gap-1">
            {s.viewAll}
            {isRTL ? <ChevronLeftIcon size={16} /> : <ChevronRightIcon size={16} />}
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Prev */}
          <button
            onClick={() => scroll("left")}
            aria-label={isRTL ? "التالي" : "Previous"}
            className="absolute -start-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-text-primary hover:text-brand-red hover:shadow-lg transition-all"
          >
            {isRTL ? <ChevronRightIcon size={20} /> : <ChevronLeftIcon size={20} />}
          </button>

          <div
            ref={scrollRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide pb-2 scroll-smooth"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {OFFERS.map((offer) => (
              <div
                key={`${offer.from}-${offer.to}`}
                data-offer-card
                className="flex-none w-65 md:w-70 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden group"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="px-5 py-6 flex items-center justify-between" style={{ backgroundColor: offer.bgColor }}>
                  <div className="text-white">
                    <p className="text-xs font-medium uppercase tracking-wide opacity-80">
                      {isRTL ? offer.fromAr : offer.from}
                    </p>
                    <div className="flex items-center gap-2 my-1">
                      <div className="h-px w-8 bg-white/60" />
                      <PlaneOfferIcon />
                      <div className="h-px w-8 bg-white/60" />
                    </div>
                    <p className="text-base font-bold">{isRTL ? offer.toAr : offer.to}</p>
                  </div>
                </div>
                <div className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">{s.from}</p>
                    <p className="text-xl font-bold text-text-primary">
                      {offer.currency} {offer.price}
                    </p>
                  </div>
                  <Link href="/en-eg/book-flight" className="px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-dark transition-colors">
                    {s.bookNow}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Next */}
          <button
            onClick={() => scroll("right")}
            aria-label={isRTL ? "السابق" : "Next"}
            className="absolute -end-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-text-primary hover:text-brand-red hover:shadow-lg transition-all"
          >
            {isRTL ? <ChevronLeftIcon size={20} /> : <ChevronRightIcon size={20} />}
          </button>
        </div>
      </div>
    </section>
  );
}
