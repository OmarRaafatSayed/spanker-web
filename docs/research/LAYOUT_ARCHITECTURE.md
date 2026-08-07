# Air Cairo — Layout Architecture

> Researched via sitemap.xml, search snippet analysis, and industry-standard airline website patterns.
> Target: https://aircairo.com/en-eg/homepage

---

## Page Sections (Top → Bottom Order)

```
┌─────────────────────────────────────────────────┐
│  1. NAVBAR (sticky, full-width)                  │
│     Logo | Navigation Links | Lang/Country       │
├─────────────────────────────────────────────────┤
│  2. HERO BANNER (full-width, ~90–100vh)          │
│     Background image + overlay                   │
│     Headline text (carousel/rotates)             │
│     ┌───────────────────────────────┐            │
│     │  FLIGHT SEARCH WIDGET         │            │
│     │  (One Way / Round Trip / Multi│            │
│     │   From | To | Date | Pax)     │            │
│     └───────────────────────────────┘            │
├─────────────────────────────────────────────────┤
│  3. FLYING SERVICE QUICK LINKS                   │
│     (Egypt E-Visa | Seat Res. | Status | Bag)   │
├─────────────────────────────────────────────────┤
│  4. SPECIAL OFFERS                               │
│     Horizontal carousel of route deal cards      │
├─────────────────────────────────────────────────┤
│  5. DESTINATIONS SECTION                         │
│     Featured destination image grid/cards        │
├─────────────────────────────────────────────────┤
│  6. TRAVEL NEWS / BLOG TEASERS                  │
│     3-up grid of article cards                   │
├─────────────────────────────────────────────────┤
│  7. MOBILE APP DOWNLOAD BANNER                  │
│     Dark bg, app store buttons, phone mockup     │
├─────────────────────────────────────────────────┤
│  8. SUBSCRIBE NEWSLETTER (optional)             │
├─────────────────────────────────────────────────┤
│  9. FOOTER (full-width, dark)                    │
│     4-column links + social + legal              │
└─────────────────────────────────────────────────┘
```

---

## Grid System

### Container
- Max-width: `1280px` (or `1440px` for wider screens)
- Horizontal padding: `16px` (mobile) → `32px` (tablet) → `48px` (desktop)
- Centered with `margin: 0 auto`

### Columns
| Breakpoint | Columns | Gutter |
|------------|---------|--------|
| Mobile (`< 768px`) | 1–2 | 16px |
| Tablet (`768px–1024px`) | 2–3 | 24px |
| Desktop (`> 1024px`) | 4–6 | 32px |

---

## Section-by-Section Layout Details

### 1. Navbar Layout
```
Desktop:
┌────┬──────────────────────────────┬────────────┐
│LOGO│ Book | Check-in | Travel Info | EN|EG ▼   │
└────┴──────────────────────────────┴────────────┘
Height: ~72–80px
Position: sticky top-0
Background: white / transparent on hero top
Shadow: on scroll

Mobile:
┌────┬────────────────────────────┬──────────────┐
│LOGO│                            │ ☰ (hamburger)│
└────┴────────────────────────────┴──────────────┘
Height: ~60px
Mobile menu: full-screen overlay or right drawer
```

### 2. Hero Section Layout
```
Full width: 100vw
Height: 100vh or min-height 600px
Background: full-bleed photographic image
Text alignment: center or left
Text position: upper 40–60% of hero

┌─────────────────────────────────────────────────┐
│                                                 │
│  [HERO TEXT — top center/left]                  │
│  "It's time for Aswan, Luxor, and Abu Simbel..." │
│                                                 │
│  ┌─────────────────────────────────────────┐    │
│  │  Flight Search Widget (white card)       │    │
│  │  positioned: bottom of hero or floating  │    │
│  └─────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘

FlightSearchWidget: 
  - white background card
  - border-radius: 12–16px
  - box-shadow: 0 8px 32px rgba(0,0,0,0.15)
  - max-width: 900–1100px
  - centered
  - positioned: absolute bottom ~-40px or inline after hero
```

### 3. Flying Service Quick Links
```
Background: white or very light gray
Height: ~100–120px
Layout: horizontal row of icon+text links, centered

Mobile: 2×2 grid
Desktop: 1×4 row

┌───────────┬───────────┬──────────────┬────────────┐
│ E-Visa ✈  │ Seat Res. │ Flight Status│ Add Bag 🧳 │
└───────────┴───────────┴──────────────┴────────────┘
```

### 4. Special Offers Section
```
Background: white
Padding: 64px 0

Header:
┌─────────────────────┬──────────────┐
│ "Special Offers" H2 │ "View All →" │
└─────────────────────┴──────────────┘

Carousel: horizontal scroll (overflow-x: hidden with JS scroll)
Card width: ~280–320px
Gap between cards: 20–24px

OfferCard:
┌──────────────────┐
│ [Route Header]   │
│  Cairo → Luxor   │
│  ✈               │
│ "From EGP 3,200" │
│ [Book Now →]     │
└──────────────────┘
```

### 5. Destinations Section
```
Background: white or light
Padding: 64px 0

Grid: 3–4 columns desktop, 2 tablet, 1 mobile
Each card: full image with text overlay at bottom

DestinationCard:
┌──────────────────┐
│                  │
│   [City Photo]   │
│                  │
│ ▓▓▓ "Hurghada"  │  ← dark gradient overlay, text at bottom
│    "From EGP X" │
└──────────────────┘
```

