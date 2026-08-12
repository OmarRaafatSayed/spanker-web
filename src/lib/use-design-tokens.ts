/**
 * use-design-tokens.ts
 * ====================
 * Utility hooks and helpers for consuming design tokens in React components.
 * Provides TypeScript-safe access to the design system.
 */

"use client";

import { useMemo } from "react";
import {
  designTokens,
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRADIENTS,
  COMPONENT_PRESETS,
} from "@/lib/design-tokens";

// =============================================================================
// Hook: useDesignTokens
// =============================================================================

/**
 * Main hook to access design tokens in React components.
 *
 * @returns All design tokens organized by category
 *
 * @example
 * const tokens = useDesignTokens()
 * console.log(tokens.colors.brand.green) // "#1b4332"
 * console.log(tokens.spacing[8]) // "2rem"
 */
export function useDesignTokens() {
  return useMemo(() => designTokens, []);
}

// =============================================================================
// Hook: useColorPalette
// =============================================================================

export function useColorPalette() {
  return useMemo(() => COLOR_PALETTE, []);
}

// =============================================================================
// Utility: Style Object Generators
// =============================================================================

/**
 * Generate inline style object for a glass card component.
 *
 * @example
 * <div style={getGlassCardStyle()}>Content</div>
 */
export function getGlassCardStyle() {
  return COMPONENT_PRESETS.card.glass;
}

/**
 * Generate inline style object for a glass panel component.
 *
 * @example
 * <div style={getGlassPanelStyle()}>Content</div>
 */
export function getGlassPanelStyle() {
  return COMPONENT_PRESETS.card.glassPanel;
}

/**
 * Generate inline style object for a primary button.
 *
 * @example
 * <button style={getPrimaryButtonStyle()}>Click me</button>
 */
export function getPrimaryButtonStyle() {
  return COMPONENT_PRESETS.button.primary;
}

/**
 * Generate inline style object for a secondary button.
 *
 * @example
 * <button style={getSecondaryButtonStyle()}>Cancel</button>
 */
export function getSecondaryButtonStyle() {
  return COMPONENT_PRESETS.button.secondary;
}

/**
 * Generate inline style object for an accent button.
 *
 * @example
 * <button style={getAccentButtonStyle()}>Special</button>
 */
export function getAccentButtonStyle() {
  return COMPONENT_PRESETS.button.accent;
}

/**
 * Generate inline style object for input focus state.
 *
 * @example
 * <input style={getInputFocusStyle()} />
 */
export function getInputFocusStyle() {
  return COMPONENT_PRESETS.input.focus;
}

/**
 * Generate inline style object for a badge.
 *
 * @param type - Badge type: 'success', 'warning', 'error', 'info'
 *
 * @example
 * <span style={getBadgeStyle('success')}>Approved</span>
 */
export function getBadgeStyle(
  type: "success" | "warning" | "error" | "info"
) {
  return COMPONENT_PRESETS.badge[type];
}

// =============================================================================
// Utility: CSS String Generators
// =============================================================================

/**
 * Generate CSS class-like string for inline styling (utility function).
 * Useful for dynamic component styling without CSS-in-JS libraries.
 *
 * @example
 * const className = cn("p-6 rounded-lg", shouldHighlight && "bg-brand-green")
 */
export function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// =============================================================================
// Utility: Computed Values
// =============================================================================

/**
 * Convert spacing token to rem value.
 * @example
 * const padding = remValue(SPACING[6]) // "1.5rem"
 */
export function remValue(value: string): string {
  return value; // Already in rem format from tokens
}

/**
 * Get contrast color based on background.
 * @example
 * const textColor = getContrastColor(tokens.colors.brand.green)
 */
export function getContrastColor(bgHex: string): string {
  // Simple contrast calculation: if background is dark, return white; else return dark
  const hex = bgHex.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? COLOR_PALETTE.text.primary : "#ffffff";
}

// =============================================================================
// Utility: Responsive Breakpoint Checker (Client-Side)
// =============================================================================

export function useResponsive() {
  const [isMobile, setIsMobile] = React.useState(false);
  const [isTablet, setIsTablet] = React.useState(false);
  const [isDesktop, setIsDesktop] = React.useState(false);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
      setIsTablet(window.innerWidth >= 640 && window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { isMobile, isTablet, isDesktop };
}

// Need to import React for useEffect
import React from "react";

// =============================================================================
// Export all tokens for direct import if needed
// =============================================================================

export {
  designTokens,
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRADIENTS,
  COMPONENT_PRESETS,
} from "@/lib/design-tokens";
