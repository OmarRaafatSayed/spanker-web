/**
 * SPANKER BRAND SYSTEM
 * =====================
 * Complete brand identity system export
 */

export { BRAND_COLORS, SEMANTIC_COLORS, green, yellow, white, blue } from "./colors";
export { BRAND_ASSETS } from "./assets";

// Re-export everything as a single brand object
import { BRAND_COLORS, SEMANTIC_COLORS } from "./colors";
import { BRAND_ASSETS } from "./assets";

export const BRAND = {
  colors: BRAND_COLORS,
  semantic: SEMANTIC_COLORS,
  assets: BRAND_ASSETS,
} as const;

export default BRAND;
