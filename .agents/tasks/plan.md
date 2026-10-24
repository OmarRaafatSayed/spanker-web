# Implementation Plan — Landing Page Redesign + AI Trip Planner

## Codebase discoveries

- **Framework:** Next.js 16.3 (App Router) + Tailwind v4 + framer-motion v13 + lucide-react v1.6 + next-intl v4
- **i18n system:** Custom `useI18n()` from `@/lib/i18n/context` → `{ locale, t, isRTL, toggleLocale }`. The `t` object is typed from `translations.ts`. Translation keys for the hero live at `t.hero.slides[n].headline` and `.sub`. For Arabic detection use `const isAr = locale === "ar"`.
- **Brand colors:** `BRAND_COLORS` from `@/lib/brand/colors` — green #3D6833, yellow #FDD12A, white #FBFDFD, blue #2473BC. Also available as Tailwind tokens: `brand-green`, `brand-yellow`, `brand-white`, `brand-blue`, `brand-green-dark` #2d5128, `brand-green-light` #4d7d43.
- **`cn` helper:** `import { cn } from "@/lib/utils"` — standard clsx + tailwind-merge.
- **`FlightSearchWidget`:** Lives at `src/components/home/FlightSearchWidget.tsx`. Takes zero props. Must NOT be modified. Its internal dark-glass styles are intentionally for the old dark hero. We remove its import from HeroBanner — we do not touch the file itself.
- **`LoyaltyBanner`:** Already exists at `src/components/home/LoyaltyBanner.tsx` — shows sign-up points promo on the main page. This satisfies user message 4 (points banner). It should remain untouched.
- **Main page:** `src/app/page.tsx` — renders `<HeroBanner />` followed by `<LoyaltyBanner />`. We do not modify `page.tsx`.
- **Images available:** `/images/hero/hero-1.jpg`, `/images/offers/luxor.jpg`, `/images/offers/aswan.jpg`, `/images/offers/hurghada.jpg`, `/images/offers/sharm.jpg`, `/images/offers/marsa-alam.jpg`, `/images/offers/alexandria.jpg`. Cairo: use `/images/offers/hurghada.jpg` as fallback. Dahab: same fallback.
- **AI trip planner page location:** `src/app/[locale]/ai-trip-planner/page.tsx` — the `[locale]` folder currently has only `layout.tsx`. The layout uses next-intl (`NextIntlClientProvider`) and accepts `params: Promise<{locale}>`. Since we mark our page `'use client'` it won't call `getMessages()` — that's fine; the layout wraps it.
- **Build/typecheck commands:** `npm run typecheck` (`tsc --noEmit`) and `npm run build`. TypeScript errors are soft (`ignoreBuildErrors: true`) but we still write clean types.
- **No test framework configured** for UI components; verification is build + typecheck.

---

## Dependencies analysis (no new packages needed)

All required libraries are already in `package.json`:
- `framer-motion` ✓ (AnimatePresence, motion, useScroll, useTransform)
- `lucide-react` ✓ (all icons)
- `next/image` ✓
- `next/navigation` ✓ (`useRouter`)
- `react` 19 ✓ (useState, useEffect, useRef)

---

## Implementation Plan

