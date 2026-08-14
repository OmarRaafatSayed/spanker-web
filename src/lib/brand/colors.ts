/**
 * SPANKER BRAND COLORS
 * ====================
 * Single source of truth for all visual identity colors.
 * Used across: Website + Admin Dashboard + CRM
 * 
 * DO NOT define colors outside this file.
 */

export const BRAND_COLORS = {
  // Primary Brand Color
  green: "#3D6833",
  
  // Secondary Accent Color
  yellow: "#FDD12A",
  
  // Background & Light Surfaces
  white: "#FBFDFD",
  
  // Links & Interactive Elements
  blue: "#2473BC",
} as const;

// Semantic aliases for common use cases
export const SEMANTIC_COLORS = {
  primary: BRAND_COLORS.green,
  secondary: BRAND_COLORS.yellow,
  background: BRAND_COLORS.white,
  link: BRAND_COLORS.blue,
  
  // Button variants
  buttonPrimary: BRAND_COLORS.green,
  buttonPrimaryText: BRAND_COLORS.white,
  buttonSecondary: BRAND_COLORS.yellow,
  buttonSecondaryText: BRAND_COLORS.green,
  
  // Navigation
  navbarBg: BRAND_COLORS.green,
  navbarText: BRAND_COLORS.white,
  navbarAccent: BRAND_COLORS.yellow,
} as const;

// Export individual colors for convenience
export const { green, yellow, white, blue } = BRAND_COLORS;

export default BRAND_COLORS;
