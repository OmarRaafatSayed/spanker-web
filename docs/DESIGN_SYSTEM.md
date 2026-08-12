# Spanker Travel - Shared Design System

## Overview

This is the **single source of truth** for the Spanker luxury travel brand identity. The design system is centralized in TypeScript and exported to multiple formats for consumption by:

- **Next.js Customer Portal** (React components)
- **FastAPI Travel CRM Dashboard** (CSS + JSON tokens)
- **External integrations** (mobile apps, third-party UIs)

## Architecture

```
src/lib/design-tokens.ts          ← Core token definitions (TypeScript)
    ↓
src/app/api/design-tokens/route.ts  ← REST API endpoints
    ↓
FastAPI CRM               ← Consumes JSON/CSS via HTTP
Next.js Portal            ← Imports TypeScript directly
External Systems          ← REST endpoints
```

## Accessing Tokens

### Option 1: Next.js Components (TypeScript)

**Direct import** (recommended for React):

```tsx
import { designTokens, COLOR_PALETTE, SPACING } from "@/lib/design-tokens";

export function MyComponent() {
  return (
    <div
      style={{
        background: COLOR_PALETTE.background.light,
        padding: SPACING[6],
        borderRadius: designTokens.borderRadius.lg,
        color: COLOR_PALETTE.text.primary,
      }}
    >
      Content
    </div>
  );
}
```

**Via custom hook** (recommended for re-usable patterns):

```tsx
import { useDesignTokens, getGlassCardStyle } from "@/lib/use-design-tokens";

export function GlassCard() {
  const tokens = useDesignTokens();

  return <div style={getGlassCardStyle()}>Glass Card</div>;
}
```

### Option 2: FastAPI CRM (Python/JSON)

**Fetch tokens at runtime:**

```python
import requests
import json

# Get tokens as JSON
response = requests.get("http://localhost:3000/api/design-tokens")
tokens = response.json()

# Use in your styling logic
brand_green = tokens["colors"]["brand"]["green"]
spacing_6 = tokens["spacing"]["6"]
primary_button = tokens["components"]["button"]["primary"]

# Generate CSS
print(tokens["colors"]["brand"]["green"])  # "#1b4332"
```

**Cache tokens at build time:**

```bash
# In your FastAPI build script
curl http://localhost:3000/api/design-tokens -o design-tokens.json
```

### Option 3: CSS Variables (Any Framework)

**Link to CSS variables endpoint:**

```html
<link rel="stylesheet" href="http://localhost:3000/api/design-tokens?format=css" />
```

**Use in stylesheets:**

```css
.my-card {
  background: var(--color-background-light);
  color: var(--color-text-primary);
  padding: var(--spacing-6);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}
```

### Option 4: Tailwind Config

**Fetch and merge into your Tailwind config:**

```bash
curl http://localhost:3000/api/design-tokens?format=tailwind -o tailwind-extend.json
```

```js
// tailwind.config.js
const tokens = require("./tailwind-extend.json");
module.exports = {
  theme: {
    extend: tokens.theme.extend,
  },
};
```

## Color Palette

### Primary: Emerald Green (Luxury Brand)

| Token | Value | Usage |
| --- | --- | --- |
| `brand.green` | `#1b4332` | Buttons, headings, primary actions |
| `brand.greenDark` | `#081c15` | Hover states, emphasis |
| `brand.greenLight` | `#2d6a4f` | Backgrounds, subtle elements |

### Secondary: Premium Gold (Accent)

| Token | Value | Usage |
| --- | --- | --- |
| `accent.yellow` | `#d4af37` | CTAs, highlights, badges |
| `accent.yellowDark` | `#b8941f` | Hover states |
| `accent.yellowLight` | `#f4d03f` | Light backgrounds |

### Backgrounds

| Token | Value | Usage |
| --- | --- | --- |
| `background.light` | `#f8f6f1` | Primary page background |
| `background.lightAlt` | `#f2ede6` | Secondary sections |
| `background.navy` | `#1e293b` | Footer, dark panels |
| `background.dark` | `#0f172a` | Dark mode background |

