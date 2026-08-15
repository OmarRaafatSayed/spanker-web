"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useI18n } from "@/lib/i18n/context";

const ICONS = {
  visa: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden="true">
      <rect x="3" y="7" width="20" height="14" rx="2.5" stroke="currentColor" strokeWidth="2"/>
      <path d="M7 12h6M7 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="24" cy="22" r="6" fill="currentColor" fillOpacity=".12" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M21.5 22l2 2 3.5-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  seat: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden="true">
      <path d="M8 6v12a2 2 0 0 0 2 2h12M10 26h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <rect x="10" y="18" width="12" height="6" rx="2" stroke="currentColor" strokeWidth="2"/>
    </svg>
  ),
  status: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 9v7l4 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 32 32" fill="none" className="w-7 h-7" aria-hidden="true">
      <rect x="5" y="11" width="22" height="16" rx="3" stroke="currentColor" strokeWidth="2"/>
      <path d="M10 11V9a6 6 0 0 1 12 0v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      <path d="M16 17v4M14 19h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
};

export function FlyingServiceSection() {
  const { t } = useI18n();
  const s = t.services;

  const SERVICES = [
    { icon: ICONS.visa,   title: s.eVisa,           href: "/visa-application",     color: "from-[#1b4332] to-[#2d6a4f]" },
    { icon: ICONS.seat,   title: s.seatReservation, href: "/en-eg/seat-selection", color: "from-[#2d6a4f] to-[#52b788]" },
    { icon: ICONS.status, title: s.flightStatus,    href: "/en-eg/flight-status",  color: "from-[#d4af37] to-[#b8941f]" },
    { icon: ICONS.bag,    title: s.addBag,          href: "/en-eg/excess-baggage", color: "from-[#1b4332] to-[#081c15]" },
  ];

  return (
    <section className="section-dark border-b border-white/10 py-6 md:py-8" aria-label={s.title}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40, scale: 0.92 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.08, type: "spring", stiffness: 180, damping: 18 }}
            >
              <Link href={service.href} className="group flex flex-col items-center gap-2 sm:gap-3 py-4 sm:py-6 px-2 sm:px-4 rounded-2xl border border-white/10 bg-white/5 hover:border-brand-yellow/40 hover:bg-white/10 hover:shadow-lg transition-all duration-300 text-center">
                <motion.div
                  className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-md`}
                  whileHover={{ scale: 1.12, rotate: -4 }}
                  transition={{ type: "spring", stiffness: 400, damping: 15 }}
                >
                  {service.icon}
                </motion.div>
                <span className="text-[10px] sm:text-sm font-semibold text-white/80 group-hover:text-brand-yellow transition-colors leading-tight">
                  {service.title}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
