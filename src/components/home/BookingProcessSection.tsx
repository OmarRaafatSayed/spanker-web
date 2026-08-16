"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";

/* ─── Step data ─────────────────────────────────────────── */
const STEPS_AR = [
  {
    num: "01",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <circle cx="20" cy="14" r="7" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
    title: "سجّل حسابك",
    desc: "أنشئ حسابك مجاناً بدقيقة واحدة — اسمك، بريدك، وكلمة مرور.",
    color: "from-[#1b4332] to-[#2d6a4f]",
    accent: "#d4af37",
    tag: null,
  },
  {
    num: "02",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <path d="M8 20 L20 8 L32 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M20 8v24M13 32h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
    title: "ابحث عن رحلتك",
    desc: "حدد المطار، التاريخ، عدد المسافرين والدرجة — ثم اضغط بحث.",
    color: "from-[#2d6a4f] to-[#52b788]",
    accent: "#d4af37",
    tag: null,
  },
  {
    num: "03",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <rect x="6" y="8" width="28" height="26" rx="3" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M6 16h28M14 6v4M26 6v4M12 24h6M12 30h10" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
    title: "اختر وأكد الحجز",
    desc: "راجع تفاصيل الرحلة، اختر مقعدك، وأكد الحجز.",
    color: "from-[#1b4332] to-[#2d6a4f]",
    accent: "#f4d03f",
    tag: null,
  },
  {
    num: "04",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <rect x="7" y="5" width="18" height="24" rx="2.5" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M11 12h10M11 17h7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <circle cx="28" cy="28" r="8" fill="currentColor" fillOpacity=".15" stroke="currentColor" strokeWidth="2"/>
        <path d="M24.5 28l2.5 2.5 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "قدّم على التأشيرة",
    desc: "تأشيرة مصر الإلكترونية متاحة مباشرة من تطبيقنا — الموافقة خلال 48 ساعة.",
    color: "from-[#d4af37] to-[#b8941f]",
    accent: "#1b4332",
    tag: "e-Visa",
  },
  {
    num: "05",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <rect x="5" y="12" width="30" height="20" rx="3" stroke="currentColor" strokeWidth="2.2"/>
        <path d="M5 18h30M13 26h4M21 26h6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        <path d="M13 8h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
      </svg>
    ),
    title: "ادفع بأمان",
    desc: "بطاقة ائتمان، Fawry، أو تحويل بنكي — كل المدفوعات مشفّرة ومؤمّنة.",
    color: "from-[#2d6a4f] to-[#1b4332]",
    accent: "#f4d03f",
    tag: null,
  },
  {
    num: "06",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <path d="M20 6 L34 20 L20 34 L6 20 Z" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round"/>
        <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    title: "تأهب للإقلاع!",
    desc: "استلم تذكرتك على الإيميل، سجّل وصولك أونلاين، وتوجّه للمطار.",
    color: "from-[#1b4332] to-[#081c15]",
    accent: "#d4af37",
    tag: null,
  },
];

const STEPS_EN = [
  {
    num: "01",
    icon: STEPS_AR[0].icon,
    title: "Create Your Account",
    desc: "Sign up free in one minute — name, email, and password. That's it.",
    color: STEPS_AR[0].color,
    accent: STEPS_AR[0].accent,
    tag: null,
  },
  {
    num: "02",
    icon: STEPS_AR[1].icon,
    title: "Search Your Flight",
    desc: "Choose airport, date, passengers and class — then hit search.",
    color: STEPS_AR[1].color,
    accent: STEPS_AR[1].accent,
    tag: null,
  },
  {
    num: "03",
    icon: STEPS_AR[2].icon,
    title: "Select & Confirm",
    desc: "Review flight details, pick your seat, and confirm the booking.",
    color: STEPS_AR[2].color,
    accent: STEPS_AR[2].accent,
    tag: null,
  },
  {
    num: "04",
    icon: STEPS_AR[3].icon,
    title: "Apply for Your Visa",
    desc: "Egypt e-Visa available directly in our app — approval within 48 hours.",
    color: STEPS_AR[3].color,
    accent: STEPS_AR[3].accent,
    tag: "e-Visa",
  },
  {
    num: "05",
    icon: STEPS_AR[4].icon,
    title: "Pay Securely",
    desc: "Credit card, Fawry, or bank transfer — all payments are encrypted.",
    color: STEPS_AR[4].color,
    accent: STEPS_AR[4].accent,
    tag: null,
  },
  {
    num: "06",
    icon: STEPS_AR[5].icon,
    title: "Ready for Takeoff!",
    desc: "Receive your ticket by email, check in online, and head to the airport.",
    color: STEPS_AR[5].color,
    accent: STEPS_AR[5].accent,
    tag: null,
  },
];

/* ─── Connector SVG (desktop) ──────────────────────────── */
function Connector({ color }: { color: string }) {
  return (
    <div className="hidden lg:flex items-center justify-center w-10 shrink-0 mt-10">
      <svg width="40" height="20" viewBox="0 0 40 20" fill="none" aria-hidden="true">
        <path
          d="M0 10 Q20 0 40 10"
          stroke={color}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
        />
        <circle cx="40" cy="10" r="3" fill={color} />
      </svg>
    </div>
  );
}

