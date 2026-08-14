/**
 * design-tokens.ts
 * ================
 * SHARED DESIGN SYSTEM — Single Source of Truth for Luxury Brand Identity
 *
 * This module exports all design tokens (colors, typography, spacing, shadows, gradients)
 * that define the Spanker luxury travel brand. Both Next.js portal and FastAPI CRM
 * consume these tokens.
 *
 * Export formats:
 * - TypeScript object (for React components)
 * - JSON (for external systems like FastAPI CRM)
 * - CSS variables (already in globals.css, but documented here)
 * - Tailwind config (already extended in tailwind.config.ts)
 *
 * USAGE:
 *   React:      import { designTokens } from "@/lib/design-tokens"
 *   FastAPI:    GET /api/design-tokens → JSON payload
 *   CSS:        var(--color-brand-green), var(--glass-blur), etc.
 */

// =============================================================================
// COLOR PALETTE — Emerald Green + Gold Luxury
// =============================================================================

import { BRAND_COLORS } from "./brand/colors";

export const COLOR_PALETTE = {
  // Brand colors from centralized brand system
  brand: {
    green: BRAND_COLORS.green,
    yellow: BRAND_COLORS.yellow,
    white: BRAND_COLORS.white,
    blue: BRAND_COLORS.blue,
  },

  // Semantic mappings
  primary: BRAND_COLORS.green,
  secondary: BRAND_COLORS.yellow,
  
  // Background colors
  background: {
    light: BRAND_COLORS.white,
    primary: BRAND_COLORS.white,
  },

  // Text colors (derived from brand)
  text: {
    primary: "#1a1a1a",
    secondary: "#4a4a4a",
    muted: "#6a6a6a",
    onPrimary: BRAND_COLORS.white,
  },

  // Border colors
  border: {
    light: "#e5e5e5",
    default: "#d4d4d4",
  },

  // State colors
  states: {
    success: BRAND_COLORS.green,
    warning: BRAND_COLORS.yellow,
    info: BRAND_COLORS.blue,
    destructive: "#dc2626",
  },
};

// =============================================================================
// TYPOGRAPHY — Cairo Font + Hierarchy
// =============================================================================

export const TYPOGRAPHY = {
  fontFamily: {
    sans: '"Cairo", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    serif: '"Playfair Display", Georgia, serif',
  },

  fontSize: {
    xs: "0.75rem",      // 12px
    sm: "0.875rem",     // 14px
    base: "1rem",       // 16px
    lg: "1.125rem",     // 18px
    xl: "1.25rem",      // 20px
    "2xl": "1.5rem",    // 24px
    "3xl": "1.875rem",  // 30px
    "4xl": "2.25rem",   // 36px
    "5xl": "3rem",      // 48px
  },

  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },

  letterSpacing: {
    tight: "-0.02em",
    normal: "0em",
    wide: "0.02em",
  },
};

// =============================================================================
// SPACING & LAYOUT
// =============================================================================

export const SPACING = {
  0: "0",
  0.5: "0.125rem",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  14: "3.5rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
  28: "7rem",
  32: "8rem",
  36: "9rem",
  40: "10rem",
  44: "11rem",
  48: "12rem",
  52: "13rem",
  56: "14rem",
  60: "15rem",
  64: "16rem",
  80: "20rem",
  96: "24rem",
};

export const BORDER_RADIUS = {
  none: "0",
  sm: "0.25rem",
  base: "0.5rem",
  md: "0.625rem",    // shadcn default
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  full: "9999px",
};

// =============================================================================
// SHADOWS — Luxury Depth
// =============================================================================

export const SHADOWS = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
  "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  glass: "0 20px 40px -15px rgba(0, 0, 0, 0.07)",
  glassLarge: "0 25px 50px -20px rgba(0, 0, 0, 0.1)",
  luxury: "0 30px 60px -20px rgba(0, 0, 0, 0.12)",
};

// =============================================================================
// GRADIENTS — Premium Visual Hierarchy
// =============================================================================

