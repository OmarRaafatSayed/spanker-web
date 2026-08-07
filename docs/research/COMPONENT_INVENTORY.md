# Air Cairo — Component Inventory

> Based on: sitemap.xml analysis, Google/search snippet content, Air Cairo page structure across multiple locale URLs.
> Target: https://aircairo.com/en-eg/homepage

---

## Component Map

### 1. `<Navbar>` — Top Navigation Bar

**Position:** Fixed/sticky at top of page
**Background:** White with bottom shadow on scroll; transparent over hero

**Structure:**
```
Navbar
├── Logo (Air Cairo SVG — left aligned)
├── LanguageCountrySwitcher (e.g. "EN | EG" — far left or right)
├── PrimaryNav (horizontal list — desktop)
│   ├── NavItem: "Book" (dropdown)
│   │   ├── "Book a Flight" → /en-eg/book-flight
│   │   └── "My Booking" → /en-eg/my-booking
│   ├── NavItem: "Check-in" (dropdown)
│   │   ├── "Online Check-in" → /en-eg/check-in-online  (or /en-eg/online-check-in)
│   │   └── "Airport Check-in" → /en-eg/airport-check-in
│   ├── NavItem: "Travel Info" (dropdown)
│   │   ├── "Baggage" → /en-eg/baggage
│   │   ├── "Seat Selection" → /en-eg/seat-selection
│   │   ├── "Flight Status" → /en-eg/flight-status
│   │   ├── "Route Map" → /en-eg/route-map
│   │   ├── "Visa & Health" → /en-eg/visa-and-health
│   │   └── "Travel Safely" → /en-eg/travel-safely
│   ├── NavItem: "Destinations & Offers" (dropdown)
│   │   ├── "Special Offers" → /en-eg/special-offers
│   │   └── "Charter Flights" → /en-eg/charter-flights
│   ├── NavItem: "Experience" (dropdown)
│   │   ├── "On Board" → /en-eg/on-board
│   │   └── "Our Fleet" → /en-eg/our-fleet
│   └── NavItem: "About" (dropdown)
│       ├── "About Air Cairo" → /en-eg/about-air-cairo
│       ├── "Mission & Vision" → /en-eg/mission-vision
│       ├── "Travel News" → /en-eg/travel-news
│       ├── "Press Release" → /en-eg/press-release
│       ├── "Office Contacts" → /en-eg/office-contacts
│       └── "FAQs" → /en-eg/faqs
└── MobileMenuToggle (hamburger — mobile only)
```

**Flying Service quick-links** (secondary nav strip or within dropdown):
- Egypt E-Visa
- Seat Reservation
- Flight Status
- Add Extra Bag

**Variants:**
- Desktop: horizontal with dropdowns on hover
- Mobile: hamburger → full-screen or side-drawer menu

---

### 2. `<HeroBanner>` — Full-Width Hero with Flight Search

**Position:** Below navbar, full viewport height or ~70vh
**Background:** Full-width photographic image (destination/aircraft) with dark overlay gradient

**Content:**
```
HeroBanner
├── BackgroundImage (parallax or static — destination/aircraft)
├── DarkOverlay (gradient: rgba(0,0,0,0.4–0.6))
├── HeroContent (centered or left-aligned text)
│   ├── HeroTagline (e.g. "It's time for Aswan, Luxor, and Abu Simbel...")
│   │               (or "Your trip to Marsa Alam starting only from 207 USD!")
│   │               (or "Discover Budapest in Autumn Starting From 6481 EGP!")
│   └── HeroSliderDots or Arrows (if rotating hero)
└── FlightSearchWidget (overlaid on hero, bottom half)
    ├── TabBar: ["One Way", "Round Trip", "Multi-City"]
    ├── Row 1:
    │   ├── FromInput (airport search autocomplete)
    │   ├── SwapButton (↔ icon)
    │   ├── ToInput (airport search autocomplete)
    │   ├── DepartureDatePicker
    │   ├── ReturnDatePicker (disabled for One Way)
    │   └── PassengersSelector (adults/children/infants)
    └── SearchButton ("Search Flights" — red CTA)
```

**Known Hero Slogans / Text (from search snippets):**
- "It's time for Aswan, Luxor, and Abu Simbel..."
- "Your trip to Marsa Alam starting only from 207 USD!"
- "Discover Budapest in Autumn Starting From 6481 EGP!"
- "Visit Egypt and create memories that will last a lifetime!"
- "The Red Sea, you'll never want to leave!"

---

### 3. `<FlightSearchWidget>` (standalone component)

**Also used as:** Embedded in hero, and as full page on /en-eg/book-flight

