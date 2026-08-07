"use client";

import Link from "next/link";
import { PlaneIcon, SearchIcon } from "@/components/icons";
import { useI18n } from "@/lib/i18n/context";

function BaggageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="12" x2="12" y1="12" y2="16" />
      <line x1="10" x2="14" y1="14" y2="14" />
    </svg>
  );
}

function SeatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 17V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4" />
      <path d="M4 17h12" />
      <path d="M4 17v4" />
    </svg>
  );
}

export function FlyingServiceSection() {
  const { t } = useI18n();
  const s = t.services;

  const SERVICES = [
    { icon: <PlaneIcon size={32} />, title: s.eVisa, href: "/en-eg/visa-and-health" },
    { icon: <SeatIcon />, title: s.seatReservation, href: "/en-eg/seat-selection" },
    { icon: <SearchIcon size={32} />, title: s.flightStatus, href: "/en-eg/flight-status" },
    { icon: <BaggageIcon />, title: s.addBag, href: "/en-eg/excess-baggage" },
  ];

  return (
    <section className="bg-white border-b border-border-light" aria-label={s.title}>
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SERVICES.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="flex flex-col items-center gap-3 py-5 px-4 rounded-xl border border-[#F0F0F0] hover:border-brand-red hover:shadow-md transition-all duration-200 group"
            >
              <span className="text-brand-red group-hover:scale-110 transition-transform duration-200">
                {service.icon}
              </span>
              <span className="text-sm font-semibold text-text-primary text-center group-hover:text-brand-red transition-colors">
                {service.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
