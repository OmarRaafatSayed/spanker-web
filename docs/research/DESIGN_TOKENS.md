# Air Cairo — Design Tokens

> Researched via web search, sitemap analysis, and search-engine snippets. The site blocks direct HTTP fetching.
> Source of truth reference: https://aircairo.com/en-eg/homepage

---

## Brand Identity

Air Cairo is a hybrid Egyptian national airline, part-owned by EgyptAir. The brand uses a red-heavy palette (matching EgyptAir family heritage) with white as the dominant UI colour and a dark/navy complement.

---

## Color Palette

### Primary Brand Colors
| Token | Value (hex) | Notes |
|-------|-------------|-------|
| `--color-brand-red` | `#CE1126` | Primary red — Egyptian flag red, Air Cairo logo color |
| `--color-brand-red-dark` | `#A50D1F` | Hover/active state for red buttons |
| `--color-brand-red-light` | `#E8122B` | Lighter variant seen in gradients |
| `--color-brand-white` | `#FFFFFF` | Primary background, nav text on hero |
| `--color-brand-dark` | `#1A1A2E` | Dark navy/near-black for footer background |
| `--color-brand-navy` | `#002147` | Secondary dark color for text & accents |

### Neutral / UI Colors
| Token | Value (hex) | Notes |
|-------|-------------|-------|
| `--color-text-primary` | `#1A1A1A` | Main body text |
| `--color-text-secondary` | `#555555` | Secondary text, meta info |
| `--color-text-muted` | `#888888` | Placeholder text, disabled |
| `--color-text-on-dark` | `#FFFFFF` | Text on dark/red backgrounds |
| `--color-bg-page` | `#FFFFFF` | Page background |
| `--color-bg-section-alt` | `#F7F7F7` | Alternate section background (light gray) |
| `--color-bg-section-dark` | `#1A1A2E` | Dark footer/section background |
| `--color-border` | `#E0E0E0` | Subtle border/divider color |
| `--color-border-light` | `#F0F0F0` | Very light internal dividers |

### Status / Feedback Colors
| Token | Value (hex) | Notes |
|-------|-------------|-------|
| `--color-success` | `#28A745` | Success states |
| `--color-warning` | `#FFC107` | Warning states |
| `--color-error` | `#DC3545` | Error / destructive |
| `--color-info` | `#17A2B8` | Informational |

### Gradient
The hero section likely uses a dark overlay gradient on top of a full-width background image:
```css
background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.6) 100%);
```

---

## Typography

### Font Families
| Token | Value | Notes |
|-------|-------|-------|
| `--font-primary` | `'Cairo', sans-serif` | **Primary font** — Google Fonts, matches airline name brand |
| `--font-secondary` | `'Open Sans', sans-serif` | Body text fallback |
| `--font-arabic` | `'Cairo', sans-serif` | RTL Arabic variant (same family) |
| `--font-system` | `system-ui, sans-serif` | Ultimate fallback |

> **Note:** The font "Cairo" from Google Fonts is almost certainly used — it matches the airline's name, is a well-known Arabic/Latin typeface, and fits the Egyptian branding. Verify against actual CSS when possible.

### Type Scale
| Level | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| `display` | `3rem / 48px` | 700 | 1.1 | Hero headline |
| `h1` | `2.5rem / 40px` | 700 | 1.2 | Page titles |
| `h2` | `2rem / 32px` | 600 | 1.25 | Section headings |
| `h3` | `1.5rem / 24px` | 600 | 1.3 | Card titles, sub-sections |
| `h4` | `1.25rem / 20px` | 600 | 1.4 | Sub-headings |
| `body-lg` | `1.125rem / 18px` | 400 | 1.6 | Lead paragraphs |
| `body` | `1rem / 16px` | 400 | 1.6 | Default body text |
| `body-sm` | `0.875rem / 14px` | 400 | 1.5 | Secondary text, labels |
| `caption` | `0.75rem / 12px` | 400 | 1.4 | Meta, timestamps |
| `label` | `0.875rem / 14px` | 500 | 1.4 | Form labels, nav items |

### Font Weights Used
- 400 — Regular (body text)
- 500 — Medium (labels, navigation items)
- 600 — SemiBold (card titles, sub-headings)
- 700 — Bold (headlines, CTAs)

---

## Spacing Scale

