"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { FlightSearchWidget } from "@/components/home/FlightSearchWidget";
import { BRAND_COLORS } from "@/lib/brand/colors";

const OVERLAYS = [
  "from-[#3D6833]/75 via-[#3D6833]/50 to-transparent",
  "from-[#3D6833]/80 via-[#2473BC]/40 to-transparent",
  "from-[#3D6833]/70 via-[#3D6833]/55 to-transparent",
  "from-[#3D6833]/75 via-[#FDD12A]/25 to-transparent",
];

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: "easeOut" as const,
    },
  },
};

const searchWidgetVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 1,
      ease: "easeOut" as const,
      delay: 0.8,
    },
  },
};

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
    }, 6000); // Increased interval for better UX
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
    <section className="relative w-full h-screen flex flex-col overflow-hidden">
      {/* Background image with improved overlay */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/images/hero/hero-1.jpg"
          alt="Spanker luxury travel"
          fill
          priority
          className="object-cover"
          style={{ objectPosition: 'center center' }}
          sizes="100vw"
          quality={85}
        />
      </div>

      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" aria-hidden="true" />
      
      {/* Brand color gradient overlay */}
      <div
        className="absolute inset-0 bg-gradient-to-br opacity-60"
        style={{
          background: `linear-gradient(135deg, ${BRAND_COLORS.green}99 0%, ${BRAND_COLORS.green}33 50%, transparent 100%)`
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center h-full w-full px-4 sm:px-6 lg:px-8 py-20 sm:py-24 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Headline */}
        <motion.div
          className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 mb-8 sm:mb-10"
          variants={itemVariants}
        >
          <motion.p
            className="text-white text-xs sm:text-sm font-bold uppercase tracking-[0.2em] drop-shadow-lg"
            variants={itemVariants}
          >
            {isRTL ? "سبانكر" : "Spanker"}
          </motion.p>
          
          <motion.h1
            className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight px-4 drop-shadow-2xl"
            variants={itemVariants}
          >
            {slide.headline}
          </motion.h1>
          
          <motion.p
            className="text-white/95 text-sm sm:text-base md:text-lg lg:text-xl max-w-3xl mx-auto leading-relaxed px-4 drop-shadow-lg"
            variants={itemVariants}
          >
            {slide.sub}
          </motion.p>
        </motion.div>

        {/* Flight search widget */}
        <motion.div
          className="w-full max-w-4xl mx-auto px-2 sm:px-0"
          variants={searchWidgetVariants}
        >
          <FlightSearchWidget />
        </motion.div>

        {/* Slide indicators with enhanced design */}
        <motion.div
          className="flex items-center justify-center gap-2 mt-8 sm:mt-10"
          variants={itemVariants}
        >
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                current === index
                  ? "w-8 opacity-100"
                  : "w-2 opacity-50 hover:opacity-75"
              )}
              style={{ 
                backgroundColor: current === index ? BRAND_COLORS.yellow : '#ffffff'
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