/* ─── Single step card ──────────────────────────────────── */
function StepCard({
  step,
  index,
  isRTL,
}: {
  step: (typeof STEPS_AR)[0];
  index: number;
  isRTL: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      className="relative flex-none w-[280px] max-w-[85vw] lg:w-auto lg:max-w-none lg:flex-1"
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Card */}
      <div
        className={`relative rounded-2xl bg-gradient-to-br ${step.color} p-5 h-full flex flex-col gap-3 shadow-lg overflow-hidden`}
      >
        {/* Decorative circle bg */}
        <div
          className="absolute -top-6 -end-6 w-28 h-28 rounded-full opacity-10"
          style={{ background: step.accent }}
          aria-hidden="true"
        />

        {/* Step number */}
        <span
          className="absolute top-4 start-4 text-[11px] font-black tracking-widest opacity-40 text-white"
        >
          {step.num}
        </span>

        {/* e-Visa badge */}
        {step.tag && (
          <span
            className="absolute top-3 end-3 text-[10px] font-black px-2 py-0.5 rounded-full"
            style={{ background: step.accent, color: "#1b4332" }}
          >
            {step.tag}
          </span>
        )}

        {/* Icon */}
        <div className="mt-5" style={{ color: step.accent }}>
          {step.icon}
        </div>

        {/* Text */}
        <div>
          <h3 className="text-base font-bold text-white leading-snug mb-1">
            {step.title}
          </h3>
          <p className="text-xs text-white/70 leading-relaxed">
            {step.desc}
          </p>
        </div>
      </div>

      {/* Mobile step connector dot */}
      {index < 5 && (
        <div className="lg:hidden flex justify-center mt-1 mb-0.5">
          <div className="w-px h-4 border-s-2 border-dashed border-brand-green-light/40" />
        </div>
      )}
    </motion.div>
  );
}

/* ─── Section ───────────────────────────────────────────── */
export function BookingProcessSection() {
  const { isRTL, locale } = useI18n();
  const steps = locale === "ar" ? STEPS_AR : STEPS_EN;

  const titleAr = "رحلتك معنا — خطوة بخطوة";
  const subtitleAr = "من أول كليك للإقلاع — كل شيء في مكان واحد";
  const titleEn = "Your Journey — Step by Step";
  const subtitleEn = "From first click to takeoff — everything in one place";
  const ctaAr = "تأشيرة مصر الإلكترونية";
  const ctaEn = "Egypt e-Visa";

  return (
    <section className="section-green-dark relative py-16 md:py-24 overflow-hidden">

      <div className="relative max-w-7xl mx-auto px-2 lg:px-8">

        {/* ── Header ── */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
        >
          {/* Pill label */}
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-brand-yellow bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-yellow animate-pulse" />
            {locale === "ar" ? "كيف يعمل؟" : "How It Works"}
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            {locale === "ar" ? titleAr : titleEn}
          </h2>
          <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto">
            {locale === "ar" ? subtitleAr : subtitleEn}
          </p>
        </motion.div>

        {/* ── Steps ── */}
        {/* Mobile: vertical scroll strip / Desktop: horizontal row */}
        <div className="lg:hidden flex gap-3 overflow-x-auto scrollbar-hide pb-4 px-1"
          style={{ scrollSnapType: "x mandatory" }}>
          {steps.map((step, i) => (
            <div key={step.num} style={{ scrollSnapAlign: "start" }} className="flex flex-col">
              <StepCard step={step} index={i} isRTL={isRTL} />
            </div>
          ))}
        </div>

        {/* Desktop row with connectors */}
        <div className="hidden lg:flex items-start gap-0">
          {steps.map((step, i) => (
            <div key={step.num} className="flex items-start flex-1">
              <StepCard step={step} index={i} isRTL={isRTL} />
              {i < steps.length - 1 && (
                <Connector color={i === 3 ? "#d4af37" : "#2d6a4f"} />
              )}
            </div>
          ))}
        </div>

        {/* ── e-Visa CTA ── */}
        <motion.div
          className="mt-12 md:mt-16 flex justify-center"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Link
            href="/visa-application"
            className="group relative inline-flex items-center gap-3 rounded-2xl overflow-hidden px-7 py-4 shadow-lg"
            style={{
              background: "linear-gradient(135deg, #d4af37 0%, #b8941f 100%)",
            }}
          >
            {/* shimmer */}
            <span
              className="absolute inset-0 translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent"
              aria-hidden="true"
            />
            <span className="relative">
              <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#1b4332]" aria-hidden="true">
                <rect x="3" y="5" width="13" height="16" rx="2" stroke="currentColor" strokeWidth="2"/>
                <path d="M8 9h5M8 13h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="18" cy="17" r="4" fill="currentColor" fillOpacity=".2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M16.5 17l1 1 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className="relative font-bold text-[#1b4332] text-sm">
              {locale === "ar" ? `قدّم على ${ctaAr} الآن` : `Apply for ${ctaEn} Now`}
            </span>
            <span className="relative text-[#1b4332]/60">
              {isRTL
                ? <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                : <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4"><path d="M6 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              }
            </span>
          </Link>
        </motion.div>

      </div>
    </section>
  );
}
