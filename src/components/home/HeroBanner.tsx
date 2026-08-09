"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

// Overlay gradients per slide — dark enough to keep text readable
const OVERLAYS = [
  "from-[#1A3A2A]/70 via-[#3D6833]/40 to-transparent",
  "from-[#1A3A2A]/80 via-[#2473BC]/30 to-transparent",
  "from-[#3D6833]/70 via-[#1A3A2A]/50 to-transparent",
  "from-[#1A3A2A]/75 via-[#FDD12A]/20 to-transparent",
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
      {/* Hero background image */}
      <Image
        src="/images/hero/hero-1.jpg"
        alt="Spanker hero"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Dark overlay gradient — changes per slide */}
      <div
        className={cn(
          "absolute inset-0 bg-linear-to-br transition-opacity duration-700",
          OVERLAYS[current]
        )}
        aria-hidden="true"
      />

      {/* Extra dark base layer for text contrast */}
      <div className="absolute inset-0 bg-black/40" aria-hidden="true" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4 pt-20 pb-16 text-center">
        <div
          className={cn(
            "transition-all duration-300 mb-8 md:mb-10",
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
        >
          <p className="text-white/80 text-sm font-medium uppercase tracking-widest mb-3 md:mb-4">
            {isRTL ? "سبانكر" : "Spanker"}
          </p>
          <h1 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto mb-3 md:mb-4 drop-shadow-lg">
            {slide.headline}
          </h1>
          <p className="text-white/90 text-base md:text-xl max-w-2xl mx-auto drop-shadow">
            {slide.sub}
          </p>
        </div>

        {/* Slide Indicators */}
        <div className="flex gap-2 mt-6 md:mt-8" role="tablist" aria-label={isRTL ? "شرائح العرض" : "Hero slides"}>
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
                  ? "bg-brand-yellow w-6 h-2.5"
                  : "bg-white/40 hover:bg-white/70 w-2.5 h-2.5"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
