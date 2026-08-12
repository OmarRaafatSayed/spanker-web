// =============================================================================
// Motion Wrapper - Reusable Framer Motion Components
// =============================================================================

"use client";

import { motion } from "framer-motion";
import type { HTMLMotionProps } from "framer-motion";

// Stagger container for animating children in sequence
export function StaggerContainer({ 
  children, 
  className, 
  delay = 0,
  stagger = 0.1,
  ...props 
}: HTMLMotionProps<"div"> & {
  delay?: number;
  stagger?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: stagger,
            delayChildren: delay,
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Fade in up animation for individual items
export function FadeInUp({ 
  children, 
  className, 
  delay = 0,
  duration = 0.6,
  ...props 
}: HTMLMotionProps<"div"> & {
  delay?: number;
  duration?: number;
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration,
            ease: [0.4, 0, 0.2, 1],
          },
        },
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Scale in animation
export function ScaleIn({ 
  children, 
  className, 
  delay = 0,
  ...props 
}: HTMLMotionProps<"div"> & {
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ 
        opacity: 1, 
        scale: 1,
        transition: {
          duration: 0.5,
          ease: [0.4, 0, 0.2, 1],
          delay,
        }
      }}
      viewport={{ once: true }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Hover lift effect for cards
export function HoverLift({ 
  children, 
  className, 
  lift = 8,
  scale = 1.02,
  ...props 
}: HTMLMotionProps<"div"> & {
  lift?: number;
  scale?: number;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ 
        y: -lift, 
        scale,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Slide in from side
export function SlideIn({ 
  children, 
  className, 
  direction = "left",
  distance = 50,
  delay = 0,
  ...props 
}: HTMLMotionProps<"div"> & {
  direction?: "left" | "right" | "up" | "down";
  distance?: number;
  delay?: number;
}) {
  const getInitialPosition = () => {
    switch (direction) {
      case "left": return { x: -distance, opacity: 0 };
      case "right": return { x: distance, opacity: 0 };
      case "up": return { y: -distance, opacity: 0 };
      case "down": return { y: distance, opacity: 0 };
    }
  };

  return (
    <motion.div
      className={className}
      initial={getInitialPosition()}
      whileInView={{ 
        x: 0, 
        y: 0, 
        opacity: 1,
        transition: {
          duration: 0.6,
          ease: [0.4, 0, 0.2, 1],
          delay,
        }
      }}
      viewport={{ once: true }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Luxury card with hover effects
export function LuxuryCard({ 
  children, 
  className, 
  variant = "glass",
  ...props 
}: HTMLMotionProps<"div"> & {
  variant?: "glass" | "luxury" | "elevated";
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case "glass": return "glass-card hover:glass-panel";
      case "luxury": return "bg-[#fffdf9] shadow-luxury hover:shadow-luxury-hover border-border-luxury";
      case "elevated": return "bg-[#fffdf9] shadow-lg hover:shadow-xl";
      default: return "glass-card hover:glass-panel";
    }
  };

  return (
    <motion.div
      className={`${getVariantClasses()} transition-all duration-300 ${className}`}
      whileHover={{ 
        y: -6, 
        scale: 1.01,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}