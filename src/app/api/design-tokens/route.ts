/**
 * /api/design-tokens/route.ts
 * ===========================
 * Endpoint to serve design tokens in multiple formats for cross-system consumption.
 *
 * Usage:
 *   GET /api/design-tokens → JSON format (default)
 *   GET /api/design-tokens?format=css → CSS variables format
 *   GET /api/design-tokens?format=json → JSON format (explicit)
 *   GET /api/design-tokens?format=tailwind → Tailwind config format
 *
 * Consumed by:
 *   - FastAPI CRM (for styling dashboard)
 *   - External apps needing the Spanker design system
 *   - Documentation/style guide generation
 */

import { NextRequest, NextResponse } from "next/server";
import {
  designTokens,
  getDesignTokensJSON,
  generateCSSVariables,
  COLOR_PALETTE,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  GRADIENTS,
  ANIMATIONS,
  COMPONENT_PRESETS,
} from "@/lib/design-tokens";

// =============================================================================
// CORS Headers
// =============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, max-age=3600, s-maxage=3600", // Cache 1 hour
};

// =============================================================================
// GET Handler
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";

  try {
    switch (format.toLowerCase()) {
      case "css":
        return new NextResponse(generateCSSVariables(), {
          headers: {
            "Content-Type": "text/css",
            ...CORS_HEADERS,
          },
        });

      case "tailwind":
        return tailwindConfigResponse();

      case "html":
        return htmlStyleGuideResponse();

      case "json":
      default:
        return new NextResponse(getDesignTokensJSON(), {
          headers: {
            "Content-Type": "application/json",
            ...CORS_HEADERS,
          },
        });
    }
  } catch (error) {
    console.error("[design-tokens] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate design tokens" },
      { status: 500 }
    );
  }
}

// =============================================================================
// OPTIONS Handler (for CORS preflight)
// =============================================================================

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: CORS_HEADERS,
  });
}

// =============================================================================
// TAILWIND CONFIG FORMAT
// =============================================================================

function tailwindConfigResponse() {
  const tailwindConfig = {
    theme: {
      extend: {
        colors: {
          brand: {
            green: COLOR_PALETTE.brand.green,
            "green-dark": COLOR_PALETTE.brand.greenDark,
            "green-light": COLOR_PALETTE.brand.greenLight,
          },
          accent: {
            yellow: COLOR_PALETTE.accent.yellow,
            "yellow-dark": COLOR_PALETTE.accent.yellowDark,
            "yellow-light": COLOR_PALETTE.accent.yellowLight,
          },
          luxury: {
            charcoal: COLOR_PALETTE.background.charcoal,
            navy: COLOR_PALETTE.background.navy,
            dark: COLOR_PALETTE.background.dark,
          },
          text: {
            luxury: COLOR_PALETTE.text.luxury,
          },
        },
        fontFamily: {
          sans: TYPOGRAPHY.fontFamily.sans,
          serif: TYPOGRAPHY.fontFamily.serif,
        },
        spacing: SPACING,
        borderRadius: BORDER_RADIUS,
        boxShadow: SHADOWS,
        backgroundImage: GRADIENTS,
        animation: {
          "fade-in-up": `fadeInUp ${ANIMATIONS.duration.normal} ease-out`,
          "glow-pulse": `glowPulse ${ANIMATIONS.duration.slower} ease-in-out infinite`,
          shimmer: `shimmer ${ANIMATIONS.duration.slow} linear infinite`,
        },
        keyframes: ANIMATIONS.keyframes,
      },
    },
  };

  return new NextResponse(JSON.stringify(tailwindConfig, null, 2), {
    headers: {
      "Content-Type": "application/json",
      ...CORS_HEADERS,
    },
  });
}

// =============================================================================
// HTML STYLE GUIDE FORMAT
// =============================================================================

