"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const OFFERS = [
  {
    from: "Cairo", fromAr: "القاهرة",
    to: "Marsa Alam", toAr: "مرسى علم",
    price: "3,200", currency: "EGP",
    image: "/images/offers/marsa-alam.jpg",
  },
  {
    from: "Cairo", fromAr: "القاهرة",
    to: "Luxor", toAr: "الأقصر",
    price: "2,800", currency: "EGP",
    image: "/images/offers/luxor.jpg",
  },
  {
    from: "Cairo", fromAr: "القاهرة",
    to: "Aswan", toAr: "أسوان",
    price: "3,100", currency: "EGP",
    image: "/images/offers/aswan.jpg",
  },
  {
    from: "Cairo", fromAr: "القاهرة",
    to: "Sharm el-Sheikh", toAr: "شرم الشيخ",
    price: "4,500", currency: "EGP",
    image: "/images/offers/sharm.jpg",
  },
  {
    from: "Cairo", fromAr: "القاهرة",
    to: "Hurghada", toAr: "الغردقة",
    price: "3,600", currency: "EGP",
    image: "/images/offers/hurghada.jpg",
  },
  {
    from: "Kuwait", fromAr: "الكويت",
    to: "Alexandria", toAr: "الإسكندرية",
    price: "6,200", currency: "EGP",
    image: "/images/offers/alexandria.jpg",
  },
  {
    from: "Cairo", fromAr: "القاهرة",
    to: "Budapest", toAr: "بودابست",
    price: "6,481", currency: "EGP",
    image: "/images/offers/budapest.jpg",
  },
];

function PlaneOfferIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90" aria-hidden="true">
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
            className="absolute -start-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white rounded-full shadow-md hidden md:flex items-center justify-center text-text-primary hover:text-brand-red hover:shadow-lg transition-all"
          >
            {isRTL ? <ChevronRightIcon size={20} /> : <ChevronLeftIcon size={20} />}
          </button>

          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-5 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {OFFERS.map((offer) => (
              <div
                key={`${offer.from}-${offer.to}`}
                data-offer-card
                className="flex-none w-64 md:w-70 bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
                style={{ scrollSnapAlign: "start" }}
              >
                {/* Image header */}
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={offer.image}
                    alt={offer.to}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="280px"
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  {/* Route badge */}
                  <div className="absolute bottom-3 start-3 end-3 flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs font-medium opacity-80">
                        {isRTL ? offer.fromAr : offer.from}
                      </p>
                      <p className="text-base font-bold leading-tight">
                        {isRTL ? offer.toAr : offer.to}
                      </p>
                    </div>
                    <div className="text-brand-yellow">
                      <PlaneOfferIcon />
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-text-muted mb-0.5">{s.from}</p>
                    <p className="text-xl font-bold text-text-primary">
                      {offer.currency}{" "}
                      <span className="text-brand-red">{offer.price}</span>
                    </p>
                  </div>
                  <Link
                    href="/en-eg/book-flight"
                    className="px-4 py-2 bg-brand-red text-white text-sm font-semibold rounded-lg hover:bg-brand-red-dark transition-colors"
                  >
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
