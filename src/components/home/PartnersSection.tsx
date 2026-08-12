"use client";

import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";
import { useRef } from "react";

// Airline names + IATA codes for logos
const AIRLINES = [
  { name: "EgyptAir",       code: "MS", color: "#1a3a6b" },
  { name: "Air Arabia",     code: "G9", color: "#e31837" },
  { name: "Nile Air",       code: "NP", color: "#009e4e" },
  { name: "flydubai",       code: "FZ", color: "#e31837" },
  { name: "Turkish Airlines", code: "TK", color: "#c9102f" },
  { name: "Lufthansa",      code: "LH", color: "#05164d" },
  { name: "Emirates",       code: "EK", color: "#c69214" },
  { name: "Qatar Airways",  code: "QR", color: "#5c0632" },
];

function AirlineBadge({ airline }: { airline: typeof AIRLINES[0] }) {
  return (
    <div className="flex-none flex items-center gap-3 bg-[#fffdf9] border border-border-light rounded-2xl px-5 py-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-default">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-black shrink-0"
        style={{ background: airline.color }}
      >
        {airline.code}
      </div>
      <span className="text-sm font-semibold text-text-primary whitespace-nowrap">{airline.name}</span>
    </div>
  );
}

export function PartnersSection() {
  const { locale } = useI18n();
  const isAr = locale === "ar";
  const trackRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-16 bg-bg-alt overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 mb-10">
        <motion.div className="text-center"
          initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">
            {isAr ? "شركاؤنا في التميز" : "Our Airline Partners"}
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-text-luxury">
            {isAr ? "نطير مع أفضل شركات الطيران" : "We Fly with the Best Airlines"}
          </h2>
        </motion.div>
      </div>

      {/* Infinite scroll strip */}
      <div className="relative">
        {/* Fade edges */}
        <div className="absolute inset-y-0 start-0 w-24 bg-gradient-to-r from-bg-alt to-transparent z-10 pointer-events-none" aria-hidden="true"/>
        <div className="absolute inset-y-0 end-0 w-24 bg-gradient-to-l from-bg-alt to-transparent z-10 pointer-events-none" aria-hidden="true"/>

        <motion.div
          ref={trackRef}
          className="flex gap-4"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{ width: "max-content" }}
        >
          {/* Doubled for seamless loop */}
          {[...AIRLINES, ...AIRLINES].map((a, i) => (
            <AirlineBadge key={i} airline={a} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}
