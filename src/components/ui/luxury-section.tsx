// =============================================================================
// Luxury Section - Background wrapper with mesh gradients
// =============================================================================

"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LuxurySectionProps {
  children: React.ReactNode;
  className?: string;
  variant?: "mesh" | "warm" | "gradient" | "glass" | "default";
  floating?: boolean;
}

export function LuxurySection({ 
  children, 
  className, 
  variant = "default",
  floating = false 
}: LuxurySectionProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "mesh": 
        return "mesh-bg relative";
      case "warm": 
        return "bg-warm-gradient relative";
      case "gradient": 
        return "bg-luxury-gradient relative text-white";
      case "glass": 
        return "glass-panel relative";
      default: 
        return "bg-bg-primary relative";
    }
  };

  return (
    <section className={cn(getVariantClasses(), className)}>
      {floating && (
        <>
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
          
          <motion.div
            className="absolute top-1/2 left-1/4 w-12 h-12 bg-brand-yellow/8 rounded-full blur-md"
            animate={{
              x: [0, 10, 0],
              y: [0, -20, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </section>
  );
}

// Section header with luxury styling
export function LuxurySectionHeader({
  title,
  subtitle,
  className,
  centered = false,
}: {
  title: string;
  subtitle?: string;
  className?: string;
  centered?: boolean;
}) {
  return (
    <motion.div
      className={cn(
        "mb-12",
        centered && "text-center",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <motion.h2 
        className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-luxury mb-4 bg-luxury-gradient bg-clip-text text-transparent"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: 0.1 }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p 
          className="text-lg text-text-secondary max-w-2xl leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {subtitle}
        </motion.p>
      )}
    </motion.div>
  );
}