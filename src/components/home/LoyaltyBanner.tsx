"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Gift, X, Star, Zap, ArrowRight, ArrowLeft } from "lucide-react";
import { BRAND_COLORS } from "@/lib/brand/colors";

const PERKS_AR = [
  { icon: Gift,  label: "١٠٠ نقطة فور التسجيل" },
  { icon: Star,  label: "نقاط مع كل حجز"        },
  { icon: Zap,   label: "خصومات حصرية للأعضاء"  },
];
const PERKS_EN = [
  { icon: Gift,  label: "100 points on signup"    },
  { icon: Star,  label: "Points with every booking" },
  { icon: Zap,   label: "Exclusive member discounts" },
];

export function LoyaltyBanner() {
  const { locale, isRTL } = useI18n();
  const isAr = locale === "ar";
  const [dismissed, setDismissed] = useState(false);

  const perks = isAr ? PERKS_AR : PERKS_EN;

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.section
          className="relative overflow-hidden"
          initial={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          aria-label={isAr ? "برنامج نقاط المكافآت" : "Rewards Points Program"}
        >
          {/* Rich gradient background */}
          <div
            className="relative py-5 md:py-6"
            style={{
              background: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, #2d5128 60%, #1b4332 100%)`,
            }}
          >
            {/* Dot grid texture */}
            <div
              className="absolute inset-0 opacity-[0.08] pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(${BRAND_COLORS.yellow} 1px, transparent 1px)`,
                backgroundSize: "24px 24px",
              }}
              aria-hidden="true"
            />

            {/* Glow orb */}
            <div
              className="absolute top-1/2 start-1/3 -translate-y-1/2 w-64 h-32 rounded-full blur-3xl opacity-20 pointer-events-none"
              style={{ background: BRAND_COLORS.yellow }}
              aria-hidden="true"
            />

            <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">

                {/* Icon + headline */}
                <div className="flex items-center gap-3 shrink-0">
                  <motion.div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-lg"
                    style={{ background: `${BRAND_COLORS.yellow}25`, border: `1px solid ${BRAND_COLORS.yellow}50` }}
                    animate={{ rotate: [0, -6, 6, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 3 }}
                  >
                    <Gift size={22} color={BRAND_COLORS.yellow} strokeWidth={1.75} />
                  </motion.div>
                  <div>
                    <p className="font-black text-white text-sm md:text-base leading-snug">
                      {isAr ? "سجّل وابدأ تجميع النقاط!" : "Sign up & start earning points!"}
                    </p>
                    <p className="text-white/60 text-xs mt-0.5">
                      {isAr
                        ? "كل نقطة تقربك من حجزك المجاني القادم"
                        : "Every point brings you closer to your next free booking"}
                    </p>
                  </div>
                </div>

                {/* Perk pills */}
                <div className="flex flex-wrap gap-2 flex-1">
                  {perks.map(({ icon: Icon, label }) => (
                    <div
                      key={label}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white/80"
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <Icon size={12} color={BRAND_COLORS.yellow} strokeWidth={2} />
                      {label}
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href="/signup"
                  className="group relative shrink-0 inline-flex items-center gap-2 font-bold text-sm px-6 py-2.5 rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-xl hover:shadow-brand-yellow/30"
                  style={{ background: BRAND_COLORS.yellow, color: "#1b4332" }}
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-600 bg-gradient-to-r from-transparent via-white/30 to-transparent" aria-hidden="true" />
                  <span className="relative">{isAr ? "سجّل مجاناً" : "Sign up free"}</span>
                  <span className="relative opacity-70">
                    {isRTL ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                  </span>
                </Link>

                {/* Dismiss */}
                <button
                  onClick={() => setDismissed(true)}
                  aria-label={isAr ? "إغلاق" : "Dismiss"}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all duration-200 md:ms-2"
                >
                  <X size={15} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
