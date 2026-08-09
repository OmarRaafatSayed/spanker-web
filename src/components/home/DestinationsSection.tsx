"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

const DESTINATIONS = [
  { nameEn: "Marsa Alam", nameAr: "مرسى علم", priceEn: "From EGP 3,200", priceAr: "من 3,200 جنيه", gradient: "from-[#2473BC] via-[#1A5C8A] to-[#0E3A5E]", pattern: "waves" },
  { nameEn: "Hurghada", nameAr: "الغردقة", priceEn: "From EGP 3,600", priceAr: "من 3,600 جنيه", gradient: "from-[#3D6833] via-[#4E8340] to-[#6A9E55]", pattern: "dots" },
  { nameEn: "Sharm el-Sheikh", nameAr: "شرم الشيخ", priceEn: "From EGP 4,500", priceAr: "من 4,500 جنيه", gradient: "from-[#1A5C8A] via-[#2473BC] to-[#5A9DD4]", pattern: "waves" },
  { nameEn: "Luxor", nameAr: "الأقصر", priceEn: "From EGP 2,800", priceAr: "من 2,800 جنيه", gradient: "from-[#2E5026] via-[#3D6833] to-[#5A8A48]", pattern: "sand" },
  { nameEn: "Aswan", nameAr: "أسوان", priceEn: "From EGP 3,100", priceAr: "من 3,100 جنيه", gradient: "from-[#1A3A2A] via-[#2E5026] to-[#3D6833]", pattern: "sand" },
  { nameEn: "Budapest", nameAr: "بودابست", priceEn: "From EGP 6,481", priceAr: "من 6,481 جنيه", gradient: "from-[#1A3A2A] via-[#3D6833]/80 to-[#FDD12A]/40", pattern: "dots" },
];

function DestinationPattern({ pattern }: { pattern: string }) {
  if (pattern === "waves") {
    return (
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path fill="white" d="M 0 50 Q 50 30 100 50 Q 150 70 200 50 L 200 200 L 0 200 Z" />
          <path d="M 0 80 Q 50 60 100 80 Q 150 100 200 80" stroke="white" strokeWidth="2" fill="none" />
        </svg>
      </div>
    );
  }
  if (pattern === "sand") {
    return (
      <div className="absolute inset-0 opacity-10" aria-hidden="true">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <ellipse cx="100" cy="160" rx="120" ry="40" fill="white" />
          <polygon points="100,40 120,100 80,100" fill="white" opacity="0.5" />
        </svg>
      </div>
    );
  }
  return (
    <div className="absolute inset-0 opacity-10" aria-hidden="true">
      {[...Array(12)].map((_, i) => (
        <div key={i} className="absolute rounded-full bg-white" style={{ width: 8 + (i % 3) * 6 + "px", height: 8 + (i % 3) * 6 + "px", left: ((i % 4) * 25 + 10) + "%", top: (Math.floor(i / 4) * 33 + 10) + "%" }} />
      ))}
    </div>
  );
}

export function DestinationsSection() {
  const { t, isRTL } = useI18n();
  const s = t.destinations;

  return (
    <section className="bg-white py-10 sm:py-16" aria-labelledby="destinations-title">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h2 id="destinations-title" className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary">
            {s.title}
          </h2>
          <Link href="/en-eg/route-map" className="text-xs sm:text-sm font-semibold text-brand-red hover:underline hidden sm:block">
            {s.viewRouteMap}
          </Link>
        </div>

        {/* Grid — 2 cols mobile, 2 tablet, 3 desktop */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5">
          {DESTINATIONS.map((dest) => (
            <Link
              key={dest.nameEn}
              href="/en-eg/special-offers"
              className="group relative overflow-hidden rounded-xl sm:rounded-2xl h-40 sm:h-52 md:h-56 block"
            >
              <div className={`absolute inset-0 bg-linear-to-br ${dest.gradient} transition-transform duration-500 group-hover:scale-105`} />
              <DestinationPattern pattern={dest.pattern} />
              {/* Overlay text */}
              <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 to-transparent p-3 sm:p-5">
                <h3 className="text-white font-bold text-sm sm:text-xl mb-0.5">
                  {isRTL ? dest.nameAr : dest.nameEn}
                </h3>
                <p className="text-white/80 text-xs sm:text-sm font-medium">
                  {isRTL ? dest.priceAr : dest.priceEn}
                </p>
              </div>
              {/* Hover CTA — desktop only */}
              <div className="absolute inset-0 hidden sm:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="bg-brand-red text-white text-sm font-semibold px-5 py-2 rounded-full shadow-lg">
                  {s.exploreNow}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
