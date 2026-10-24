"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { BRAND_COLORS } from "@/lib/brand/colors";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 40, damping: 15 });
  const [display, setDisplay] = useState(0);

  useEffect(() => { if (inView) motionVal.set(target); }, [inView, target, motionVal]);
  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v))), [spring]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

interface StatItem {
  value: number;
  suffix: string;
  suffixEn?: string;
  labelAr: string;
  labelEn: string;
}

export function StatsSection() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const stats: StatItem[] = [
    { value: 15000, suffix: "+",      labelAr: "عميل سعيد",       labelEn: "Happy Clients"      },
    { value: 500,   suffix: "+",      labelAr: "وجهة سياحية",     labelEn: "Destinations"        },
    { value: 8,     suffix: " سنين", labelAr: "خبرة في السياحة", labelEn: "Years Experience", suffixEn: " yrs" },
    { value: 99,    suffix: "%",      labelAr: "رضا العملاء",     labelEn: "Client Satisfaction" },
  ];

  return (
    <section style={{ background: BRAND_COLORS.green }} className="py-16 md:py-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/20 rtl:divide-x-reverse">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.labelEn}
              className="flex flex-col items-center text-center px-6 py-8"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="text-5xl sm:text-6xl md:text-7xl font-black tabular-nums leading-none mb-3 text-white"
              >
                <AnimatedNumber
                  target={stat.value}
                  suffix={isAr ? stat.suffix : (stat.suffixEn ?? stat.suffix)}
                />
              </div>
              <p className="text-sm md:text-base font-medium text-white/70 max-w-[120px] leading-snug">
                {isAr ? stat.labelAr : stat.labelEn}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
