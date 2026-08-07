# Air Cairo — Tech Stack Analysis

> Research based on: sitemap.xml structure, URL patterns, search snippets, and standard airline web industry patterns.
> Target: https://aircairo.com/en-eg/homepage

---

## Original Site Tech Stack (Inferred)

### Framework
The Air Cairo website appears to be a **custom-built SPA or server-rendered application**, likely Angular or Vue.js, based on:
- Multi-locale URL structure (`/{lang}-{country}/`) indicating a custom i18n routing system
- Booking engine integration (likely iframe or redirect to a third-party GDS)
- The redirect disclaimer ("You will be redirected to another website...") pointing to third-party integrations
- Site blocks all scraping/headless fetching, suggesting client-side rendering or aggressive bot-protection (Cloudflare/similar)

**Best guess: Angular (v12+)** — common in airline/travel industry enterprise applications. Alternatively Vue.js 2/3.

### CMS
- **Custom CMS or Contentful/similar headless CMS** — blog content (Travel News, Press Release) is managed through a CMS with slugified URLs
- Blog URLs follow pattern: `/en-eg/{article-slug}` e.g. `/en-eg/the-red-sea-you-ll-never-want-to-leave`

### Booking Engine
- Likely a **third-party GDS** (Global Distribution System) — Amadeus, Sabre, or Navitaire
- Booking flow redirects or iframes to a separate booking engine domain
- The flight search widget is a front-end form that POSTs to their booking system

### Styling
- Likely **custom CSS** or a CSS framework (Bootstrap/custom)
- No evidence of Tailwind utility classes in the URL/content
- Possibly SASS/SCSS for styling

### CDN / Infrastructure
- **Cloudflare** (very likely) — explains why direct fetching returns 38-byte error responses (Cloudflare bot protection)
- Static assets likely served from a CDN
- Images served from `aircairo.com` directly or a CDN subdomain

### Analytics
- Google Analytics / Google Tag Manager (standard)
- Facebook Pixel (likely for ad retargeting)

### Fonts
- **Google Fonts** — "Cairo" font (self-named after the city, matches brand)
- Font loaded via `<link>` to fonts.googleapis.com

---

## Our Next.js Clone Tech Stack

### Framework
```
Next.js 16 (App Router)
React 19
TypeScript strict mode
```

### UI Components
```
shadcn/ui (Radix UI primitives)
Tailwind CSS v4 (utility-first)
cn() utility from lib/utils.ts
```

### Key Libraries
| Package | Purpose |
|---------|---------|
| `next` (v16) | Framework with App Router |
| `react` (v19) | UI library |
| `typescript` | Type safety |
| `tailwindcss` (v4) | Styling |
| `@radix-ui/*` (via shadcn) | Accessible UI primitives |
| `lucide-react` | Default icon set |
| `clsx` + `tailwind-merge` | Class merging utility |
| `next/font` | Font optimization |
| `next/image` | Image optimization |

### Font Strategy
```tsx
// app/layout.tsx
import { Cairo } from 'next/font/google'

const cairo = Cairo({
  subsets: ['latin', 'arabic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-cairo',
  display: 'swap',
})
```

### Image Strategy
- All destination images: `next/image` with `fill` prop for hero backgrounds
- Images stored in `/public/images/`
- WebP format preferred
- `sizes` prop for responsive images
- `priority` on hero image for LCP optimization

### i18n Strategy
For the clone, we'll handle the `en-eg` locale:
```
/app/
  [lang]-[country]/     ← optional, or just hardcode en-eg for MVP
    homepage/
      page.tsx
    book-flight/
      page.tsx
    ...
```

Or simpler approach: clone the `en-eg` homepage only at `/`:
```
/app/
  page.tsx       ← clones /en-eg/homepage
  layout.tsx     ← shared layout
```

### State Management
- **React state** (`useState`, `useReducer`) for flight search widget
- **URL params** for search state persistence
- No external state library needed for homepage

### Animation Strategy
| Original Site | Our Clone |
|--------------|-----------|
| CSS transitions | Tailwind CSS transitions |
| Carousel animation | CSS scroll-snap + Tailwind |
| Hover effects | Tailwind hover: utilities |
| Nav dropdown | CSS transitions via shadcn |

---

## File Structure (Planned)

