"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";

const ARTICLE_SLUGS = [
  "the-red-sea-you-ll-never-want-to-leave",
  "6-essentials-to-pack-for-your-summer-trip",
  "trendiest-travel-destinations-2024",
];

const GRADIENTS = [
  "from-[#2473BC] to-[#1A5C8A]",
  "from-[#3D6833] to-[#FDD12A]",
  "from-[#1A3A2A] to-[#3D6833]",
];

export function TravelNewsSection() {
  const { t, isRTL } = useI18n();
  const s = t.news;

  return (
    <section className="section-light py-10 sm:py-16" aria-labelledby="travel-news-title">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <h2 id="travel-news-title" className="text-xl sm:text-2xl md:text-3xl font-bold text-text-primary">
            {s.title}
          </h2>
          <Link href="/en-eg/travel-news" className="text-xs sm:text-sm font-semibold text-brand-red hover:underline flex items-center gap-1">
            {s.viewAll}
            {isRTL ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
          </Link>
        </div>

        {/* Grid — 1 col mobile, 2 tablet (show first 2), 3 desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {s.articles.map((article, i) => (
            <article
              key={ARTICLE_SLUGS[i]}
              className={`bg-[#fffdf9] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group ${i === 2 ? "hidden sm:hidden lg:block" : ""}`}
            >
              {/* Image header */}
              <div className={`h-36 sm:h-44 bg-linear-to-br ${GRADIENTS[i]} relative overflow-hidden flex items-end p-4 sm:p-5`}>
                <div className="absolute top-3 right-3 opacity-10" aria-hidden="true">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="white">
                    <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                  </svg>
                </div>
                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  {article.category}
                </span>
              </div>
              {/* Body */}
              <div className="p-4 sm:p-5">
                <p className="text-xs text-text-muted mb-1.5 sm:mb-2">{article.date}</p>
                <h3 className="text-sm sm:text-base font-bold text-text-primary mb-2 sm:mb-3 leading-snug group-hover:text-brand-red transition-colors line-clamp-2">
                  {article.title}
                </h3>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed mb-3 sm:mb-4 line-clamp-2 sm:line-clamp-3">
                  {article.excerpt}
                </p>
                <Link
                  href={`/en-eg/${ARTICLE_SLUGS[i]}`}
                  className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand-red hover:gap-2 transition-all"
                >
                  {s.readMore}
                  {isRTL ? <ChevronLeftIcon size={12} /> : <ChevronRightIcon size={12} />}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