export const GRADIENTS = {
  primary: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.green}dd 100%)`,
  accent: `linear-gradient(135deg, ${BRAND_COLORS.yellow} 0%, ${BRAND_COLORS.yellow}dd 100%)`,
  hero: `linear-gradient(135deg, ${BRAND_COLORS.green} 0%, ${BRAND_COLORS.blue} 100%)`,
};

// =============================================================================
// ANIMATIONS & TRANSITIONS
// =============================================================================

export const ANIMATIONS = {
  duration: {
    fast: "150ms",
    normal: "300ms",
    slow: "500ms",
    slower: "700ms",
  },

  easing: {
    linear: "linear",
    in: "cubic-bezier(0.4, 0, 1, 1)",
    out: "cubic-bezier(0, 0, 0.2, 1)",
    inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
    easeInCubic: "cubic-bezier(0.32, 0, 0.67, 0)",
    easeOutCubic: "cubic-bezier(0.33, 1, 0.68, 1)",
  },

  keyframes: {
    fadeInUp: {
      from: { opacity: "0", transform: "translateY(30px)" },
      to: { opacity: "1", transform: "translateY(0)" },
    },
    glowPulse: {
      "0%, 100%": { boxShadow: "0 0 20px rgba(27, 67, 50, 0.3)" },
      "50%": { boxShadow: "0 0 30px rgba(27, 67, 50, 0.5)" },
    },
    shimmer: {
      "0%": { backgroundPosition: "-200% center" },
      "100%": { backgroundPosition: "200% center" },
    },
  },
};

// =============================================================================
// COMPONENT PRESETS — Ready-to-Use Styles
// =============================================================================

export const COMPONENT_PRESETS = {
  card: {
    base: {
      background: COLOR_PALETTE.background.light,
      borderRadius: BORDER_RADIUS.lg,
      boxShadow: SHADOWS.base,
      padding: SPACING[6],
    },
    glass: {
      background: "rgba(255, 255, 255, 0.7)",
      backdropFilter: "blur(16px)",
      border: `1px solid rgba(255, 255, 255, 0.3)`,
      borderRadius: BORDER_RADIUS.lg,
      boxShadow: SHADOWS.glass,
      padding: SPACING[6],
    },
    glassPanel: {
      background: "rgba(255, 255, 255, 0.92)",
      backdropFilter: "blur(20px)",
      border: `1px solid rgba(216, 208, 195, 0.5)`,
      borderRadius: BORDER_RADIUS.lg,
      boxShadow: SHADOWS.glassLarge,
      padding: SPACING[8],
    },
  },

  button: {
    primary: {
      background: COLOR_PALETTE.brand.green,
      color: "#ffffff",
      padding: `${SPACING[3]} ${SPACING[6]}`,
      borderRadius: BORDER_RADIUS.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      fontSize: TYPOGRAPHY.fontSize.base,
      transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      border: "none",
      boxShadow: SHADOWS.md,
    },
    secondary: {
      background: COLOR_PALETTE.background.light,
      color: COLOR_PALETTE.brand.green,
      padding: `${SPACING[3]} ${SPACING[6]}`,
      borderRadius: BORDER_RADIUS.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      fontSize: TYPOGRAPHY.fontSize.base,
      border: `2px solid ${COLOR_PALETTE.border.light}`,
      transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      boxShadow: SHADOWS.sm,
    },
    accent: {
      background: COLOR_PALETTE.brand.yellow,
      color: COLOR_PALETTE.text.primary,
      padding: `${SPACING[3]} ${SPACING[6]}`,
      borderRadius: BORDER_RADIUS.md,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
      fontSize: TYPOGRAPHY.fontSize.base,
      transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
      cursor: "pointer",
      border: "none",
      boxShadow: SHADOWS.md,
    },
  },

  input: {
    base: {
      padding: `${SPACING[2]} ${SPACING[4]}`,
      borderRadius: BORDER_RADIUS.md,
      fontSize: TYPOGRAPHY.fontSize.base,
      border: `1px solid ${COLOR_PALETTE.border.light}`,
      background: COLOR_PALETTE.background.light,
      color: COLOR_PALETTE.text.primary,
      fontFamily: TYPOGRAPHY.fontFamily.sans,
    },
    focus: {
      outline: "none",
      boxShadow: `0 0 0 3px rgba(27, 67, 50, 0.2)`,
      borderColor: COLOR_PALETTE.brand.green,
    },
  },

  badge: {
    success: {
      background: COLOR_PALETTE.states.success,
      color: "#ffffff",
      padding: `${SPACING[1]} ${SPACING[3]}`,
      borderRadius: BORDER_RADIUS.full,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    warning: {
      background: COLOR_PALETTE.states.warning,
      color: "#ffffff",
      padding: `${SPACING[1]} ${SPACING[3]}`,
      borderRadius: BORDER_RADIUS.full,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    error: {
      background: COLOR_PALETTE.states.destructive,
      color: "#ffffff",
      padding: `${SPACING[1]} ${SPACING[3]}`,
      borderRadius: BORDER_RADIUS.full,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
    info: {
      background: COLOR_PALETTE.states.info,
      color: "#ffffff",
      padding: `${SPACING[1]} ${SPACING[3]}`,
      borderRadius: BORDER_RADIUS.full,
      fontSize: TYPOGRAPHY.fontSize.xs,
      fontWeight: TYPOGRAPHY.fontWeight.semibold,
    },
  },
};

// =============================================================================
// RESPONSIVE BREAKPOINTS
// =============================================================================

export const BREAKPOINTS = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

// =============================================================================
// UNIFIED DESIGN TOKENS OBJECT (export everything)
// =============================================================================

export const designTokens = {
  colors: COLOR_PALETTE,
  typography: TYPOGRAPHY,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  gradients: GRADIENTS,
  animations: ANIMATIONS,
  components: COMPONENT_PRESETS,
  breakpoints: BREAKPOINTS,
  version: "1.0.0",
  brandName: "Spanker Travel",
  description: "Luxury Travel Platform Design System",
} as const;

// =============================================================================
// EXPORT AS JSON FOR EXTERNAL SYSTEMS (e.g., FastAPI CRM)
// =============================================================================

export function getDesignTokensJSON() {
  return JSON.stringify(designTokens, null, 2);
}

// =============================================================================
// CSS VARIABLE GENERATOR (for non-React systems)
// =============================================================================

export function generateCSSVariables(): string {
  const cssVars: string[] = [];

  // Colors
  Object.entries(COLOR_PALETTE).forEach(([category, values]) => {
    if (typeof values === "object") {
      Object.entries(values).forEach(([key, value]) => {
        if (typeof value === "string") {
          cssVars.push(`--color-${category}-${key}: ${value};`);
        }
      });
    }
  });

  // Shadows
  Object.entries(SHADOWS).forEach(([key, value]) => {
    cssVars.push(`--shadow-${key}: ${value};`);
  });

  // Spacing (key subset)
  [4, 6, 8, 12, 16, 24].forEach((key) => {
    cssVars.push(`--spacing-${key}: ${SPACING[key as keyof typeof SPACING]};`);
  });

  // Border Radius
  Object.entries(BORDER_RADIUS).forEach(([key, value]) => {
    cssVars.push(`--radius-${key}: ${value};`);
  });

  return `:root {\n  ${cssVars.join("\n  ")}\n}`;
}

// =============================================================================
// USAGE EXAMPLES
// =============================================================================

/*
 * REACT COMPONENT USAGE:
 * =====================
 * import { designTokens, COLOR_PALETTE } from "@/lib/design-tokens"
 *
 * export function MyComponent() {
 *   return (
 *     <div style={{
 *       background: COLOR_PALETTE.background.light,
 *       color: COLOR_PALETTE.text.primary,
 *       padding: designTokens.spacing[6],
 *       borderRadius: designTokens.borderRadius.lg,
 *       boxShadow: designTokens.shadows.lg,
 *     }}>
 *       Luxury Card
 *     </div>
 *   )
 * }
 *
 * FASTAPI CRM USAGE (via API endpoint):
 * =====================================
 * GET /api/design-tokens
 * Response: { colors: {...}, typography: {...}, spacing: {...}, ... }
 *
 * CSS VARIABLE USAGE (in external stylesheets):
 * ==============================================
 * <link rel="stylesheet" href="/api/design-tokens/css-variables">
 * .my-card {
 *   background: var(--color-background-light);
 *   color: var(--color-text-primary);
 *   padding: var(--spacing-6);
 *   border-radius: var(--radius-lg);
 *   box-shadow: var(--shadow-lg);
 * }
 */

export default designTokens;