### Text

| Token | Value | Usage |
| --- | --- | --- |
| `text.primary` | `#0f172a` | Main text |
| `text.secondary` | `#475569` | Secondary text |
| `text.muted` | `#64748b` | Disabled, helper text |
| `text.luxury` | `#1e293b` | Premium emphasis |

### Glassmorphism

| Token | Value |
| --- | --- |
| `glass.bg` | `rgba(255, 255, 255, 0.75)` |
| `glass.border` | `rgba(255, 255, 255, 0.3)` |
| `glass.bgDark` | `rgba(248, 246, 241, 0.7)` |
| `glass.borderDark` | `rgba(216, 208, 195, 0.4)` |

## Typography

| Token | Value |
| --- | --- |
| Font Family | Cairo (Latin + Arabic support) |
| Base Size | 16px (1rem) |
| Line Height | 1.5 (relaxed) |
| Weight Range | 300 (light) to 700 (bold) |

### Font Sizes

```
xs:   0.75rem (12px)
sm:   0.875rem (14px)
base: 1rem (16px)
lg:   1.125rem (18px)
xl:   1.25rem (20px)
2xl:  1.5rem (24px)
3xl:  1.875rem (30px)
4xl:  2.25rem (36px)
5xl:  3rem (48px)
```

## Spacing Scale

```
0:   0
1:   0.25rem (4px)
2:   0.5rem (8px)
3:   0.75rem (12px)
4:   1rem (16px)
6:   1.5rem (24px)
8:   2rem (32px)
12:  3rem (48px)
16:  4rem (64px)
... (see designTokens.spacing for full list)
```

## Border Radius

```
none:  0
sm:    0.25rem (4px)
base:  0.5rem (8px)
md:    0.625rem (10px) — shadcn default
lg:    0.75rem (12px)
xl:    1rem (16px)
2xl:   1.5rem (24px)
full:  9999px
```

## Shadows

```
sm:         subtle shadow
base:       standard shadow
md:         medium elevation
lg:         prominent depth
xl:         high elevation
2xl:        maximum depth
glass:      glassmorphism effect
glassLarge: large glass effect
luxury:     premium shadow (0 30px 60px -20px rgba(0,0,0,0.12))
```

## Gradients

```
luxury:  Emerald green gradient (brand primary)
warm:    Soft cream gradient (warm backgrounds)
mesh:    Radial gradient mesh (sophisticated texture)
gold:    Premium gold gradient (accent)
emerald: Green gradient variant
twilight: Dark navy gradient
```

## Component Presets

### Card Variants

```tsx
// Glass Card
<div style={getGlassCardStyle()}>
  Glass card with 16px blur backdrop
</div>

// Glass Panel (elevated variant)
<div style={getGlassPanelStyle()}>
  More opaque glass panel with 20px blur
</div>
```

### Button Variants

```tsx
// Primary Button (brand green)
<button style={getPrimaryButtonStyle()}>
  Primary Action
</button>

// Secondary Button
<button style={getSecondaryButtonStyle()}>
  Cancel
</button>

// Accent Button (gold)
<button style={getAccentButtonStyle()}>
  Highlight
</button>
```

### Badge Variants

```tsx
<span style={getBadgeStyle("success")}>Approved</span>
<span style={getBadgeStyle("warning")}>In Review</span>
<span style={getBadgeStyle("error")}>Rejected</span>
<span style={getBadgeStyle("info")}>Info</span>
```

## Animations

| Duration | Value |
| --- | --- |
| fast | 150ms |
| normal | 300ms |
| slow | 500ms |
| slower | 700ms |

| Easing | Value |
| --- | --- |
| easeOut | `cubic-bezier(0, 0, 0.2, 1)` |
| easeInOut | `cubic-bezier(0.4, 0, 0.2, 1)` |
| easeInCubic | `cubic-bezier(0.32, 0, 0.67, 0)` |