**Structure:**
```
FlightSearchWidget
├── TripTypeTabs
│   ├── Tab: "One Way"
│   ├── Tab: "Round Trip" (default)
│   └── Tab: "Multi-City"
├── SearchForm
│   ├── AirportInput (From)
│   │   ├── Icon: plane-take-off
│   │   ├── Label: "From"
│   │   ├── Input: city/airport search
│   │   └── Dropdown: autocomplete suggestions
│   ├── SwapDestinationsButton
│   ├── AirportInput (To)
│   │   ├── Icon: plane-land
│   │   ├── Label: "To"
│   │   └── Input: city/airport search
│   ├── DatePicker (Departure)
│   │   ├── Icon: calendar
│   │   ├── Label: "Departure"
│   │   └── Input: date picker
│   ├── DatePicker (Return) [hidden for One Way]
│   │   ├── Icon: calendar
│   │   ├── Label: "Return"
│   │   └── Input: date picker
│   ├── PassengersDropdown
│   │   ├── Icon: person
│   │   ├── Label: "Passengers"
│   │   └── Dropdown:
│   │       ├── Adults counter
│   │       ├── Children counter (2–11 yrs)
│   │       └── Infants counter (under 2 yrs)
│   └── SearchButton (red, "Search Flights")
└── PromoCodeInput (optional, collapsible)
```

---

### 4. `<SpecialOffersSection>` — Destination Deals Carousel

**Section title:** "Special Offers"
**Background:** White or light gray

**Known content (from en-qa/ snippet):**
```
SpecialOffersSection
├── SectionHeader
│   ├── Title: "Special Offers"
│   └── ViewAllLink → /en-eg/special-offers
├── OffersCarousel
│   └── OfferCard[] (scrollable horizontally)
│       ├── RouteInfo: "Cairo → Marsa Alam"
│       ├── PriceTag: "From QAR 350" / "From EGP X,XXX"
│       ├── FlightIcon
│       └── BookNowButton (red)
│
│   Sample routes (Egypt market):
│   - Cairo → Marsa Alam
│   - Cairo → Luxor
│   - Cairo → Aswan
│   - Cairo → Sharm el-Sheikh
│   - Cairo → Hurghada
│   - Kuwait → Alexandria
└── CarouselControls (prev/next arrows)
```

---

### 5. `<TravelNewsSection>` — Blog/News Teaser Cards

**Section title:** "Travel News" (or "Air Cairo Travel Blog")
**Background:** White or alternate light section

**Known blog articles (from sitemap):**
- "The Red Sea, you'll never want to leave!"
- "6 essentials to pack for your summer trip!"
- "Make the most out of your destination…"
- "Rest your head on a familiar headrest…"
- "Trendiest Travel Destinations to Kickstart Your Adventure in 2024!"
- "Tips and tricks for parents flying with kids"
- "Best destinations to visit in Egypt this fall"
- "Hacks for stress-free traveling on holidays"
- "8 incredible signs your mom is a real-life superhero"
- "Spring Escapes: Top 3 Blooming Destinations"
- "The Golden Journey: Why Autumn is the Perfect Time to Travel"

**Structure:**
```
TravelNewsSection
├── SectionHeader
│   ├── Title: "Travel News" or "Air Cairo Travel Blog"
│   └── ViewAllLink → /en-eg/travel-news  OR  /en-eg/air-cairo-travel-blog
└── NewsCarousel (or 3-column grid)
    └── NewsCard[]
        ├── CardImage (destination photo)
        ├── Category / Date tag
        ├── ArticleTitle
        ├── ArticleExcerpt (1–2 lines)
        └── ReadMoreLink
```

---

### 6. `<FlyingServiceSection>` — Quick Links / Services Panel

**Known content (from en-es/ snippet):**
```
FlyingServiceSection
├── SectionTitle: "Flying Service"
└── ServiceLinks[]
    ├── "Egypt E-Visa" (external redirect with disclaimer)
    ├── "Seat Reservation" → /en-eg/seat-selection
    ├── "Flight Status" → /en-eg/flight-status
    └── "Add Extra Bag" → /en-eg/excess-baggage
```
With disclaimer: "You will be redirected to another website that is not under the control of [Air Cairo]..."

---

### 7. `<DestinationsSection>` — Featured Destinations

**Section title:** "Our Destinations" or "Discover Destinations"
**Background:** Full-bleed image cards or grid

**Known destinations mentioned:**
- Marsa Alam ("The Red Sea, you'll never want to leave!")
- Aswan, Luxor, Abu Simbel (domestic Egypt)
- Budapest ("Discover Budapest in Autumn")
- Sharm el-Sheikh
- Hurghada
- Alexandria

**Structure:**
```
DestinationsSection
├── SectionHeader
│   ├── Title: "Explore Our Destinations"
│   └── ViewAllLink → /en-eg/route-map
└── DestinationGrid (3–4 columns desktop, 1–2 mobile)
    └── DestinationCard[]
        ├── HeroImage (destination photo)
        ├── DestinationName (overlay text)
        ├── Price (if offer available)
        └── ExploreButton
```

