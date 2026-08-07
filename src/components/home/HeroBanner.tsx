"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { FlightSearchWidget } from "./FlightSearchWidget";

const GRADIENTS = [
  "from-[#1A3A2A] via-[#3D6833]/80 to-[#FDD12A]/30",
  "from-[#2473BC]/60 via-[#1A3A2A]/80 to-[#3D6833]/40",
  "from-[#3D6833] via-[#1A3A2A]/70 to-[#2473BC]/50",
  "from-[#FDD12A]/40 via-[#3D6833]/80 to-[#1A3A2A]",
];

export function HeroBanner() {
  const { t, isRTL } = useI18n();
  const slides = t.hero.slides;

  const [current, setCurrent] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  function goToSlide(index: number) {
    if (index === current) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setIsAnimating(false);
    }, 200);
  }

  const slide = slides[current];

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden">
      {/* Gradient background */}
      <div
        className={cn(
          "absolute inset-0 transition-opacity duration-500 bg-linear-to-br",
          GRADIENTS[current]
        )}
        aria-hidden="true"
      />

      {/* Decorative plane */}
      <div
        className="absolute inset-0 opacity-5"
        aria-hidden="true"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Cpath fill='white' d='M100 20 L180 100 L140 100 L100 60 L60 100 L20 100 Z'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "70% 30%",
          backgroundSize: "600px",
        }}
      />

      {/* Stars decorative */}
      <div className="absolute inset-0" aria-hidden="true">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/20"
            style={{
              width: Math.random() * 3 + 1 + "px",
              height: Math.random() * 3 + 1 + "px",
              left: Math.random() * 100 + "%",
              top: Math.random() * 60 + "%",
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
        <div
          className={cn(
            "transition-all duration-300 mb-10",
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          <p className="text-white/70 text-sm font-medium uppercase tracking-widest mb-4">
            {isRTL ? "سبانكر" : "Spanker"}
          </p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto mb-4">
            {slide.headline}
          </h1>
          <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto">
            {slide.sub}
          </p>
        </div>

        {/* Flight Search Widget */}
        <div className="w-full max-w-5xl px-0 md:px-4">
          <FlightSearchWidget />
        </div>

        {/* Slide Indicators */}
        <div className="flex gap-2 mt-8" role="tablist" aria-label={isRTL ? "شرائح العرض" : "Hero slides"}>
          {slides.map((_, i) => (
            <button
              key={i}
              role="tab"
              aria-selected={i === current}
              aria-label={`${isRTL ? "شريحة" : "Slide"} ${i + 1}`}
              onClick={() => goToSlide(i)}
              className={cn(
                "rounded-full transition-all duration-300",
                i === current
                  ? "bg-brand-red w-6 h-2.5"
                  : "bg-white/40 hover:bg-white/60 w-2.5 h-2.5"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
