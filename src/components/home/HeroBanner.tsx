"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { FlightSearchWidget } from "@/components/home/FlightSearchWidget";

const OVERLAYS = [
  "from-[#1b4332]/75 via-[#2d6a4f]/50 to-transparent",
  "from-[#1b4332]/80 via-[#334155]/40 to-transparent",
  "from-[#2d6a4f]/70 via-[#1b4332]/55 to-transparent",
  "from-[#1b4332]/75 via-[#d4af37]/25 to-transparent",
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
      ease: [0.4, 0, 0.2, 1],
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
      ease: [0.4, 0, 0.2, 1],
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
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* Background image with improved overlay */}
      <Image
        src="/images/hero/hero-1.jpg"
        alt="Spanker luxury travel"
        fill
        priority
        className="object-cover object-center"
        sizes="100vw"
      />

      {/* Enhanced gradient overlays */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br transition-all duration-700",
          OVERLAYS[current]
        )}
        aria-hidden="true"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" aria-hidden="true" />
      
      {/* Mesh gradient for depth */}
      <div className="absolute inset-0 mesh-bg opacity-10" aria-hidden="true" />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center flex-1 px-4 pt-24 pb-8 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Headline */}
        <motion.div
          className={cn(
            "transition-all duration-500 mb-8 md:mb-10",
            isAnimating ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
          )}
          variants={itemVariants}
        >
          <motion.p
            className="text-white/90 text-sm font-medium uppercase tracking-widest mb-3 md:mb-4"
            variants={itemVariants}
          >
            {isRTL ? "سبانكر" : "Spanker"}
          </motion.p>
          
          <motion.h1
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight max-w-4xl mx-auto mb-4 md:mb-6 drop-shadow-2xl"
            variants={itemVariants}
          >
            {slide.headline}
          </motion.h1>
          
          <motion.p
            className="text-white/85 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light"
            variants={itemVariants}
          >
            {slide.sub}
          </motion.p>
        </motion.div>

        {/* Flight search widget */}
        <motion.div
          className="w-full max-w-4xl mx-auto"
          variants={searchWidgetVariants}
        >
          <FlightSearchWidget />
        </motion.div>

        {/* Slide indicators with enhanced design */}
        <motion.div
          className="flex items-center justify-center gap-3 mt-8"
          variants={itemVariants}
        >
          {slides.map((_, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "relative h-2 rounded-full transition-all duration-300 cursor-pointer",
                current === index
                  ? "w-8 bg-brand-yellow shadow-glow"
                  : "w-2 bg-white/50 hover:bg-white/70"
              )}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              aria-label={`Go to slide ${index + 1}`}
            >
              {current === index && (
                <motion.div
                  className="absolute inset-0 bg-brand-yellow rounded-full"
                  layoutId="activeIndicator"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>

      {/* Floating decorative elements */}
      <motion.div
        className="absolute top-20 right-10 w-20 h-20 bg-brand-yellow/10 rounded-full blur-xl"
        animate={{
          x: [0, 20, 0],
          y: [0, -10, 0],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      
      <motion.div
        className="absolute bottom-32 left-8 w-16 h-16 bg-brand-green/15 rounded-full blur-lg"
        animate={{
          x: [0, -15, 0],
          y: [0, 15, 0],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
      />
    </section>
  );
}