```
src/
├── app/
│   ├── layout.tsx              ← Root layout (html, body, fonts)
│   ├── globals.css             ← Tailwind + Air Cairo design tokens
│   ├── page.tsx                ← Homepage (en-eg/homepage clone)
│   ├── book-flight/
│   │   └── page.tsx
│   ├── my-booking/
│   │   └── page.tsx
│   ├── travel-news/
│   │   └── page.tsx
│   └── ...
│
├── components/
│   ├── ui/                     ← shadcn/ui primitives
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── select.tsx
│   │   └── ...
│   │
│   ├── layout/
│   │   ├── Navbar.tsx          ← Top navigation
│   │   ├── NavDropdown.tsx     ← Nav dropdown menu
│   │   ├── Footer.tsx          ← Site footer
│   │   └── MobileMenu.tsx      ← Mobile navigation drawer
│   │
│   ├── home/
│   │   ├── HeroBanner.tsx          ← Hero + FlightSearchWidget
│   │   ├── FlightSearchWidget.tsx  ← Search form
│   │   ├── SpecialOffers.tsx       ← Deals carousel
│   │   ├── DestinationsSection.tsx ← Destinations grid
│   │   ├── TravelNewsSection.tsx   ← Blog card grid
│   │   ├── FlyingService.tsx       ← Quick service links
│   │   └── MobileAppBanner.tsx     ← App download CTA
│   │
│   └── icons.tsx               ← Custom SVG icons as React components
│
├── lib/
│   └── utils.ts                ← cn() and helpers
│
├── types/
│   ├── navigation.ts           ← Nav types
│   └── flights.ts              ← Flight/offer types
│
└── hooks/
    ├── useFlightSearch.ts      ← Flight search state
    └── useNavScroll.ts         ← Navbar scroll behavior

public/
├── images/
│   ├── logo.svg                ← Air Cairo logo
│   ├── hero/                   ← Hero background images
│   ├── destinations/           ← Destination photos
│   └── ...
├── videos/                     ← (if any video backgrounds)
└── seo/
    ├── favicon.ico
    └── og-image.png
```

---

## Key Implementation Notes

### Navbar
```tsx
// Transparent on hero, white on scroll
const [isScrolled, setIsScrolled] = useState(false)

useEffect(() => {
  const handleScroll = () => setIsScrolled(window.scrollY > 80)
  window.addEventListener('scroll', handleScroll)
  return () => window.removeEventListener('scroll', handleScroll)
}, [])

<nav className={cn(
  "fixed top-0 w-full z-50 transition-all duration-300",
  isScrolled ? "bg-white shadow-md" : "bg-transparent"
)} />
```

### Flight Search Widget
- The actual booking goes to a third-party GDS — for the clone, the form submits to a placeholder or Next.js API route
- Tab state managed with `useState`
- Date pickers: use shadcn Calendar or a lightweight date picker

### Hero Carousel
- Cycle through 3–5 hero images with `setInterval`
- Fade transition using Tailwind `transition-opacity`

### Offers Carousel
- CSS `scroll-snap-type: x mandatory` for smooth native scrolling
- Or use a lightweight carousel lib like `embla-carousel`

### Language Switch
- For MVP: hardcode `en-eg`, add lang switcher as visual element only
- For full implementation: Next.js `i18n` config or next-intl library

---

## Design Token Migration (Original → Tailwind v4)

```css
/* globals.css additions */
:root {
  /* Air Cairo Brand */
  --color-brand-red: oklch(0.44 0.22 27.3);      /* #CE1126 */
  --color-brand-red-dark: oklch(0.37 0.20 27.3); /* #A50D1F */
  --color-brand-dark: oklch(0.17 0.03 265);       /* #1A1A2E */
  --color-brand-navy: oklch(0.18 0.07 249);       /* #002147 */
  
  /* Override shadcn primary with Air Cairo red */
  --primary: oklch(0.44 0.22 27.3);              /* brand red */
  --primary-foreground: oklch(1 0 0);             /* white */
  
  /* Font */
  --font-sans: 'Cairo', 'Open Sans', ui-sans-serif, system-ui, sans-serif;
}
```

---

## Performance Targets

| Metric | Target |
|--------|--------|
| LCP | < 2.5s |
| FID / INP | < 100ms |
| CLS | < 0.1 |
| Lighthouse Score | ≥ 90 |
| First paint | < 1s |

### Optimizations
- Hero image: `priority` prop, preload, WebP format
- Fonts: `next/font` with `display: 'swap'`, `preload: true`
- Images: `next/image` with proper `sizes` attribute
- Code splitting: automatic via App Router
- CSS: Tailwind v4 purges unused styles automatically

---

## External Integrations to Mock

| Integration | Original | Clone Approach |
|-------------|----------|----------------|
| Flight booking | Third-party GDS | Form with mock submit |
| Seat map | Third-party widget | Static UI mock |
| Online check-in | External system | Static page |
| Egypt E-Visa | External redirect | Redirect disclaimer modal |
| Airport transfer | External partner | Redirect disclaimer |
| Car rental | External partner | Redirect disclaimer |
| Flight status | Live API | Mock data or static page |

---

## Dependencies to Install

```bash
# Core (already in package.json)
next, react, react-dom, typescript

# UI (already in package.json)
tailwindcss, @shadcn/ui, lucide-react

# Additional for this clone
npm install embla-carousel-react    # Carousel (optional)
npm install date-fns                 # Date utilities for date picker
```

> Check `node_modules/next/dist/docs/` for Next.js 16 specific APIs before implementing.