function htmlStyleGuideResponse() {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Spanker Travel - Design System</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: ${TYPOGRAPHY.fontFamily.sans};
            background: ${COLOR_PALETTE.background.light};
            color: ${COLOR_PALETTE.text.primary};
            padding: ${SPACING[8]};
        }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { font-size: ${TYPOGRAPHY.fontSize["4xl"]}; margin: ${SPACING[8]} 0 ${SPACING[6]} 0; }
        h2 { font-size: ${TYPOGRAPHY.fontSize["2xl"]}; margin: ${SPACING[6]} 0 ${SPACING[4]} 0; color: ${COLOR_PALETTE.brand.green}; }
        
        .color-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: ${SPACING[4]};
            margin: ${SPACING[6]} 0;
        }
        .color-swatch {
            padding: ${SPACING[4]};
            border-radius: ${BORDER_RADIUS.lg};
            box-shadow: ${SHADOWS.base};
            text-align: center;
            font-size: ${TYPOGRAPHY.fontSize.sm};
        }
        
        .component-showcase {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: ${SPACING[6]};
            margin: ${SPACING[6]} 0;
        }
        .component-card {
            padding: ${SPACING[6]};
            border-radius: ${BORDER_RADIUS.lg};
            box-shadow: ${SHADOWS.md};
            background: white;
        }
        .glass-card {
            background: ${COLOR_PALETTE.glass.bgDark};
            backdrop-filter: blur(16px);
            border: 1px solid ${COLOR_PALETTE.glass.borderDark};
            box-shadow: ${SHADOWS.glass};
        }
        
        button {
            padding: ${SPACING[3]} ${SPACING[6]};
            border-radius: ${BORDER_RADIUS.md};
            border: none;
            font-family: ${TYPOGRAPHY.fontFamily.sans};
            font-weight: ${TYPOGRAPHY.fontWeight.semibold};
            cursor: pointer;
            transition: all 300ms ease-out;
            margin: ${SPACING[2]};
        }
        .btn-primary {
            background: ${COLOR_PALETTE.brand.green};
            color: white;
            box-shadow: ${SHADOWS.md};
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: ${SHADOWS.lg};
        }
        .btn-accent {
            background: ${COLOR_PALETTE.accent.yellow};
            color: ${COLOR_PALETTE.text.primary};
        }
        
        .luxury-gradient {
            background: ${GRADIENTS.luxury};
            color: white;
            padding: ${SPACING[8]};
            border-radius: ${BORDER_RADIUS.lg};
            text-align: center;
        }
        
        code {
            background: ${COLOR_PALETTE.background.lightAlt};
            padding: ${SPACING[1]} ${SPACING[2]};
            border-radius: ${BORDER_RADIUS.sm};
            font-family: monospace;
            font-size: ${TYPOGRAPHY.fontSize.sm};
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>✨ Spanker Travel Design System</h1>
        <p>Luxury brand identity tokens for all platforms.</p>
        
        <h2>Color Palette</h2>
        <div class="color-grid">
            <div class="color-swatch" style="background: ${COLOR_PALETTE.brand.green}; color: white;">
                Brand Green<br><code>${COLOR_PALETTE.brand.green}</code>
            </div>
            <div class="color-swatch" style="background: ${COLOR_PALETTE.accent.yellow};">
                Accent Gold<br><code>${COLOR_PALETTE.accent.yellow}</code>
            </div>
            <div class="color-swatch" style="background: ${COLOR_PALETTE.background.navy}; color: white;">
                Navy<br><code>${COLOR_PALETTE.background.navy}</code>
            </div>
            <div class="color-swatch" style="background: ${COLOR_PALETTE.background.light}; border: 1px solid #ccc;">
                Light Warm<br><code>${COLOR_PALETTE.background.light}</code>
            </div>
        </div>
        
        <h2>Components</h2>
        <div class="component-showcase">
            <div class="component-card">
                <button class="btn-primary">Primary Button</button>
            </div>
            <div class="component-card">
                <button class="btn-accent">Accent Button</button>
            </div>
            <div class="component-card glass-card">
                <p>Glass Card</p>
            </div>
            <div class="component-card" style="background: ${GRADIENTS.luxury}; color: white;">
                <p>Gradient Card</p>
            </div>
        </div>
        
        <h2>API Endpoints</h2>
        <ul style="margin-left: ${SPACING[6]};">
            <li><code>GET /api/design-tokens</code> → JSON format</li>
            <li><code>GET /api/design-tokens?format=css</code> → CSS variables</li>
            <li><code>GET /api/design-tokens?format=tailwind</code> → Tailwind config</li>
            <li><code>GET /api/design-tokens?format=html</code> → This page</li>
        </ul>
        
        <h2>Usage in FastAPI CRM</h2>
        <pre><code>
# Python example
import requests

tokens = requests.get("http://localhost:3000/api/design-tokens").json()
brand_green = tokens['colors']['brand']['green']
primary_button_style = tokens['components']['button']['primary']
        </code></pre>
    </div>
</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      ...CORS_HEADERS,
    },
  });
}
