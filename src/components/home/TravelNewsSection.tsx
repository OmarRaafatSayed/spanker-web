"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { BRAND_COLORS } from "@/lib/brand/colors";

const ARTICLE_SLUGS = [
  "the-red-sea-you-ll-never-want-to-leave",
  "6-essentials-to-pack-for-your-summer-trip",
  "trendiest-travel-destinations-2024",
];

/* Real images mapped per article */
const ARTICLE_IMAGES = [
  "/images/offers/hurghada.jpg",
  "/images/offers/aswan.jpg",
  "/images/offers/budapest.jpg",
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-40px" },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
});

export function TravelNewsSection() {
  const { t, isRTL, locale } = useI18n();
  const isAr = locale === "ar";
  const s = t.news;

  return (
    <section
      className="py-12 md:py-16 overflow-hidden relative"
      style={{
        background: BRAND_COLORS.green,
        backgroundImage:
          "radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)",
        backgroundSize: "22px 22px",
      }}
      aria-labelledby="travel-news-title"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* ── Header ── */}
        <motion.div
          className="flex items-end justify-between mb-8 gap-4 flex-wrap"
          {...fadeUp()}
        >
          <div>
            <span
              className="inline-block text-[10px] font-black uppercase tracking-[0.22em] mb-2 px-3 py-1 rounded-full border border-white/30"
              style={{ color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.15)" }}
            >
              {isAr ? "أحدث الأخبار" : "Latest News"}
            </span>
            <h2
              id="travel-news-title"
              className="text-3xl sm:text-4xl md:text-5xl font-black leading-none"
              style={{
                color: "#fff",
                fontFamily: isAr
                  ? "var(--font-cairo), sans-serif"
                  : "var(--font-geist-sans, system-ui), sans-serif",
                letterSpacing: "-0.02em",
              }}
            >
              {s.title}
            </h2>
          </div>
          <Link
            href="/en-eg/travel-news"
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide hover:opacity-70 transition-opacity"
            style={{ color: "#fff" }}
          >
            {s.viewAll}
            {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
          </Link>
        </motion.div>

        {/* ── Grid ── */}
        {/* Mobile: vertical stack | Desktop: fixed-height row */}
        <div className="flex flex-col lg:grid lg:grid-cols-[3fr_2fr] gap-4 lg:h-[340px]">

          {/* ── Featured article (large) ── */}
          <motion.article
            className="group rounded-2xl overflow-hidden cursor-pointer flex flex-col lg:flex-row"
            style={{ background: "#fff" }}
            {...fadeUp(0.05)}
          >
            {/* Image — left half on desktop, top on mobile */}
            <div className="relative w-full lg:w-[55%] shrink-0 overflow-hidden" style={{ height: "200px" }} data-lg-h="full">
              <div className="relative h-full lg:h-full">
                <Image
                  src={ARTICLE_IMAGES[0]}
                  alt={s.articles[0].title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 1024px) 100vw, 35vw"
                  quality={85}
                />
                <span
                  className="absolute top-3 start-3 text-[10px] font-black uppercase tracking-widest rounded-full px-2.5 py-1 text-white"
                  style={{ background: BRAND_COLORS.green }}
                >
                  {s.articles[0].category}
                </span>
              </div>
            </div>

            {/* Text — right side on desktop */}
            <div className="flex flex-col justify-center p-4 sm:p-5 min-w-0">
              <p className="text-xs font-semibold mb-1.5" style={{ color: "#6b7c6b" }}>
                {s.articles[0].date}
              </p>
              <h3
                className="text-base sm:text-lg font-black leading-snug mb-2 group-hover:opacity-70 transition-opacity line-clamp-2"
                style={{ color: "#0d1f0d", letterSpacing: "-0.01em" }}
              >
                {s.articles[0].title}
              </h3>
              <p className="text-xs leading-relaxed line-clamp-3 mb-3" style={{ color: "#4a5c4a" }}>
                {s.articles[0].excerpt}
              </p>
              <Link
                href={`/en-eg/${ARTICLE_SLUGS[0]}`}
                className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide hover:gap-3 transition-all duration-200"
                style={{ color: BRAND_COLORS.green }}
              >
                {s.readMore} {isRTL ? <ArrowLeft size={12} /> : <ArrowRight size={12} />}
              </Link>
            </div>
          </motion.article>

          {/* ── Sidebar: articles 2 & 3 ── */}
          <div className="flex flex-col gap-4 lg:h-full">
            {([1, 2] as const).map((idx, i) => (
              <motion.article
                key={ARTICLE_SLUGS[idx]}
                className="group rounded-2xl overflow-hidden cursor-pointer flex flex-row flex-1"
                style={{ background: "#fff" }}
                {...fadeUp(0.1 + i * 0.08)}
              >
                {/* Image — left square */}
                <div className="relative shrink-0 overflow-hidden rounded-s-2xl" style={{ width: "110px" }}>
                  <Image
                    src={ARTICLE_IMAGES[idx]}
                    alt={s.articles[idx].title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="110px"
                    quality={80}
                  />
                  <span
                    className="absolute top-2 start-2 text-[9px] font-black uppercase tracking-widest rounded-full px-2 py-0.5 text-white leading-tight"
                    style={{ background: BRAND_COLORS.green }}
                  >
                    {s.articles[idx].category}
                  </span>
                </div>

                {/* Text */}
                <div className="flex flex-col justify-center p-3 min-w-0">
                  <p className="text-[10px] font-semibold mb-1" style={{ color: "#6b7c6b" }}>
                    {s.articles[idx].date}
                  </p>
                  <h3
                    className="text-sm font-black leading-snug mb-1.5 line-clamp-2 group-hover:opacity-70 transition-opacity"
                    style={{ color: "#0d1f0d", letterSpacing: "-0.01em" }}
                  >
                    {s.articles[idx].title}
                  </h3>
                  <Link
                    href={`/en-eg/${ARTICLE_SLUGS[idx]}`}
                    className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wide hover:gap-2 transition-all duration-200"
                    style={{ color: BRAND_COLORS.green }}
                  >
                    {s.readMore} {isRTL ? <ArrowLeft size={10} /> : <ArrowRight size={10} />}
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
