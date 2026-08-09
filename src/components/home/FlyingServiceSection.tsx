"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

function PlaneIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:w-8 sm:h-8">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21 4 19 2c-2-2-4-2-5.5-.5L10 5 1.8 6.2c-.5.1-.9.6-.6 1.1l1.5 2.5c.2.4.7.6 1.1.5L8 9.5l-2 3.5L4 14c-.4.3-.4.8 0 1l2 2c.3.4.8.4 1 0l1.5-2 3.5-2-.5 4.2c-.1.5.2.9.7 1l2.5 1.5c.5.3 1 0 1.1-.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:w-8 sm:h-8">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function BaggageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:w-8 sm:h-8">
      <path d="M6 20a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2Z" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="12" x2="12" y1="12" y2="16" /><line x1="10" x2="14" y1="14" y2="14" />
    </svg>
  );
}

function SeatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="sm:w-8 sm:h-8">
      <path d="M4 17V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4" />
      <path d="M4 17h12" /><path d="M4 17v4" />
    </svg>
  );
}

export function FlyingServiceSection() {
  const { t } = useI18n();
  const s = t.services;

  const SERVICES = [
    { icon: <PlaneIcon />, title: s.eVisa, href: "/en-eg/visa-and-health" },
    { icon: <SeatIcon />, title: s.seatReservation, href: "/en-eg/seat-selection" },
    { icon: <SearchIcon />, title: s.flightStatus, href: "/en-eg/flight-status" },
    { icon: <BaggageIcon />, title: s.addBag, href: "/en-eg/excess-baggage" },
  ];

  return (
    <section className="bg-white border-b border-border-light" aria-label={s.title}>
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6">
        <div className="grid grid-cols-4 gap-2 sm:gap-4">
          {SERVICES.map((service) => (
            <Link
              key={service.title}
              href={service.href}
              className="flex flex-col items-center gap-1.5 sm:gap-3 py-3 sm:py-5 px-1 sm:px-4 rounded-xl border border-[#F0F0F0] hover:border-brand-red hover:shadow-md transition-all duration-200 group text-center"
            >
              <span className="text-brand-red group-hover:scale-110 transition-transform duration-200">
                {service.icon}
              </span>
              <span className="text-[10px] sm:text-sm font-semibold text-text-primary group-hover:text-brand-red transition-colors leading-tight">
                {service.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