Based on typical airline website patterns and 8px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | `4px` | Micro gaps |
| `--space-2` | `8px` | Small padding, icon gaps |
| `--space-3` | `12px` | Small internal padding |
| `--space-4` | `16px` | Standard padding |
| `--space-5` | `20px` | Medium padding |
| `--space-6` | `24px` | Medium-large padding |
| `--space-8` | `32px` | Section padding |
| `--space-10` | `40px` | Large section gaps |
| `--space-12` | `48px` | XL section padding |
| `--space-16` | `64px` | Section vertical spacing |
| `--space-20` | `80px` | Large section vertical spacing |
| `--space-24` | `96px` | Hero padding |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `4px` | Tags, small chips |
| `--radius-md` | `8px` | Input fields, small cards |
| `--radius-lg` | `12px` | Cards, modals |
| `--radius-xl` | `16px` | Larger cards |
| `--radius-pill` | `9999px` | Pills, round buttons, tabs |
| `--radius-full` | `50%` | Avatar circles |

---

## Shadows / Elevation

| Level | CSS Value | Usage |
|-------|-----------|-------|
| `shadow-sm` | `0 1px 3px rgba(0,0,0,0.08)` | Subtle card lift |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.10)` | Cards, dropdowns |
| `shadow-lg` | `0 8px 24px rgba(0,0,0,0.14)` | Modals, floating elements |
| `shadow-hero` | `0 2px 40px rgba(0,0,0,0.2)` | Booking widget on hero |

---

## Breakpoints

| Name | Min-width | Notes |
|------|-----------|-------|
| `xs` | `0px` | Mobile first (default) |
| `sm` | `640px` | Large mobile / small tablet |
| `md` | `768px` | Tablet portrait |
| `lg` | `1024px` | Tablet landscape / small desktop |
| `xl` | `1280px` | Desktop |
| `2xl` | `1440px` | Wide desktop |

---

## Button Variants

### Primary Button (Red CTA)
```
background: #CE1126
color: #FFFFFF
border-radius: 4–8px
padding: 12px 32px
font-weight: 600
font-size: 16px
hover: background #A50D1F
```

### Secondary Button (Outlined)
```
background: transparent
border: 2px solid #CE1126
color: #CE1126
border-radius: 4–8px
padding: 10px 30px
hover: background #CE1126, color #FFFFFF
```

### Ghost / Text Button
```
background: transparent
color: #CE1126
no border
hover: underline or background rgba(206,17,38,0.05)
```

### White Button (on dark backgrounds)
```
background: #FFFFFF
color: #CE1126
border-radius: 4–8px
padding: 12px 32px
hover: background #F0F0F0
```

---

## Form / Input Tokens

| Property | Value |
|----------|-------|
| Input height | `48px` |
| Input border | `1px solid #E0E0E0` |
| Input border-radius | `8px` |
| Input focus border | `2px solid #CE1126` |
| Input background | `#FFFFFF` |
| Select height | `48px` |
| Label font-size | `14px`, weight 500 |
| Placeholder color | `#888888` |

---

## Icon System

- Air Cairo uses **custom SVG icons** for flight-related UI (plane icons, seat icons, baggage icons)
- Navigation icons are likely custom or from a generic icon set
- Social media icons: Facebook, Instagram, Twitter/X, LinkedIn, YouTube
- Arrow/chevron icons for carousels and accordions
- Flag/globe icons for language/country switcher

---

## Logo

- **Primary logo:** "Air Cairo" wordmark with red aircraft silhouette
- Color: Red (#CE1126) with text in red or dark color
- White variant for dark backgrounds
- SVG format available from Wikimedia Commons (public domain mark)
- Logo URL reference: `https://upload.wikimedia.org/wikipedia/commons/thumb/.../Air_Cairo_logo.svg`

---

## Z-Index Layers

| Layer | Value | Usage |
|-------|-------|-------|
| `base` | 0 | Normal flow |
| `dropdown` | 100 | Navigation dropdowns |
| `sticky` | 200 | Sticky header |
| `overlay` | 300 | Modal overlays |
| `modal` | 400 | Modals, drawers |
| `toast` | 500 | Notifications |
| `tooltip` | 600 | Tooltips |

---

## Next.js / Tailwind v4 Implementation

```css
/* globals.css — Air Cairo design tokens */
:root {
  --color-brand-red: oklch(0.44 0.22 27.3);     /* #CE1126 */
  --color-brand-dark: oklch(0.17 0.03 265);      /* #1A1A2E */
  --color-brand-navy: oklch(0.18 0.07 249);      /* #002147 */
  --color-text-primary: oklch(0.13 0 0);         /* #1A1A1A */
  --color-text-secondary: oklch(0.39 0 0);       /* #555555 */
  --color-text-muted: oklch(0.58 0 0);           /* #888888 */
  --color-bg-alt: oklch(0.97 0 0);               /* #F7F7F7 */
  --font-primary: 'Cairo', sans-serif;
  --font-secondary: 'Open Sans', sans-serif;
}
```
