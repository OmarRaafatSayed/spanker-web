"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/context";
import { BRAND_COLORS } from "@/lib/brand/colors";
import { Sparkles, ArrowRight, ArrowLeft, PlaneTakeoff, ArrowLeftRight, Coins } from "lucide-react";

interface Chip { ar: string; en: string; icon: string }

const CHIPS: Chip[] = [
  { ar: "رحلة مباشرة",       en: "Direct flight",  icon: "→"  },
  { ar: "ذهاب وعودة",        en: "Return trip",    icon: "⇄"  },
  { ar: "الأرخص",            en: "Cheapest",       icon: "💰" },
];

export function AiTripWidget() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const router = useRouter();

  const [query, setQuery] = useState("");

  const placeholder = isAr
    ? "ابحث عن رحلة من القاهرة للأقصر الأسبوع القادم..."
    : "Find flights from Cairo to Luxor next weekend...";

  function handleSearch() {
    const q = query.trim();
    if (!q) return;
    router.push(`/${locale}/book-flight?q=${encodeURIComponent(q)}`);
  }

  function handleBuildPlan() {
    router.push(`/${locale}/ai-trip-planner`);
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100">
        <Sparkles size={16} color={BRAND_COLORS.green} />
        <span className="text-sm font-bold" style={{ color: "#1a2e1a" }}>
          {isAr ? "صف رحلتك" : "Describe your trip"}
        </span>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 px-4 pt-3 pb-0">
        {CHIPS.map((chip) => (
          <button
            key={chip.en}
            onClick={() => setQuery(isAr ? chip.ar : chip.en)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-gray-200 bg-white text-gray-600 hover:border-brand-green/50 hover:bg-green-50/40 transition-all duration-150"
          >
            <span>{chip.icon}</span>
            <span>{isAr ? chip.ar : chip.en}</span>
          </button>
        ))}
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2 px-4 py-3">
        <div className="flex items-center gap-2 flex-1 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5 focus-within:border-brand-green/50 focus-within:bg-white transition-all">
          <Sparkles size={14} className="shrink-0 opacity-40" color={BRAND_COLORS.green} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-sm text-gray-700 placeholder:text-gray-400"
          />
        </div>
        <button
          onClick={handleSearch}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-95 shrink-0"
          style={{ background: BRAND_COLORS.green }}
        >
          <Sparkles size={14} />
          {isAr ? "بحث" : "Search"}
        </button>
      </div>

      {/* Try text */}
      <p className="px-4 pb-1 text-xs text-gray-400">
        {isAr ? "جرّب وصف رحلتك بلغة طبيعية" : "Try describing your trip in natural language"}
      </p>

      {/* Divider */}
      <div className="mx-4 my-3 border-t border-gray-100" />

      {/* Full plan CTA */}
      <div className="px-4 pb-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1">
          <p className="text-xs font-bold" style={{ color: "#1a2e1a" }}>
            {isAr ? "هل تريد خطة سفر كاملة؟" : "Want a full personalised trip plan?"}
          </p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {isAr
              ? "أجب على ٦ أسئلة بسيطة ونبني لك رحلتك الكاملة"
              : "Answer 6 quick questions and we'll build your full itinerary"}
          </p>
        </div>
        <button
          onClick={handleBuildPlan}
          className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md shrink-0"
          style={{
            borderColor: BRAND_COLORS.green,
            color: BRAND_COLORS.green,
            background: `${BRAND_COLORS.green}08`,
          }}
        >
          <PlaneTakeoff size={15} strokeWidth={1.75} />
          {isAr ? "ابنِ خطة رحلتي ←" : "Build my trip plan"}
          {isRTL
            ? <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            : <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          }
        </button>
      </div>
    </div>
  );
}
