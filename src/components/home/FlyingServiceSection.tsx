"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { ShieldCheck, Armchair, Clock3, Briefcase, ArrowRight, ArrowLeft } from "lucide-react";
import { BRAND_COLORS } from "@/lib/brand/colors";

interface ServiceDef {
  Icon: React.FC<{ size?: number; strokeWidth?: number; color?: string }>;
  titleKey: "eVisa" | "seatReservation" | "flightStatus" | "addBag";
  descAr: string;
  descEn: string;
  href: string;
  rotate: number;
  offsetY: number;
  bg: string;
  /* CSS clip-path polygon for the torn top edge */
  clip: string;
}

const SERVICES: ServiceDef[] = [
  {
    Icon: ShieldCheck,
    titleKey: "eVisa",
    descAr: "اعتماد خلال ٤٨ ساعة",
    descEn: "Approved within 48 hrs",
    href: "/visa-application",
    rotate: -2.2,
    offsetY: 10,
    bg: "#3D6833",
    clip: "polygon(0% 7%, 8% 3%, 16% 8%, 24% 2%, 32% 7%, 40% 1%, 48% 6%, 56% 2%, 64% 7%, 72% 3%, 80% 7%, 88% 2%, 96% 6%, 100% 4%, 100% 100%, 0% 100%)",
  },
  {
    Icon: Armchair,
    titleKey: "seatReservation",
    descAr: "اختر مقعدك المفضل",
    descEn: "Pick your preferred seat",
    href: "/seat-selection",
    rotate: 1.6,
    offsetY: 0,
    bg: "#2d5128",
    clip: "polygon(0% 5%, 6% 9%, 14% 4%, 22% 8%, 30% 3%, 38% 8%, 46% 4%, 54% 9%, 62% 3%, 70% 8%, 78% 4%, 86% 9%, 94% 4%, 100% 7%, 100% 100%, 0% 100%)",
  },
  {
    Icon: Clock3,
    titleKey: "flightStatus",
    descAr: "تحديثات حية للرحلات",
    descEn: "Live flight updates",
    href: "/flight-status",
    rotate: -1.4,
    offsetY: 18,
    bg: "#4a7a3d",
    clip: "polygon(0% 9%, 10% 4%, 18% 8%, 26% 3%, 34% 9%, 42% 4%, 50% 8%, 58% 3%, 66% 9%, 74% 4%, 82% 8%, 90% 3%, 97% 7%, 100% 5%, 100% 100%, 0% 100%)",
  },
  {
    Icon: Briefcase,
    titleKey: "addBag",
    descAr: "أضف وزن إضافي بسهولة",
    descEn: "Add extra weight easily",
    href: "/baggage",
    rotate: 2.5,
    offsetY: 6,
    bg: "#345c2b",
    clip: "polygon(0% 6%, 7% 2%, 15% 7%, 23% 3%, 31% 8%, 39% 3%, 47% 7%, 55% 2%, 63% 7%, 71% 3%, 79% 8%, 87% 3%, 95% 7%, 100% 4%, 100% 100%, 0% 100%)",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11 } },
};

const cardAnim = {
  hidden: { opacity: 0, y: 36, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function FlyingServiceSection() {
  const { t, isRTL } = useI18n();
  const isAr = isRTL;

  return (
    <section
      className="relative w-full py-16 md:py-24 overflow-hidden"
      style={{
        background: "#f4f7f4",
        backgroundImage: "radial-gradient(circle, rgba(61,104,51,0.12) 1.5px, transparent 1.5px)",
        backgroundSize: "22px 22px",
      }}
      aria-label={isAr ? "خدماتنا" : "Our Services"}
    >
      {/* subtle dot grid bg */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${BRAND_COLORS.green}18 1.5px, transparent 1.5px)`,
          backgroundSize: "30px 30px",
        }}
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">

        {/* Header */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <span
            className="text-[11px] font-black uppercase tracking-[0.3em] block mb-3"
            style={{ color: BRAND_COLORS.green }}
          >
            {isAr ? "خدماتنا" : "What We Offer"}
          </span>
          <h2
            className="text-3xl sm:text-4xl font-black text-gray-900"
            style={
              isAr
                ? { fontFamily: "var(--font-cairo), sans-serif" }
                : { fontFamily: "var(--font-playfair), Georgia, serif", fontStyle: "italic", fontWeight: 700 }
            }
          >
            {isAr ? "كل ما تحتاجه في رحلتك" : "Everything For Your Journey"}
          </h2>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-7 items-start"
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {SERVICES.map((svc) => {
            const { Icon, titleKey, descAr, descEn, href, rotate, offsetY, bg, clip } = svc;

            return (
              <motion.div
                key={titleKey}
                variants={cardAnim}
                className="relative"
                style={{ marginTop: `${offsetY}px` }}
              >
                {/* Paper shadow — same clip, dark, offset */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    clipPath: clip,
                    background: "rgba(0,0,0,0.22)",
                    transform: `rotate(${rotate + 1.2}deg) translate(5px, 10px)`,
                    filter: "blur(8px)",
                    borderRadius: "0 0 16px 16px",
                  }}
                  aria-hidden="true"
                />

                {/* Paper card */}
                <Link
                  href={href}
                  className="group relative flex flex-col justify-between overflow-hidden"
                  style={{
                    clipPath: clip,
                    background: bg,
                    transform: `rotate(${rotate}deg)`,
                    borderRadius: "0 0 20px 20px",
                    minHeight: "260px",
                    padding: "3.5rem 1.5rem 1.75rem",
                    transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), box-shadow 0.35s ease",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = `rotate(${rotate * 0.4}deg) translateY(-6px)`;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.transform = `rotate(${rotate}deg)`;
                  }}
                >
                  {/* Shine layer */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-500"
                    style={{
                      background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 60%)",
                    }}
                    aria-hidden="true"
                  />

                  {/* Icon */}
                  <div>
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110"
                      style={{ background: "rgba(255,255,255,0.18)" }}
                    >
                      <Icon size={24} strokeWidth={1.75} color="#fff" />
                    </div>

                    <p className="text-white font-black text-lg leading-tight mb-2 drop-shadow-sm">
                      {t.services[titleKey]}
                    </p>
                    <p className="text-white/75 text-sm leading-relaxed">
                      {isAr ? descAr : descEn}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="flex justify-end mt-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                      style={{
                        background: "rgba(255,255,255,0.18)",
                        border: "1px solid rgba(255,255,255,0.35)",
                      }}
                    >
                      {isRTL
                        ? <ArrowLeft size={14} color="#fff" />
                        : <ArrowRight size={14} color="#fff" />}
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