### Keyframe Animations

```css
@keyframes fadeInUp
  Fade in + slide up 30px

@keyframes glowPulse
  Soft glow pulse effect (brand green)

@keyframes shimmer
  Shimmer/loading effect
```

## Responsive Breakpoints

```
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

## REST API Endpoints

### JSON Format (Default)

```bash
GET /api/design-tokens
```

Returns complete design tokens as JSON.

```json
{
  "colors": {...},
  "typography": {...},
  "spacing": {...},
  "components": {...}
}
```

### CSS Variables Format

```bash
GET /api/design-tokens?format=css
```

Returns CSS custom property declarations:

```css
:root {
  --color-brand-green: #1b4332;
  --color-accent-yellow: #d4af37;
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  ...
}
```

### Tailwind Config Format

```bash
GET /api/design-tokens?format=tailwind
```

Returns Tailwind theme extension object for merging into your config.

### HTML Style Guide

```bash
GET /api/design-tokens?format=html
```

Returns interactive style guide page showcasing all tokens.

## FastAPI CRM Integration Example

### Setup

```python
# fastapi_crm/settings.py
import os
import requests

# Fetch tokens from Next.js portal
DESIGN_TOKENS_URL = os.getenv(
    "DESIGN_TOKENS_URL",
    "http://localhost:3000/api/design-tokens"
)

def get_design_tokens():
    try:
        response = requests.get(DESIGN_TOKENS_URL, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"Failed to fetch design tokens: {e}")
        return {}

DESIGN_TOKENS = get_design_tokens()
```

### Usage in Jinja Templates

```html
<!-- fastapi_crm/templates/dashboard.html -->
<style>
  :root {
    --brand-green: {{ design_tokens.colors.brand.green }};
    --spacing-6: {{ design_tokens.spacing["6"] }};
  }
</style>

<button style="background: var(--brand-green);">
  {{ cta_text }}
</button>
```

### Usage in Python Components

```python
# fastapi_crm/dashboards/visa_dashboard.py
from settings import DESIGN_TOKENS

def get_card_style():
    return DESIGN_TOKENS.get("components", {}).get("card", {}).get("glass", {})

def render_visa_card(application):
    card_style = get_card_style()
    return {
        "style": card_style,
        "data": application
    }
```

## Maintenance & Updates

### Adding a New Token

1. **Update** `src/lib/design-tokens.ts`:

```typescript
export const MY_NEW_TOKENS = {
  newColor: "#abc123",
  newSpacing: "2.5rem",
};
```

2. **Rebuild** API cache (automatic on deployment)
3. **Update docs** (this file)

### Syncing with CRM

The FastAPI CRM should cache design tokens at startup:

```python
# In FastAPI app startup
@app.on_event("startup")
async def load_design_tokens():
    global DESIGN_TOKENS
    DESIGN_TOKENS = get_design_tokens()
```

To force a refresh:

```bash
# Manual refresh endpoint
POST /admin/refresh-design-tokens
```

## Compliance & Accessibility

- **Color Contrast**: Primary text on backgrounds meets WCAG AA standards (4.5:1 minimum)
- **Font Size**: Minimum 14px for body text (0.875rem)
- **Focus States**: All interactive elements have visible focus rings using green accent
- **RTL Support**: Typography and spacing fully support Arabic/RTL layouts

## Design Principles

1. **Consistency**: One token, one value, everywhere
2. **Scalability**: Both minimal (portal) and complex (CRM) use same tokens
3. **Accessibility**: Tokens chosen with contrast and readability in mind
4. **Performance**: Tokens cached and served via CDN for FastAPI CRM
5. **Flexibility**: Export multiple formats to support any framework

## Support & Questions

For design system questions or token additions, contact the design team or create an issue in the repository.

---

**Last Updated**: August 2026  
**Version**: 1.0.0  
**Status**: Active
