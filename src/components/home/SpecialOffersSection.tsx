"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { Button } from "@/components/ui/button";

const OFFERS = [
  {
    from: "Cairo",  fromAr: "القاهرة",
    to: "Marsa Alam", toAr: "مرسى علم",
    price: "3,200", currency: "EGP",
    image: "/images/offers/marsa-alam.jpg",
  },
  {
    from: "Cairo",  fromAr: "القاهرة",
    to: "Luxor",    toAr: "الأقصر",
    price: "2,800", currency: "EGP",
    image: "/images/offers/luxor.jpg",
  },
  {
    from: "Cairo",  fromAr: "القاهرة",
    to: "Aswan",    toAr: "أسوان",
    price: "3,100", currency: "EGP",
    image: "/images/offers/aswan.jpg",
  },
  {
    from: "Cairo",  fromAr: "القاهرة",
    to: "Sharm el-Sheikh", toAr: "شرم الشيخ",
    price: "4,500", currency: "EGP",
    image: "/images/offers/sharm.jpg",
  },
  {
    from: "Cairo",  fromAr: "القاهرة",
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
    from: "Cairo",  fromAr: "القاهرة",
    to: "Budapest", toAr: "بودابست",
    price: "6,481", currency: "EGP",
    image: "/images/offers/budapest.jpg",
  },
];

function PlaneOfferIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-brand-green shrink-0"
      aria-hidden="true"
    >
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
    const cardWidth = card ? card.offsetWidth + 16 : 280;
    const delta = direction === "right" ? cardWidth * 2 : -cardWidth * 2;
    scrollRef.current.scrollBy({ left: isRTL ? -delta : delta, behavior: "smooth" });
  }

  return (
    <section className="bg-bg-alt py-14 md:py-20" aria-labelledby="special-offers-title">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          className="flex items-center justify-between mb-8"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="special-offers-title"
            className="text-2xl md:text-3xl font-bold text-text-luxury"
          >
            {s.title}
          </h2>

          <Link href="/en-eg/special-offers">
            <Button
              variant="outline"
              size="sm"
              className="border-border-luxury text-text-secondary hover:border-brand-green hover:text-brand-green gap-1"
            >
              {s.viewAll}
              {isRTL ? <ChevronLeftIcon size={15} /> : <ChevronRightIcon size={15} />}
            </Button>
          </Link>
        </motion.div>

        {/* ── Carousel ── */}
        <div className="relative">
          {/* Scroll arrows — desktop only */}
          <button
            onClick={() => scroll("left")}
            aria-label={isRTL ? "التالي" : "Previous"}
            className="absolute -start-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-border-luxury bg-[#fffdf9] shadow-md hidden md:flex items-center justify-center text-text-secondary hover:text-brand-green hover:border-brand-green transition-all"
          >
            {isRTL ? <ChevronRightIcon size={18} /> : <ChevronLeftIcon size={18} />}
          </button>

          <button
            onClick={() => scroll("right")}
            aria-label={isRTL ? "السابق" : "Next"}
            className="absolute -end-5 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full border border-border-luxury bg-[#fffdf9] shadow-md hidden md:flex items-center justify-center text-text-secondary hover:text-brand-green hover:border-brand-green transition-all"
          >
            {isRTL ? <ChevronLeftIcon size={18} /> : <ChevronRightIcon size={18} />}
          </button>

          {/* Cards strip */}
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-4 px-4 md:mx-0 md:px-0"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {OFFERS.map((offer, index) => (
              <motion.div
                key={`${offer.from}-${offer.to}`}
                data-offer-card
                className="flex-none w-[72vw] max-w-[280px] md:w-72 rounded-2xl overflow-hidden bg-[#fffdf9] border border-border-light shadow-sm hover:shadow-md group cursor-pointer transition-shadow duration-200"
                style={{ scrollSnapAlign: "start" }}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: index * 0.07 }}
                whileHover={{ y: -4 }}
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <Image
                    src={offer.image}
                    alt={isRTL ? offer.toAr : offer.to}
                    fill
                    className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 72vw, 280px"
                  />

                  {/* Scrim */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

                  {/* Price badge — top start */}
                  <div className="absolute top-3 start-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow">
                    <span className="text-xs font-bold text-brand-green">{offer.currency}</span>
                    <span className="text-xs font-bold text-text-luxury">{offer.price}</span>
                  </div>

                  {/* Destination — bottom, full width, no clipping */}
                  <div className="absolute bottom-0 inset-x-0 px-3 pb-3">
                    <p className="text-base font-bold text-white leading-tight truncate">
                      {isRTL ? offer.toAr : offer.to}
                    </p>
                    <p className="text-xs text-white/75 mt-0.5">
                      {isRTL ? `من ${offer.fromAr}` : `From ${offer.from}`}
                    </p>
                  </div>
                </div>

                {/* Body */}
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    {/* Trip type */}
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <PlaneOfferIcon />
                      <span className="text-xs">{t.common.roundTrip}</span>
                    </div>

                    {/* Price */}
                    <div className="text-end">
                      <p className="text-[10px] text-text-muted leading-none mb-0.5">{t.common.startingFrom}</p>
                      <p className="text-base font-bold text-brand-green leading-none">
                        {offer.currency} {offer.price}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="luxury"
                    size="sm"
                    className="w-full mt-3"
                  >
                    {t.common.bookNow}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
