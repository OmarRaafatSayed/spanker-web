"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";
import { BRAND_COLORS } from "@/lib/brand/colors";
import { Search, Plane, Hotel, Map, UtensilsCrossed, Sparkles } from "lucide-react";

/* ─────────────────────────────────────────────
   Tabs
───────────────────────────────────────────── */
const TABS_EN = [
  { id: "all",     label: "Search All",       Icon: Search       },
  { id: "hotels",  label: "Hotels",           Icon: Hotel        },
  { id: "things",  label: "Things to Do",     Icon: Map          },
  { id: "food",    label: "Restaurants",      Icon: UtensilsCrossed },
  { id: "flights", label: "Flights",          Icon: Plane        },
  { id: "ai",      label: "AI Trip Planner",  Icon: Sparkles     },
];

const TABS_AR = [
  { id: "all",     label: "البحث الكامل",       Icon: Search       },
  { id: "hotels",  label: "فنادق",              Icon: Hotel        },
  { id: "things",  label: "أنشطة",              Icon: Map          },
  { id: "food",    label: "مطاعم",              Icon: UtensilsCrossed },
  { id: "flights", label: "رحلات",              Icon: Plane        },
  { id: "ai",      label: "مخطط الرحلة الذكي",  Icon: Sparkles     },
];

/* quick AI suggestion chips */
const CHIPS_EN = ["Beach escape 🏖️", "City break 🏙️", "Adventure trip 🧗", "Family holiday 👨‍👩‍👧", "Romantic getaway 💑"];
const CHIPS_AR = ["شاطئ وراحة 🏖️", "مدينة وثقافة 🏙️", "مغامرة 🧗", "عائلي 👨‍👩‍👧", "رومانسي 💑"];

