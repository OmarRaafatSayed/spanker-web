"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useMotionValue, useSpring } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";

function AnimatedNumber({ target, suffix = "" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionVal.set(target);
  }, [inView, target, motionVal]);

  useEffect(() => {
    return spring.on("change", (v) => setDisplay(Math.round(v)));
  }, [spring]);

  return <span ref={ref}>{display.toLocaleString()}{suffix}</span>;
}

export function StatsSection() {
  const { locale } = useI18n();
  const isAr = locale === "ar";

  const stats = [
    { value: 15000, suffix: "+", labelAr: "عميل سعيد", labelEn: "Happy Clients",
      icon: <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><circle cx="16" cy="11" r="5" stroke="currentColor" strokeWidth="2"/><path d="M6 27c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { value: 500, suffix: "+", labelAr: "وجهة سياحية", labelEn: "Destinations",
      icon: <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><circle cx="16" cy="14" r="6" stroke="currentColor" strokeWidth="2"/><path d="M16 20v8M12 28h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="16" cy="14" r="2" fill="currentColor"/></svg> },
    { value: 8, suffix: " سنين", labelAr: "خبرة في السياحة", labelEn: "Years Experience",
      suffixEn: " yrs",
      icon: <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><rect x="4" y="6" width="24" height="22" rx="3" stroke="currentColor" strokeWidth="2"/><path d="M4 14h24M10 4v4M22 4v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg> },
    { value: 99, suffix: "%", labelAr: "رضا العملاء", labelEn: "Client Satisfaction",
      icon: <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7"><circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2"/><path d="M10 16l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* section-green-dark exact background */}
      <div className="absolute inset-0" style={{
        backgroundColor: "#2d5128",
        backgroundImage: "linear-gradient(45deg,#3D683330 25%,transparent 25%),linear-gradient(-45deg,#3D683330 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#3D683330 75%),linear-gradient(-45deg,transparent 75%,#3D683330 75%)",
        backgroundSize: "20px 20px",
        backgroundPosition: "0 0,0 10px,10px -10px,-10px 0px"
      }} />

      {/* Animated mesh orbs */}
      <motion.div className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl bg-brand-yellow"
        animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} aria-hidden="true" />
      <motion.div className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full opacity-15 blur-3xl bg-brand-green-light"
        animate={{ scale: [1.2, 1, 1.2], x: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }} aria-hidden="true" />

      {/* Flying plane */}
      <motion.div
        className="absolute top-8 text-white/10 pointer-events-none"
        initial={{ x: "-10vw" }}
        animate={{ x: "110vw" }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear", repeatDelay: 4 }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 64 64" className="w-16 h-16" fill="currentColor">
          <path d="M56 24l-8 2-14-18H28l6 18H20l-4-6h-6l2 12-2 12h6l4-6h14l-6 18h6l14-18 8 2c4 0 7-3 7-7s-3-7-7-7z"/>
        </svg>
      </motion.div>

      <div className="relative max-w-7xl mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div className="text-center mb-14"
          initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
          <span className="inline-block text-brand-yellow text-xs font-black uppercase tracking-widest mb-3">
            {isAr ? "أرقامنا تتكلم" : "Our Numbers Speak"}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-white">
            {isAr ? "ثقة آلاف المسافرين" : "Trusted by Thousands of Travelers"}
          </h2>
        </motion.div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center overflow-hidden group"
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ scale: 1.04, borderColor: "rgba(212,175,55,0.4)" }}
            >
              {/* Glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-brand-yellow/5 to-transparent" aria-hidden="true"/>

              <div className="flex justify-center mb-3 text-brand-yellow">{stat.icon}</div>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">
                <AnimatedNumber target={stat.value} suffix={isAr ? stat.suffix : (stat.suffixEn ?? stat.suffix)} />
              </div>
              <p className="text-white/60 text-sm font-medium">
                {isAr ? stat.labelAr : stat.labelEn}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