- [ ] 1. **Create `NewFlightSearchCard` component**

  White Kiwi-style flight search card with trip-type chips row, field row (From/To/Departure/Return), and Explore button flush right. All state is self-contained. No external dependencies beyond `useI18n`, `BRAND_COLORS`, and `cn`.

  **Decisions:**
  - Use inline Arabic/English string literals (`isAr ? '...' : '...'`), not `t.*` keys, as instructed.
  - `From` field defaults to `isAr ? 'القاهرة' : 'Cairo'` and renders as a green pill with × dismiss. After dismiss, shows a plain text input.
  - `Return` date field only renders when `tripType === 'return'`, wrapped in `AnimatePresence`.
  - Explore button triggers `window.location.href = /en-eg/book-flight?from=${from}&to=${to}` (using `/en-eg/book-flight` which is the real flight route found at `src/app/en-eg/book-flight/page.tsx`; the task spec said `/en-eg/flights` but that doesn't exist — use the actual route `/en-eg/book-flight`).
  - Passenger counter chip opens an inline dropdown (same pattern as FlightSearchWidget but styled for light bg).
  - Travel class chip likewise.

  **Files to create:**
  - `src/components/home/NewFlightSearchCard.tsx`

  **Verify:** `npm run typecheck` — no new TypeScript errors in this file.

---

- [ ] 2. **Create `AiTripWidget` component**

  Teaser card shown in the AI tab of the new HeroBanner. White card with suggestion chips, free-text input + search button, and a CTA that navigates to `/ai-trip-planner`. Uses `useRouter` from `next/navigation`.

  **Decisions:**
  - The CTA uses `router.push('/ai-trip-planner')` (no locale prefix) — the root page.tsx lives at `src/app/page.tsx` which is locale-agnostic. The trip planner page will live under `src/app/[locale]/ai-trip-planner/page.tsx` — we'll also add a non-locale route at `src/app/ai-trip-planner/page.tsx` as a redirect shim (see item 3b).
  - Actually, since `router.push` works relative to current locale context, and the page lives at `[locale]/ai-trip-planner`, the push will target the correct locale path automatically when called from within the locale-aware tree. For root pages (served at `/`), we push `/ai-trip-planner` and rely on next-intl middleware routing. Decision: push `/ai-trip-planner` and let middleware handle locale.
  - Search submit: `router.push('/en-eg/book-flight?q=' + encodeURIComponent(value))`.
  - Suggestion chips fill the textarea on click.

  **Files to create:**
  - `src/components/home/AiTripWidget.tsx`

  **Verify:** `npm run typecheck` — no new errors.

---

- [ ] 3. **Create AI Trip Planner page**

  7-step wizard at `src/app/[locale]/ai-trip-planner/page.tsx`. All wizard state via `useState`. Framer Motion `AnimatePresence` for slide transitions (direction-aware: slide left when advancing, right when going back). Step 1 shows the points reward banner (yellow callout, `bg-yellow-50 border border-yellow-200`) in addition to the group-type selector.

  **Interfaces** (defined at top of file, no `any`):
  ```ts
  TripSelections, DayPlan, TripPlan
  ```
  exactly as specified in the task.

  **Data constants** (defined as `const` objects in the file, not exported):
  - `HOTELS`, `ACTIVITIES`, `HOTEL_COSTS`, `FLIGHT_COSTS`, `ACTIVITIES_DAILY` — exact values from task spec.

  **`generateItinerary(sel: TripSelections): TripPlan`** — pure function (no async, no API):
  - Distributes days: `baseDays = Math.floor(sel.days / n)`, remainder to first destination.
  - For each day of each destination: picks activities cyclically from `ACTIVITIES[dest]`.
  - Morning = activity[0 mod len], Afternoon = activity[1 mod len], Evening = activity[2 mod len] or `'Dinner at local restaurant'`.
  - Hotel = `HOTELS[dest][budgetTier ?? 'standard']`.
  - Cost per day: `HOTEL_COSTS[tier] + ACTIVITIES_DAILY[tier]`.
  - `flightCost = FLIGHT_COSTS[tier] * sel.adults + FLIGHT_COSTS[tier] * 0.75 * sel.children`.
  - `totalCost = flightCost + hotelCost + activitiesCost`.

  **Step routing:** single `currentStep` number (1–7) in state. Also `direction` state (`1` = forward, `-1` = backward) for AnimatePresence slide direction.

  **Step 7 "Save Plan":** `onClick` calls `alert(isAr ? 'قريباً' : 'Coming soon')` — simple and safe for MVP.

  **Page bg:** `#FBFDFD` via `style={{ background: BRAND_COLORS.white }}`.

  **Destination images** (all exist in `/images/offers/`):
  - Cairo → `/images/offers/hurghada.jpg` (fallback, no cairo.jpg)
  - Luxor → `/images/offers/luxor.jpg`
  - Aswan → `/images/offers/aswan.jpg`
  - Hurghada → `/images/offers/hurghada.jpg`
  - Sharm el-Sheikh → `/images/offers/sharm.jpg`
  - Marsa Alam → `/images/offers/marsa-alam.jpg`
  - Alexandria → `/images/offers/alexandria.jpg`
  - Dahab → `/images/offers/hurghada.jpg` (fallback)

  **Files to create:**
  - `src/app/[locale]/ai-trip-planner/page.tsx`

  **Verify:** `npm run typecheck` — no errors in this file. `npm run build` — page included in build output.

---

- [ ] 4. **Full rewrite of `HeroBanner.tsx`**

  Replace the existing dark-bg hero with a light mint-tinted design. Keep the `AnimatedHeadline` sub-component but change text color from `text-white` to the dark `#1a2e1a`. Add the tab switcher (Search | AI Trip Planner). Conditionally render `<NewFlightSearchCard />` or `<AiTripWidget />` based on `activeTab` state.

  **Specific changes from existing file:**
  - Remove `import { FlightSearchWidget }` — no longer used in this component.
  - Add `import { NewFlightSearchCard } from "./NewFlightSearchCard"`.
  - Add `import { AiTripWidget } from "./AiTripWidget"`.
  - Section background: `style={{ background: '#d4ede8' }}` (mint tint) instead of `#0f1a0b`.
  - Geometric decoration: 4–5 `<div>` elements positioned absolutely, rounded, background `#3D683318` (10% opacity green), varying sizes/positions in top-right quadrant, `pointer-events-none aria-hidden`.
  - Desktop grid: `gridTemplateColumns: '58% 42%'` (was `60% 40%`).
  - `AnimatedHeadline` className: change `text-white` → `text-[#1a2e1a]`.
  - Brand pill: change dark glassmorphism style → light style: `bg-green-50 border-green-200 text-[#3D6833]`.
  - Eyebrow `<p>`: change color from `${BRAND_COLORS.yellow}90` → `#4a6a4a`.
  - Sub `<p>`: change `text-white/55` → `text-[#4a6a4a]`.
  - Remove trust badges row (the "⭐ · ✈ · 🛡" pills) from left column — replaced by the tab widgets.
  - Add `activeTab` state: `useState<'search' | 'ai'>('search')`.
  - Add tab switcher JSX below `AnimatedHeadline`+sub section.
  - Replace `<FlightSearchWidget />` calls with conditional `{activeTab === 'search' ? <NewFlightSearchCard /> : <AiTripWidget />}`.
  - Add trust bar below widget: `'✈ No membership fees · No hidden charges ✈'` small text `#4a6a4a`, centered.
  - Keep slide dots (unchanged logic, change dot colors: active → `#3D6833` instead of yellow, inactive → `#3D683340`).
  - Right column `FloatCard` components: change dark glassmorphism style to white glassmorphism: `bg-white shadow-xl rounded-2xl border border-gray-100`. Icon circle: `bg-[#3D6833]/10` with green icon. Text: `text-gray-900` for value, `text-gray-500` for label.
  - Right column image container: change `rounded-s-[3rem]` rounded panel to `rounded-2xl overflow-hidden h-[70vh]`.
  - Remove dark scrim from right column image (`bg-gradient-to-l from-transparent via-black/20 to-black/60`) — background is now light so we don't want a dark overlay.
  - Mobile layout: keep stacked design with image-as-background + dark overlay (this is acceptable for mobile since the image covers the full screen — spec says "Mobile: stacked, image as background with dark overlay"). Update mobile widget to also use tab switcher.
  - Remove `useScroll` / `useTransform` parallax on image if desired — keep it as it's a nice detail.
  - Keep `ScrollHint` chevron at bottom.

  **Files to modify:**
  - `src/components/home/HeroBanner.tsx` — full rewrite

  **Verify:** `npm run typecheck && npm run build` — build succeeds, no type errors.

---

## Execution order

Items 1 and 2 must come before item 4 (HeroBanner imports them). Item 3 is independent of 1, 2, 4 and can be done in any order but logically placed third. Item 4 is last as it depends on 1 and 2.

Recommended order: **1 → 2 → 3 → 4**.

---

## Notes & assumptions

1. **`/en-eg/flights` route does not exist.** The actual flight search route is `/en-eg/book-flight`. The Explore button in `NewFlightSearchCard` and the search submit in `AiTripWidget` should use `/en-eg/book-flight` not `/en-eg/flights`.

2. **`LoyaltyBanner` already satisfies user message 4** (points earned on registration). It already shows "100 points on signup" with a prominent sign-up CTA. No new loyalty component is needed on the main page. The AI Trip Planner wizard (step 1) additionally shows the yellow callout banner as a secondary touch-point per the task spec.

3. **`src/app/[locale]/ai-trip-planner/page.tsx`** — the `[locale]` directory only contains `layout.tsx`. Creating a sub-folder `ai-trip-planner/` is straightforward. The layout wraps it with `NextIntlClientProvider` which is fine even for a `'use client'` page.

4. **No `t.*` keys** were added for the new components — they use inline EN/AR strings as specified. The `translations.ts` file is not modified.

5. **`next/navigation` `useRouter`** is available in `'use client'` components for the `router.push()` calls in `AiTripWidget` and the trip planner page.

6. **Framer Motion** `AnimatePresence` + slide direction in the wizard: use `x: direction * 60` initial and `x: direction * -60` exit for the slide effect.

7. **Step 7 "Save Plan (PDF)"** → `alert(isAr ? 'قريباً' : 'Coming soon')` — no toast library needed, keeps MVP simple.