/* ─────────────────────────────────────────────
   AI mini-widget shown inside hero
───────────────────────────────────────────── */
function AiHeroWidget({ isAr }: { isAr: boolean }) {
  const [prompt, setPrompt] = useState("");
  const chips = isAr ? CHIPS_AR : CHIPS_EN;

  return (
    <div className="w-full max-w-2xl">
      {/* chip row */}
      <div className="flex gap-2 mb-3 flex-wrap justify-center">
        {chips.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setPrompt(c.split(" ")[0])}
            className="text-xs font-semibold px-3 py-1.5 rounded-full transition-all hover:scale-105 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.14)",
              border: "1px solid rgba(255,255,255,0.28)",
              color: "#fff",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {/* input row */}
      <div
        className="flex items-center gap-3 rounded-full px-5 py-3"
        style={{
          background: "rgba(255,255,255,0.10)",
          backdropFilter: "blur(2px)",
          WebkitBackdropFilter: "blur(2px)",
          border: "1px solid rgba(255,255,255,0.22)",
        }}
      >
        <Sparkles size={20} className="shrink-0" style={{ color: BRAND_COLORS.yellow }} />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={isAr ? "أخبرني عن رحلة أحلامك..." : "Tell me about your dream trip…"}
          className="flex-1 bg-transparent outline-none border-none text-base font-medium text-white placeholder:text-white/55 min-w-0 caret-white"
        />
        <button
          type="button"
          className="shrink-0 inline-flex items-center gap-1.5 font-bold text-sm rounded-full px-5 py-2.5 transition-all hover:scale-[1.04] active:scale-95"
          style={{ background: BRAND_COLORS.yellow, color: BRAND_COLORS.green }}
        >
          <Sparkles size={14} />
          {isAr ? "خطط الآن" : "Plan now"}
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main component
───────────────────────────────────────────── */
export function HeroBanner() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const [activeTab, setActiveTab] = useState("all");
  const [query, setQuery]         = useState("");
  const inputRef                  = useRef<HTMLInputElement>(null);

  const tabs = isAr ? TABS_AR : TABS_EN;
  const isAiTab = activeTab === "ai";

  return (
    <section className="w-full flex flex-col" aria-label="Hero">

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <div
        className="relative w-full overflow-hidden flex flex-col"
        style={{ aspectRatio: "1308 / 816", minHeight: "480px", maxHeight: "92vh" }}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/images/hero/hero-bg.jpg"
            alt="Hero Background"
            fill
            priority
            quality={95}
            className="object-cover"
            style={{ objectPosition: "center 70%" }}
            sizes="100vw"
          />
        </div>

        {/* Overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.55) 100%)",
          }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="relative flex-1 flex flex-col justify-center items-center text-center py-16">

          {/* Headline */}
          <div className="px-5 sm:px-10 lg:px-20 mb-5 sm:mb-7 w-full">
            <motion.h1
              className="text-white leading-[0.92]"
              style={
                isAr
                  ? {
                      fontFamily: "var(--font-cairo), sans-serif",
                      fontWeight: 900,
                      fontSize: "clamp(3.5rem, 11vw, 8rem)",
                      letterSpacing: "-0.01em",
                      textShadow: "0 2px 12px rgba(0,0,0,0.4)",
                    }
                  : {
                      fontFamily: "var(--font-jakarta), sans-serif",
                      fontWeight: 800,
                      fontSize: "clamp(4rem, 11vw, 9rem)",
                      letterSpacing: "-0.03em",
                      lineHeight: 0.92,
                      textShadow: "0 2px 16px rgba(0,0,0,0.3)",
                    }
              }
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            >
              {isAr ? (
                <>احجز هنا<br />سافر هناك.</>
              ) : (
                <>Book here<br />Go there.</>
              )}
            </motion.h1>
          </div>

          {/* Search/AI card */}
          <motion.div
            className="px-4 sm:px-8 lg:px-16 w-full flex flex-col items-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Tab strip */}
            <div className="flex items-center gap-1 mb-3 flex-wrap justify-center">
              {tabs.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold transition-all duration-200 whitespace-nowrap rounded-sm"
                  style={
                    activeTab === id
                      ? {
                          color: id === "ai" ? BRAND_COLORS.yellow : "#fff",
                          borderBottom: `2px solid ${id === "ai" ? BRAND_COLORS.yellow : "#fff"}`,
                          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                        }
                      : {
                          color: "rgba(255,255,255,0.80)",
                          borderBottom: "2px solid transparent",
                          textShadow: "0 1px 4px rgba(0,0,0,0.5)",
                        }
                  }
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {/* Widget — switch between search & AI */}
            <AnimatePresence mode="wait">
              {isAiTab ? (
                <motion.div
                  key="ai"
                  className="w-full flex justify-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <AiHeroWidget isAr={isAr} />
                </motion.div>
              ) : (
                <motion.div
                  key="search"
                  className="w-full max-w-2xl"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  <div
                    className="flex items-center gap-3 rounded-full px-5 py-3"
                    style={{
                      background: "rgba(255,255,255,0.10)",
                      backdropFilter: "blur(2px)",
                      WebkitBackdropFilter: "blur(2px)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      boxShadow: "none",
                    }}
                  >
                    <Search size={20} className="shrink-0" style={{ color: "rgba(255,255,255,0.75)" }} aria-hidden="true" />
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={isAr ? "إلى أين تريد السفر؟" : "Where to next?"}
                      className="flex-1 bg-transparent outline-none border-none text-base font-medium text-white placeholder:text-white/60 min-w-0 caret-white"
                      aria-label={isAr ? "ابحث عن وجهتك" : "Search destination"}
                    />
                    <button
                      type="button"
                      className="shrink-0 inline-flex items-center font-bold text-base text-white rounded-full px-6 py-2.5 transition-all hover:scale-[1.04] active:scale-95"
                      style={{ background: BRAND_COLORS.green, boxShadow: `0 3px 14px ${BRAND_COLORS.green}80` }}
                    >
                      {isAr ? "بحث" : "Search"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      </div>

      {/* Trust bar */}
      <div
        className="flex items-center justify-center gap-3 py-2.5"
        style={{ background: BRAND_COLORS.green }}
      >
        <Plane size={13} color="rgba(255,255,255,0.5)" className="shrink-0" />
        <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
          {isAr
            ? "↓ بدون رسوم عضوية، بدون رسوم خفية. ↓"
            : "↓ No membership fees, no hidden charges. ↓"}
        </p>
        <Plane size={13} color="rgba(255,255,255,0.5)" className="shrink-0 scale-x-[-1]" />
      </div>

    </section>
  );
}
