"use client";

import { motion } from "framer-motion";
import { MapPin, Calendar, Hotel, Utensils, Camera, Sparkles, ArrowRight } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { BRAND_COLORS } from "@/lib/brand/colors";

const CARDS_EN = [
  { icon: MapPin,     title: "Full destination map",    desc: "Know exactly where to go, what to skip, and the best routes between sites — all before you land." },
  { icon: Calendar,   title: "Day-by-day schedule",     desc: "A complete hourly itinerary for every day of your trip, built around your pace and interests." },
  { icon: Hotel,      title: "Where to stay",           desc: "Hand-picked hotels and neighborhoods matched to your budget and what you want to be near." },
  { icon: Utensils,   title: "Eat like a local",        desc: "Restaurants, street food spots, and cafés curated for every meal of your journey." },
  { icon: Camera,     title: "Hidden gems included",    desc: "Beyond the pyramids — secret spots, local markets, and off-the-beaten-path experiences." },
  { icon: Sparkles,   title: "All planned by AI",       desc: "Our AI reads your preferences and builds a trip that feels personally designed — in seconds." },
];

const CARDS_AR = [
  { icon: MapPin,     title: "خريطة وجهتك الكاملة",      desc: "اعرف أين تذهب وأين تتجنب وأفضل المسارات بين المعالم — كل ده قبل ما تنزل أصلاً." },
  { icon: Calendar,   title: "جدول يومي ساعة بساعة",      desc: "برنامج كامل لكل يوم في رحلتك، مبني على إيقاعك واهتماماتك أنت." },
  { icon: Hotel,      title: "فين تنام",                  desc: "فنادق وأحياء مختارة بعناية تناسب ميزانيتك وقريبة من اللي يهمك." },
  { icon: Utensils,   title: "اكل زي الناس المحلية",      desc: "مطاعم وأكل شعبي ومقاهي مختارة لكل وجبة في رحلتك." },
  { icon: Camera,     title: "الأماكن المخفية",           desc: "ما وراء الأهرامات — أماكن سرية وأسواق محلية وتجارب بعيدة عن السياحة التقليدية." },
  { icon: Sparkles,   title: "كله مخطط بالذكاء الاصطناعي", desc: "الذكاء الاصطناعي يقرأ تفضيلاتك ويبني رحلة تحس إنها مصممة خصيصاً لك — في ثوانٍ." },
];

/* alternating yellow / green */
const CARD_STYLES = [
  { bg: BRAND_COLORS.yellow, iconBg: "rgba(13,31,13,0.10)", titleColor: BRAND_COLORS.green,  descColor: "rgba(13,31,13,0.60)" },
  { bg: BRAND_COLORS.green,  iconBg: "rgba(255,255,255,0.15)", titleColor: "#fff",            descColor: "rgba(255,255,255,0.65)" },
];

export function AiTripPlannerSection() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const cards = isAr ? CARDS_AR : CARDS_EN;

  return (
    <section
      dir={isAr ? "rtl" : "ltr"}
      className="py-20 lg:py-28 overflow-hidden"
      style={{ background: BRAND_COLORS.white }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          className="mb-14 max-w-2xl"
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-4"
            style={{ background: BRAND_COLORS.yellow, color: BRAND_COLORS.green }}
          >
            <Sparkles size={12} />
            {isAr ? "مخطط الرحلة الذكي" : "AI Trip Planner"}
          </div>

          <h2
            className="mb-3"
            style={{
              fontFamily: isAr ? "var(--font-cairo), sans-serif" : "var(--font-jakarta), sans-serif",
              fontWeight: 800,
              fontSize: "clamp(1.8rem, 4vw, 3rem)",
              lineHeight: 1.15,
              color: "#0d1f0d",
            }}
          >
            {isAr
              ? <><span style={{ color: BRAND_COLORS.green }}>خطط رحلتك</span> لمصر<br />قبل ما تنزل أصلاً</>
              : <>Plan your Egypt trip<br /><span style={{ color: BRAND_COLORS.green }}>before you even land</span></>}
          </h2>

          <p className="text-base leading-relaxed" style={{ color: "#4b5563" }}>
            {isAr
              ? "مساعدنا الذكي يبني لك رحلة مفصّلة ومخططة بالكامل — من أول يوم لآخر يوم — بناءً على اهتماماتك وميزانيتك."
              : "Our AI builds you a fully detailed, planned-to-the-hour trip — from day one to the last — based on your interests and budget."}
          </p>
        </motion.div>

        {/* ── Cards ── staggered slide-in from alternating sides ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
          {cards.map(({ icon: Icon, title, desc }, i) => {
            const style   = CARD_STYLES[i % 2];
            /* odd indices slide from right, even from left (flip for RTL) */
            const fromX   = isAr
              ? (i % 2 === 0 ? 80 : -80)
              : (i % 2 === 0 ? -80 : 80);

            return (
              <motion.div
                key={title}
                initial={{ opacity: 0, x: fromX, rotate: i % 2 === 0 ? -3 : 3 }}
                whileInView={{ opacity: 1, x: 0, rotate: i % 2 === 0 ? -2 : 2 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.65,
                  delay: i * 0.09,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-2xl p-6 flex flex-col gap-4"
                style={{
                  background: style.bg,
                  boxShadow: i % 2 === 0
                    ? "0 6px 24px rgba(253,209,42,0.30)"
                    : "0 6px 24px rgba(61,104,51,0.30)",
                }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: style.iconBg }}
                >
                  <Icon size={20} style={{ color: i % 2 === 0 ? BRAND_COLORS.green : BRAND_COLORS.yellow }} />
                </div>

                <div>
                  <h3 className="font-bold text-base mb-1.5" style={{ color: style.titleColor }}>
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: style.descColor }}>
                    {desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{
              background: BRAND_COLORS.green,
              color: "#fff",
              boxShadow: `0 4px 18px ${BRAND_COLORS.green}55`,
            }}
          >
            <Sparkles size={16} />
            {isAr ? "ابدأ تخطيط رحلتك" : "Start planning your trip"}
            <ArrowRight size={15} className={isAr ? "rotate-180" : ""} />
          </button>
        </motion.div>

      </div>
    </section>
  );
}
