/**
 * SPANKER BRAND ASSETS
 * ====================
 * Centralized paths for all brand assets (logos, icons, patterns)
 * 
 * USAGE:
 * - logo.icon: Small logo for favicon, mobile menu, browser tabs, link previews (LOGO.png)
 * - logo.full: Full width logo for navbar, footer, headers (width-logo.png)
 */

export const BRAND_ASSETS = {
  logo: {
    // Full width logo for navbar, headers, footer
    full: "/width-logo.png",
    
    // Icon-only logo for favicon, mobile menu, compact spaces, browser tabs, link sharing
    icon: "/icone-LOGO.png",
  },
  
  patterns: {
    // Background patterns (if any exist)
    // Add here as discovered
  },
} as const;

export default BRAND_ASSETS;
