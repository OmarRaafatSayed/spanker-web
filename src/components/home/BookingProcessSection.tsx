"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { useI18n } from "@/lib/i18n/context";
import Link from "next/link";
import { UserPlus, Search, CheckSquare, FileCheck, CreditCard, PlaneTakeoff } from "lucide-react";
import { BRAND_COLORS } from "@/lib/brand/colors";
import { cn } from "@/lib/utils";

interface StepDef {
  num: string;
  Icon: React.FC<{ size?: number; strokeWidth?: number; color?: string }>;
  titleAr: string; titleEn: string;
  descAr: string;  descEn: string;
  isGreen: boolean;
}

const STEPS: StepDef[] = [
  { num: "1", Icon: UserPlus,     titleAr: "سجّل حسابك",        titleEn: "Create Your Account",  descAr: "أنشئ حسابك مجاناً بدقيقة — اسمك، بريدك، وكلمة مرور.",         descEn: "Sign up free in one minute — name, email, and password.",           isGreen: false },
  { num: "2", Icon: Search,       titleAr: "ابحث عن رحلتك",     titleEn: "Search Your Flight",   descAr: "حدد المطار، التاريخ، عدد المسافرين والدرجة.",                   descEn: "Choose airport, date, passengers and class.",                        isGreen: false },
  { num: "3", Icon: CheckSquare,  titleAr: "اختر وأكد الحجز",   titleEn: "Select & Confirm",     descAr: "راجع تفاصيل الرحلة، اختر مقعدك، وأكد الحجز.",                  descEn: "Review flight details, pick your seat, and confirm.",                isGreen: false },
  { num: "4", Icon: FileCheck,    titleAr: "قدّم على التأشيرة", titleEn: "Apply for Visa",       descAr: "تأشيرة مصر الإلكترونية — الموافقة خلال ٤٨ ساعة.",              descEn: "Egypt e-Visa available in-app — approval within 48 hours.",          isGreen: true  },
  { num: "5", Icon: CreditCard,   titleAr: "ادفع بأمان",         titleEn: "Pay Securely",         descAr: "بطاقة ائتمان، Fawry، أو تحويل بنكي — مدفوعات مشفّرة.",        descEn: "Credit card, Fawry, or bank transfer — fully encrypted.",            isGreen: false },
  { num: "6", Icon: PlaneTakeoff, titleAr: "تأهب للإقلاع!",     titleEn: "Ready for Takeoff!",   descAr: "استلم تذكرتك على الإيميل، سجّل وصولك، وتوجّه للمطار.",         descEn: "Receive your ticket, check in online, and head to the airport.",     isGreen: false },
];

function StepCard({ step, index }: { step: StepDef; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const g = step.isGreen;

  return (
    <motion.div
      ref={ref}
      className="relative flex-1 min-w-[200px]"
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.09, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Desktop dashed connector */}
      {index < STEPS.length - 1 && (
        <div className="hidden lg:block absolute top-[22px] start-full z-0" style={{ width: "calc(100% - 44px)", left: "44px" }} aria-hidden="true">
          <svg width="100%" height="2" className="overflow-visible">
            <motion.line x1="0" y1="1" x2="100%" y2="1"
              stroke={g ? BRAND_COLORS.green : "#d1d5db"} strokeWidth="1.5" strokeDasharray="5 4"
              initial={{ pathLength: 0 }}
              animate={inView ? { pathLength: 1 } : {}}
              transition={{ duration: 0.8, delay: index * 0.09 + 0.3 }}
            />
          </svg>
        </div>
      )}

      <div
        className={cn("relative h-full rounded-2xl p-5 border overflow-hidden", g ? "" : "bg-white border-gray-100 shadow-sm")}
        style={g ? { background: `${BRAND_COLORS.green}`, borderColor: BRAND_COLORS.green } : {}}
      >
        {g && (
          <span className="absolute top-3 end-3 text-[10px] font-black px-2 py-0.5 rounded-full bg-white" style={{ color: BRAND_COLORS.green }}>
            e-Visa
          </span>
        )}

        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-2"
            style={{
              borderColor: g ? "rgba(255,255,255,0.5)" : BRAND_COLORS.green,
              background: g ? "rgba(255,255,255,0.15)" : `${BRAND_COLORS.green}10`,
            }}
          >
            <step.Icon size={20} strokeWidth={1.75} color={g ? "#fff" : BRAND_COLORS.green} aria-hidden="true" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest" style={{ color: g ? "rgba(255,255,255,0.6)" : "#9ca3af" }}>
            {isAr ? `خطوة ${step.num}` : `Step ${step.num}`}
          </span>
        </div>

        <h3 className={cn("text-sm font-bold leading-snug mb-1.5", g ? "text-white" : "")} style={g ? {} : { color: "#1a2e1a" }}>
          {isAr ? step.titleAr : step.titleEn}
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: g ? "rgba(255,255,255,0.7)" : "#6b7c6b" }}>
          {isAr ? step.descAr : step.descEn}
        </p>
      </div>
    </motion.div>
  );
}

export function BookingProcessSection() {
  const { isRTL, locale } = useI18n();
  const isAr = locale === "ar";

  return (
    <section className="relative py-20 md:py-28 overflow-hidden" style={{ background: "#f4f7f4" }}>
      {/* Subtle dot grid */}
      <div className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{ backgroundImage: `radial-gradient(${BRAND_COLORS.green}18 1px, transparent 1px)`, backgroundSize: "28px 28px" }}
        aria-hidden="true" />

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
        <motion.div className="text-center mb-16"
          initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] rounded-full px-4 py-1.5 mb-4 border"
            style={{ color: BRAND_COLORS.green, borderColor: `${BRAND_COLORS.green}30`, background: `${BRAND_COLORS.green}08` }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: BRAND_COLORS.green }} />
            {isAr ? "كيف يعمل؟" : "How It Works"}
          </span>
          <h2 className="text-3xl md:text-5xl font-black mb-3" style={{ color: "#1a2e1a" }}>
            {isAr ? "رحلتك — خطوة بخطوة" : "Your Journey — Step by Step"}
          </h2>
          <p className="text-base max-w-lg mx-auto" style={{ color: "#6b7c6b" }}>
            {isAr ? "من أول كليك للإقلاع — كل شيء في مكان واحد" : "From first click to takeoff — everything in one place"}
          </p>
        </motion.div>

        {/* Mobile scroll */}
        <div className="lg:hidden flex gap-3 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4" style={{ scrollSnapType: "x mandatory" }}>
          {STEPS.map((step, i) => (
            <div key={step.num} className="flex-none w-[75vw] max-w-[260px]" style={{ scrollSnapAlign: "start" }}>
              <StepCard step={step} index={i} />
            </div>
          ))}
        </div>

        {/* Desktop row */}
        <div className="hidden lg:flex items-stretch gap-2">
          {STEPS.map((step, i) => <StepCard key={step.num} step={step} index={i} />)}
        </div>

        {/* CTA */}
        <motion.div className="mt-14 flex justify-center"
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}>
          <Link href="/visa-application"
            className="group relative inline-flex items-center gap-3 rounded-2xl overflow-hidden px-8 py-4 font-bold text-sm text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5"
            style={{ background: BRAND_COLORS.green, boxShadow: `0 8px 28px ${BRAND_COLORS.green}40` }}>
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" aria-hidden="true" />
            <FileCheck size={18} strokeWidth={2} />
            <span className="relative">{isAr ? "قدّم على تأشيرة مصر الآن" : "Apply for Egypt e-Visa Now"}</span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