---

### 8. `<MobileAppBanner>` — App Download CTA

**Background:** Dark navy or red gradient
**Content based on:** /en-eg/travel-news-detail/the-air-cairo-mobile-app

```
MobileAppBanner
├── AppDescription: "Use the AIR CAIRO App to search and purchase flights, view flight details, select your seat..."
├── AppStoreButton (Apple App Store badge)
├── PlayStoreButton (Google Play badge)
└── AppMockup (phone screenshot image)
```

---

### 9. `<Footer>`

**Background:** Dark navy (`#1A1A2E`) with white text

**Structure:**
```
Footer
├── FooterTop
│   ├── Logo (white variant)
│   └── SocialLinks
│       ├── Facebook icon
│       ├── Instagram icon
│       ├── Twitter/X icon
│       ├── YouTube icon
│       └── LinkedIn icon (if applicable)
├── FooterColumns
│   ├── Column: "Book & Manage"
│   │   ├── Book a Flight
│   │   ├── My Booking
│   │   ├── Online Check-in
│   │   ├── Seat Selection
│   │   └── Flight Status
│   ├── Column: "Travel Info"
│   │   ├── Baggage
│   │   ├── Special & Medical Assistance
│   │   ├── Traveling with Pets
│   │   ├── Traveling with Children
│   │   └── Visa & Health
│   ├── Column: "Air Cairo"
│   │   ├── About Air Cairo
│   │   ├── Mission & Vision
│   │   ├── Our Fleet
│   │   ├── Route Map
│   │   ├── Charter Flights
│   │   └── Press Release
│   └── Column: "Help & Contact"
│       ├── FAQs
│       ├── Office Contacts
│       ├── Customer Feedback
│       ├── Claims
│       └── Refund
├── FooterBottom
│   ├── Copyright: "© [Year] Air Cairo. All rights reserved."
│   ├── PrivacyPolicyLink → /en-eg/privacy-policy
│   ├── CookiesLink → /en-eg/cookies
│   ├── ConditionOfCarriageLink → /en-eg/condition-of-carriage
│   ├── TermsLink → /en-eg/termsandconditions
│   └── TicketNoticesLink → /en-eg/ticket-notices
└── ExternalRedirectDisclaimer
    "Air Cairo will not be liable for any loss or misuse of personal data..."
```

---

### 10. `<LanguageCountrySwitcher>`

Dropdown or modal that switches between:
- Countries: EG (Egypt), SA (Saudi Arabia), KW (Kuwait), AE (UAE), QA (Qatar), JO (Jordan), MA (Morocco), DE (Germany), IT (Italy), CZ (Czech Republic), AM (Armenia), GE (Georgia), RS (Serbia), SE (Sweden), etc.
- Languages: EN (English), AR (Arabic), FR (French), IT (Italian), CZ (Czech), GR (Greek), SK (Slovak)
- URL format: `/{lang}-{country}/...` e.g. `/en-eg/`, `/ar-eg/`, `/fr-ma/`

---

### 11. `<CookieConsentBanner>`

Bottom-fixed banner:
```
CookieConsentBanner
├── Message: "We use cookies to improve your experience..."
├── AcceptButton (red)
└── LearnMoreLink → /en-eg/cookies
```

---

### 12. `<ExternalRedirectModal>`

Modal shown before redirecting to third-party sites (Egypt E-Visa, etc.):
```
ExternalRedirectModal
├── WarningIcon
├── Title: "External Website"
├── Message: "You will be redirected to another website that is not under the control of [Air Cairo]..."
├── CancelButton
└── ContinueButton (red)
```

---

### 13. `<TravelNewsHero>` — Hero for /travel-news page

Large banner with featured article image and title.

---

### 14. `<SubscribeForm>` — Newsletter Subscription

From: `/en-eg/subscribe-form`

```
SubscribeForm
├── Title: "Stay Updated" or similar
├── EmailInput
└── SubscribeButton (red)
```

---

### 15. `<FlightStatusWidget>`

From: `/en-eg/flight-status`

```
FlightStatusWidget
├── FlightNumberInput
├── DatePicker
└── CheckStatusButton
```

---

## Component States & Interactions

### FlightSearchWidget
- Tab switching (One Way / Round Trip) shows/hides Return date field
- Airport autocomplete shows dropdown with matching airports
- Date picker: calendar with departure highlighted, return must be after departure
- Passengers dropdown: increment/decrement counters with min/max limits

### SpecialOffers Carousel
- Auto-play with pause on hover
- Touch/swipe on mobile
- Prev/Next arrow buttons

### NavDropdown
- Opens on hover (desktop)
- Opens on click/tap (mobile)
- Smooth CSS transition (fade + slide down)

### OfferCard
- Hover: lift with box-shadow + slight scale
- CTA button turns darker red on hover