### 6. Travel News Section
```
Background: alternate (#F7F7F7) or white
Padding: 64px 0

Grid: 3 columns desktop, 2 tablet, 1 mobile

NewsCard:
┌──────────────────┐
│  [Article Image] │
│  Category  Date  │
│  Article Title   │
│  Short excerpt   │
│  [Read More →]   │
└──────────────────┘
```

### 7. Mobile App Banner
```
Background: dark navy (#1A1A2E) or red gradient
Padding: 80px 0

Desktop: 2-column split
┌──────────────────────┬───────────────────┐
│ Text + App Buttons   │  Phone Mockup     │
│ "Download Our App"   │  [Screenshot]     │
│ [App Store]          │                   │
│ [Google Play]        │                   │
└──────────────────────┴───────────────────┘

Mobile: stacked
Text + Buttons → Phone Mockup (below)
```

### 8. Footer Layout
```
Background: #1A1A2E (dark navy)
Color: white text

┌─────────────────────────────────────────────────┐
│ FooterTop: Logo + Social Icons                  │
├──────────┬──────────┬──────────┬────────────────┤
│ Book &   │ Travel   │ Air      │ Help &         │
│ Manage   │ Info     │ Cairo    │ Contact        │
│          │          │          │                │
│ Book     │ Baggage  │ About    │ FAQs           │
│ My Book. │ Sp. Asst.│ Mission  │ Offices        │
│ Check-in │ Pets     │ Fleet    │ Feedback       │
│ Seats    │ Children │ Route Map│ Claims         │
│ F.Status │ Visa     │ Charter  │ Refund         │
├──────────┴──────────┴──────────┴────────────────┤
│ © Air Cairo | Privacy | Cookies | T&C | Notices │
└─────────────────────────────────────────────────┘

Mobile: accordion/stacked columns
```

---

## Responsive Behavior

### Navbar
- **Desktop (≥1024px):** Horizontal nav with hover dropdowns
- **Tablet/Mobile (<1024px):** Logo + hamburger, slide-in or full-overlay drawer

### Flight Search Widget
- **Desktop:** Single horizontal row (all fields in one line)
- **Tablet:** 2 rows (From/To/Swap on row 1, Dates/Pax/Search on row 2)
- **Mobile:** Stacked vertical (each field full-width, stacked)

### Special Offers Carousel
- **Desktop:** Shows 3–4 cards
- **Tablet:** Shows 2 cards
- **Mobile:** 1 card visible, swipe to navigate

### Destinations Grid
- **Desktop:** 4 columns
- **Tablet:** 2 columns
- **Mobile:** 1 column (full width)

### Travel News Grid
- **Desktop:** 3 columns
- **Tablet:** 2 columns
- **Mobile:** 1 column

### Footer
- **Desktop:** 4-column horizontal grid
- **Tablet:** 2-column grid
- **Mobile:** Accordion-style collapsible sections

---

## Sticky / Fixed Elements

| Element | Behavior |
|---------|----------|
| Navbar | `position: sticky; top: 0; z-index: 200` |
| Cookie Banner | `position: fixed; bottom: 0; z-index: 500` |
| Back-to-top button | `position: fixed; bottom: 32px; right: 32px` (appears after scroll) |

---

## RTL / i18n Layout Considerations

- Arabic (`ar-*`) routes use RTL layout: `dir="rtl"`
- Text alignment flips: left → right
- Navigation order reverses
- Icon directions flip (chevrons, arrows)
- Font switches to Arabic variant of Cairo font
- URL structure: `/ar-eg/`, `/ar-sa/`, etc.

---

## URL / Routing Structure

```
/{lang}-{country}/{page}

Examples:
  /en-eg/homepage       → Egypt (English)
  /ar-eg/homepage       → Egypt (Arabic, RTL)
  /fr-ma/homepage       → Morocco (French)
  /en-sa/homepage       → Saudi Arabia (English)
  /en-de/homepage       → Germany (English)

Page slugs:
  /homepage
  /book-flight
  /my-booking
  /check-in-online  OR  /online-check-in
  /airport-check-in
  /flight-status
  /special-offers
  /route-map
  /on-board
  /our-fleet
  /about-air-cairo
  /mission-vision
  /travel-news
  /travel-news-detail
  /air-cairo-travel-blog
  /faqs
  /office-contacts
  /baggage
  /seat-selection
  /excess-baggage
  /charter-flights
  /privacy-policy
  /cookies
  /condition-of-carriage
  /termsandconditions
  /ticket-notices
  /refund
  /claims
  /customer-feedback
  /visa-and-health
  /press-release
  /subscribe-form
  /nbe-offer
  /discover-cars
```

---

## Animation / Transition Patterns

| Element | Animation |
|---------|-----------|
| Nav dropdown | Fade in + slide down (150–200ms ease) |
| Hero carousel | Cross-fade or slide (auto-advance ~5s) |
| Offer cards carousel | CSS scroll-snap or JS slider |
| CTA button hover | Background darken (100ms) |
| Cards hover | `transform: translateY(-4px)` + shadow increase (200ms) |
| Mobile menu | Slide from right or fade (250ms) |
| Modals | Fade overlay + scale/slide modal (200ms) |
| Page transitions | None (standard SPA navigation) |
