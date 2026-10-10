# Implementation Plan: Flight Search Integration System

## Overview

This implementation plan breaks down the Flight Search Integration System into discrete, actionable coding tasks. The system provides real-time flight search using a hybrid approach (Google Flights scraping + Amadeus API fallback) with multi-layer caching (Redis + Supabase). Each task builds incrementally toward a complete, production-ready feature.

**Technology Stack:**
- Next.js 14 (App Router)
- TypeScript
- Supabase (PostgreSQL + Auth)
- Redis (Upstash or Redis Cloud)
- fast-flights (Google Flights scraping)
- amadeus (Amadeus API client)
- Zod (validation)
- Tailwind CSS + shadcn/ui (UI components)

## Tasks

### 1. Project Setup and Dependencies

- [ ] 1.1 Install required npm packages
  - Install `fast-flights` for Google Flights scraping
  - Install `amadeus` for Amadeus API integration
  - Install `ioredis` or `@upstash/redis` for Redis caching
  - Install `zod` if not already present
  - Update `package.json` with exact versions
  - _Requirements: 4.2, 5.2, 6.1_

- [ ] 1.2 Configure environment variables
  - Add `AMADEUS_API_KEY` to `.env.local`
  - Add `AMADEUS_API_SECRET` to `.env.local`
  - Add `AMADEUS_HOSTNAME` (production or test) to `.env.local`
  - Add `REDIS_URL` to `.env.local`
  - Add `REDIS_TOKEN` to `.env.local` (if using Upstash)
  - Document all variables in `.env.example`
  - _Requirements: 5.2, 6.1_

- [ ] 1.3 Create Supabase migration for flight_search_cache table
  - Create migration file `supabase/migrations/XXX_create_flight_search_cache.sql`
  - Define table schema:
    - `id` (UUID, primary key)
    - `search_params_hash` (TEXT, indexed)
    - `origin` (TEXT)
    - `destination` (TEXT)
    - `departure_date` (DATE)
    - `return_date` (DATE, nullable)
    - `passengers` (INT)
    - `cabin_class` (TEXT)
    - `results_json` (JSONB)
    - `source` (TEXT) - which provider returned the results
    - `created_at` (TIMESTAMPTZ)
    - `expires_at` (TIMESTAMPTZ, indexed)
  - Add index on `search_params_hash` for fast lookups
  - Add index on `expires_at` for cleanup queries
  - Run migration against local Supabase instance
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

### 2. Type Definitions and Validation Schemas

- [ ] 2.1 Define core TypeScript types
  - Create `src/types/flights.ts` with:
    - `NormalizedSearchParams` interface
    - `FlightResult` interface with all fields (id, source, price, currency, airline, departure, arrival, duration, stops, layovers, bookingUrl, cabinClass)
    - `LayoverInfo` interface
    - `FlightSearchMetadata` interface
    - `CacheResult` interface
    - Provider result types: `RawGoogleFlightsResult`, `RawAmadeusResult`
  - Export all types for use across the system
  - _Requirements: 4.4, 6.7, 15.1, 15.2_

- [ ] 2.2 Create Zod validation schemas
  - Create `src/lib/validations/flights.ts` with:
    - `RealTimeSearchSchema` - validates user search input (origin, destination, departureDate, returnDate, passengers, cabinClass)
    - Validate origin/destination as 3-letter IATA codes (regex pattern)
    - Validate passengers between 1-9
    - Validate cabinClass enum ('economy', 'business', 'first')
    - Validate dates: departureDate not in past, returnDate after departureDate
    - Validate origin !== destination
    - Add custom error messages for each validation rule
  - Export schema and inferred TypeScript type
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 14.3_

- [ ] 2.3 Update TABLES constant in schema.ts
  - Open `src/lib/db/schema.ts`
  - Add `flightSearchCache: 'flight_search_cache'` to TABLES constant
  - Ensure consistent naming convention with existing tables
  - _Requirements: 6.3, 14.7_

### 3. Cache Manager Implementation

- [ ] 3.1 Initialize Redis client singleton
  - Create `src/lib/cache/redis-client.ts`
  - Initialize Redis client using `ioredis` or `@upstash/redis`
  - Read `REDIS_URL` and `REDIS_TOKEN` from environment
  - Export singleton instance with connection pooling
  - Add error handling for connection failures
  - _Requirements: 6.1_

- [ ] 3.2 Implement FlightCacheManager class
  - Create `src/lib/cache/flight-cache-manager.ts`
  - Implement `generateCacheKey(params)` - format: `flights:{origin}:{destination}:{date}:{passengers}:{class}`
  - Implement `generateHashKey(params)` - SHA-256 hash of normalized JSON
  - Implement `lookup(params)` - checks Redis, then Supabase, returns CacheResult or null
  - Implement private `lookupRedis(params)` - queries Redis with cache key
  - Implement private `lookupSupabase(params)` - queries Supabase using hash key and expires_at filter
  - Implement `store(params, results, source)` - stores to both Redis (30min TTL) and Supabase
  - Implement private `storeRedis(params, results)` - stores JSON string with TTL
  - Implement private `storeSupabase(params, results, source)` - inserts record with expires_at timestamp
  - Implement `getExpiredCache(params)` - fallback for service unavailability
  - Use `createServerClient()` from `@/lib/supabase/server` for database operations
  - Use `TABLES.flightSearchCache` for table name
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

- [ ]* 3.3 Write unit tests for FlightCacheManager
  - Create `src/lib/cache/__tests__/flight-cache-manager.test.ts`
  - Test `generateCacheKey()` produces expected format
  - Test `generateHashKey()` is deterministic for same inputs
  - Test `generateHashKey()` produces different hashes for different inputs
  - Mock Redis and Supabase clients
  - Test `lookup()` returns null on complete cache miss
  - Test `lookup()` returns Redis result when available
  - Test `lookup()` returns Supabase result and updates Redis on Redis miss
  - Test `store()` writes to both cache layers
  - Test `getExpiredCache()` retrieves old records when nothing else available
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 6.7_

### 4. Flight Provider Adapters

- [ ] 4.1 Create FlightProviderAdapter interface
  - Create `src/lib/flight-providers/types.ts`
  - Define `FlightProviderAdapter` interface with:
    - `name: string` property
    - `search(params: NormalizedSearchParams): Promise<FlightResult[]>` method
    - `isAvailable(): Promise<boolean>` method
  - Export interface and re-export types from `src/types/flights.ts`
  - _Requirements: 4.1, 4.4, 5.1, 5.3_

- [ ] 4.2 Implement GoogleFlightsAdapter
  - Create `src/lib/flight-providers/google-flights-adapter.ts`
  - Implement class that implements `FlightProviderAdapter`
  - Set `name = 'google_flights'`
  - Implement `search(params)` method:
    - Import and call `searchFlights` from `fast-flights`
    - Map params to fast-flights format (origin, destination, departureDate, returnDate, passengers, travelClass)
    - Wrap in timeout (7 seconds) using `Promise.race()`
    - Call `normalizeResults()` to convert raw data to `FlightResult[]`
    - Throw `AppError` with appropriate status codes on failure
  - Implement private `normalizeResults(rawResults, params)` method:
    - Map raw Google Flights data to `FlightResult` interface
    - Generate unique ID: `gf-{timestamp}-{index}`
    - Set source: `'google_flights'`
    - Extract price, currency, airline, departure/arrival times, duration, stops
    - Parse layover information if available
    - Include booking URL
    - Set cabin class from params
  - Implement private `extractLayovers(raw)` helper
  - Implement `isAvailable()` - return true (simple health check)
  - Import `AppError` from `@/lib/api/errors`
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 15.1, 15.2_

- [ ] 4.3 Implement AmadeusAdapter
  - Create `src/lib/flight-providers/amadeus-adapter.ts`
  - Implement class that implements `FlightProviderAdapter`
  - Set `name = 'amadeus'`
  - Initialize Amadeus client in constructor:
    - Read `AMADEUS_API_KEY`, `AMADEUS_API_SECRET`, `AMADEUS_HOSTNAME` from environment
    - Throw error if credentials missing
    - Create Amadeus client instance
  - Implement `search(params)` method:
    - Call `client.shopping.flightOffersSearch.get()` with mapped parameters
    - Map params to Amadeus format (originLocationCode, destinationLocationCode, departureDate, returnDate, adults, travelClass, max: 50)
    - Wrap in timeout (7 seconds) using `Promise.race()`
    - Call `normalizeResults()` to convert Amadeus data to `FlightResult[]`
    - Handle Amadeus-specific errors (extract error details from response)
    - Throw `AppError` with appropriate status codes
  - Implement private `normalizeResults(rawResults, params)` method:
    - Map Amadeus offer structure to `FlightResult` interface
    - Use Amadeus offer ID as result ID
    - Set source: `'amadeus'`
    - Extract price from `price.total`, currency from `price.currency`
    - Parse itineraries and segments
    - Calculate total duration from segments
    - Extract airline code and flight number
    - Parse departure/arrival times and airports
    - Calculate stops (segments.length - 1)
    - Extract layover information
    - Generate booking URL
  - Implement private helper methods:
    - `mapCabinClass(cabinClass)` - map to Amadeus enum
    - `parseDuration(segments)` - convert ISO 8601 duration to minutes
    - `extractLayovers(segments)` - calculate layover durations
    - `calculateLayoverDuration(arrivalTime, departureTime)` - diff in minutes
    - `generateBookingUrl(offerId)` - create internal booking link
  - Implement `isAvailable()` - try simple API call, return true/false
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 15.1, 15.2_

- [ ] 4.4 Create provider index file
  - Create `src/lib/flight-providers/index.ts`
  - Export `GoogleFlightsAdapter` class
  - Export `AmadeusAdapter` class
  - Re-export `FlightProviderAdapter` and `NormalizedSearchParams` types
  - _Requirements: 4.1, 5.1_

- [ ]* 4.5 Write unit tests for GoogleFlightsAdapter
  - Create `src/lib/flight-providers/__tests__/google-flights-adapter.test.ts`
  - Mock `fast-flights` library
  - Test `search()` successfully normalizes results
  - Test `search()` handles timeout errors
  - Test `search()` handles network errors
  - Test `normalizeResults()` correctly maps all fields
  - Test layover extraction
  - _Requirements: 4.2, 4.3, 4.4, 4.6, 4.7_

- [ ]* 4.6 Write unit tests for AmadeusAdapter
  - Create `src/lib/flight-providers/__tests__/amadeus-adapter.test.ts`
  - Mock Amadeus SDK
  - Test `search()` successfully normalizes Amadeus results
  - Test `search()` handles Amadeus API errors
  - Test `search()` handles timeout errors
  - Test `normalizeResults()` correctly maps all fields
  - Test duration parsing (ISO 8601 format)
  - Test layover calculation
  - Test cabin class mapping
  - _Requirements: 5.2, 5.3, 5.4_

### 5. Search Orchestrator

- [ ] 5.1 Implement FlightSearchOrchestrator class
  - Create `src/lib/orchestration/flight-search-orchestrator.ts`
  - Implement class with constructor accepting:
    - `cacheManager: FlightCacheManager`
    - `googleFlightsAdapter: GoogleFlightsAdapter`
    - `amadeusAdapter: AmadeusAdapter`
  - Implement main `coordinateSearch(params: NormalizedSearchParams)` method:
    - Step 1: Check cache using `cacheManager.lookup(params)`
    - If cache hit: return results immediately with metadata
    - Step 2: Try Google Flights adapter
    - If success: store in cache, return results with metadata
    - If failure: log error, proceed to Step 3
    - Step 3: Try Amadeus adapter (fallback)
    - If success: store in cache, return results with metadata
    - If failure: log error, proceed to Step 4
    - Step 4: Try expired cache using `cacheManager.getExpiredCache(params)`
    - If found: return with stale=true warning
    - If not found: throw `ServiceUnavailableError`
  - Implement private `buildResponseMetadata(source, cached, stale)` helper
  - Return object with `{ results: FlightResult[], metadata: FlightSearchMetadata }`
  - Log each step for monitoring (data source used, timing)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 4.1, 4.5, 4.6, 4.7, 5.1, 5.4, 5.5, 5.6, 5.7, 10.2, 10.3, 10.4_

- [ ]* 5.2 Write unit tests for FlightSearchOrchestrator
  - Create `src/lib/orchestration/__tests__/flight-search-orchestrator.test.ts`
  - Mock all dependencies (CacheManager, adapters)
  - Test cache hit path (returns immediately)
  - Test cache miss + Google Flights success path
  - Test cache miss + Google Flights failure + Amadeus success path
  - Test all sources fail + expired cache fallback path
  - Test all sources fail + no expired cache (throws ServiceUnavailableError)
  - Test metadata generation for each scenario
  - Test logging calls for each scenario
  - _Requirements: 3.6, 4.6, 4.7, 5.6, 5.7, 10.2, 10.3, 10.4_

### 6. Rate Limiting Implementation

- [ ] 6.1 Create in-memory rate limiter
  - Create `src/lib/rate-limiting/flight-search-rate-limiter.ts`
  - Implement `FlightSearchRateLimiter` class with:
    - In-memory Map to store user request counts: `Map<userId, { count: number, resetAt: Date }>`
    - `checkLimit(userId: string): { allowed: boolean, retryAfter?: number }` method
    - Check if user exists in map
    - If not, initialize with count=1, resetAt = now + 1 minute
    - If exists and not expired: increment count, check if > 10
    - If exists and expired: reset counter
    - Return `{ allowed: true }` if under limit
    - Return `{ allowed: false, retryAfter: seconds }` if over limit
  - Implement periodic cleanup of expired entries (every 5 minutes)
  - Export singleton instance
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 6.2 Write unit tests for rate limiter
  - Create `src/lib/rate-limiting/__tests__/flight-search-rate-limiter.test.ts`
  - Test user under limit (1-10 requests) - all allowed
  - Test user over limit (11th request) - blocked with retryAfter
  - Test counter reset after 1 minute
  - Test multiple users tracked independently
  - Test cleanup of expired entries
  - _Requirements: 9.1, 9.2, 9.3, 9.5_

### 7. API Route Implementation

- [ ] 7.1 Create flight search API route handler
  - Create `src/app/api/v1/flights/search/route.ts`
  - Implement `POST` handler with following flow:
    - Extract and parse request JSON body
    - Use `requireUser()` from `@/lib/api/server-utils` to authenticate
    - Check rate limit using `FlightSearchRateLimiter.checkLimit(user.id)`
    - If rate limited: return `errorResponse()` with 429 status and `Retry-After` header
    - Validate request body using `RealTimeSearchSchema.parse()`
    - If validation fails: catch `ZodError`, return `validationErrorResponse()` with field errors
    - Initialize dependencies:
      - Redis client
      - `FlightCacheManager` instance
      - `GoogleFlightsAdapter` instance
      - `AmadeusAdapter` instance
      - `FlightSearchOrchestrator` instance
    - Call `orchestrator.coordinateSearch(validatedParams)`
    - Log search request with user_id, params, source, timestamp
    - Return `successResponse({ results, metadata })` on success
    - Catch errors and return appropriate error responses:
      - `ValidationError` → `validationErrorResponse()`
      - `AuthenticationError` → `unauthorizedResponse()`
      - `ServiceUnavailableError` → `errorResponse()` with 503 status
      - Generic Error → `errorResponse()` with generic message (hide internal details)
  - Use imports from `@/lib/api/response` for all response helpers
  - Use `createServerClient()` from `@/lib/supabase/server`
  - Log all errors server-side with full details
  - Never expose scraping implementation details to clients
  - _Requirements: 2.1, 2.2, 2.3, 9.3, 9.4, 10.1, 10.2, 10.5, 10.6, 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7, 14.8_

- [ ]* 7.2 Write integration tests for API route
  - Create `src/app/api/v1/flights/search/__tests__/route.test.ts`
  - Mock Supabase client, Redis, flight adapters
  - Test successful search request (cache hit)
  - Test successful search request (Google Flights)
  - Test successful search request (Amadeus fallback)
  - Test validation errors (missing fields, invalid dates, invalid IATA codes)
  - Test authentication error (no user)
  - Test rate limiting (11th request blocked)
  - Test service unavailable error (all sources fail)
  - Test error message sanitization (no internal details exposed)
  - _Requirements: 2.2, 2.3, 2.6, 9.3, 10.5, 10.6, 14.2, 14.3_

### 8. Frontend Components - Search Form

- [ ] 8.1 Create FlightSearchForm component
  - Create `src/components/flights/FlightSearchForm.tsx`
  - Use React hooks: `useState` for form state, `useTransition` for pending state
  - Create form with fields:
    - Origin airport (text input, 3 chars, uppercase, ARIA label)
    - Destination airport (text input, 3 chars, uppercase, ARIA label)
    - Departure date (date input, min=today, ARIA label)
    - Return date (date input, optional, min=departureDate, ARIA label)
    - Passengers (number input, min=1, max=9, ARIA label)
    - Cabin class (select: economy/business/first, ARIA label)
  - Implement client-side validation:
    - All required fields present
    - Origin/destination are 3-letter codes
    - Departure date not in past
    - Return date after departure date (if provided)
    - Origin !== destination
    - Show inline validation errors for each field
  - Add "Search Flights" button (disabled during search)
  - Show loading spinner and "Searching..." text during search
  - Handle form submission:
    - Validate inputs client-side
    - Make POST request to `/api/v1/flights/search`
    - Handle success: call `onResults(results, metadata)` callback
    - Handle validation errors: display field-specific errors
    - Handle rate limit errors: show retry message with countdown
    - Handle generic errors: show user-friendly message
  - Implement keyboard navigation (Tab order, Enter to submit)
  - Add proper ARIA labels and roles for all form controls
  - Use Tailwind CSS for styling
  - Ensure WCAG 2.1 AA contrast ratios
  - Make responsive (vertical layout on mobile <768px, horizontal on desktop)
  - Use touch-friendly input controls (44px minimum touch targets)
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 11.4, 11.5, 12.1, 12.2, 12.3, 12.7, 13.1, 13.2, 13.5_

- [ ]* 8.2 Write component tests for FlightSearchForm
  - Create `src/components/flights/__tests__/FlightSearchForm.test.tsx`
  - Use React Testing Library
  - Test all fields render with proper labels
  - Test validation errors display correctly
  - Test form submission with valid data
  - Test form submission blocked with invalid data
  - Test loading state during search
  - Test keyboard navigation (Tab through fields, Enter submits)
  - Test ARIA labels present
  - _Requirements: 1.7, 1.8, 1.9, 12.1, 12.2, 12.3_

### 9. Frontend Components - Results Display

- [ ] 9.1 Create FlightResultCard component
  - Create `src/components/flights/FlightResultCard.tsx`
  - Accept props: `result: FlightResult`, `onBook: (result) => void`
  - Display in card layout:
    - Airline name and flight number
    - Departure airport, time, terminal (if available)
    - Arrival airport, time, terminal (if available)
    - Duration (format as "Xh Ym")
    - Stops count ("Direct" or "X stops")
    - Layover details (airports and durations) - collapsible section
    - Price and currency (large, prominent)
    - Cabin class badge
    - "Book Now" button (primary CTA)
  - Implement "Book Now" button:
    - Calls `onBook(result)` callback
    - Opens `result.bookingUrl` in new tab
  - Make card keyboard accessible (focusable, Enter key support)
  - Add proper ARIA labels for screen readers
  - Use semantic HTML (button, time elements)
  - Ensure WCAG 2.1 AA contrast for all text
  - Make responsive (stack info vertically on mobile)
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 12.5, 12.7, 13.3, 13.6_

- [ ] 9.2 Create FlightSearchResults component
  - Create `src/components/flights/FlightSearchResults.tsx`
  - Accept props: `results: FlightResult[]`, `metadata: FlightSearchMetadata`
  - Implement client-side state for:
    - Filter: max stops (select: "Any", "Direct", "1 stop", "2+ stops")
    - Filter: airlines (multi-select checkboxes)
    - Filter: departure time ranges (checkboxes: "Morning 6-12", "Afternoon 12-18", "Evening 18-24", "Night 0-6")
    - Sort: options (select: "Price: Low to High", "Price: High to Low", "Duration: Shortest", "Departure: Earliest", "Departure: Latest")
  - Default sort: "Price: Low to High"
  - Apply filters using AND logic:
    - Filter by max stops if selected
    - Filter by selected airlines if any checked
    - Filter by departure time ranges if any checked
  - Apply sort to filtered results
  - Display results count: "Showing X of Y flights"
  - Render filter controls in collapsible sidebar (desktop) or accordion (mobile)
  - Render sorted/filtered results as list of `FlightResultCard` components
  - Show data source indicator:
    - Badge showing metadata.source ("Google Flights", "Amadeus", "Cached")
    - If metadata.stale=true: show warning icon with tooltip "Prices may have changed"
  - Update ARIA live region when results count changes
  - Ensure keyboard navigation through filters
  - Add ARIA labels for all filter controls
  - Make responsive (collapsible filters on mobile <768px)
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 12.4, 12.5, 12.6, 13.3, 13.4, 15.3, 15.4_

- [ ] 9.3 Create data source indicator component
  - Create `src/components/flights/DataSourceIndicator.tsx`
  - Accept props: `source: string`, `stale: boolean`
  - Display subtle badge with icon:
    - Map source to user-friendly label:
      - `google_flights` → "Google Flights"
      - `amadeus` → "Amadeus"
      - `cache_redis` → "Cached"
      - `cache_database` → "Cached"
      - `cache_expired` → "Cached (outdated)"
    - Use different color variants for each source
    - If `stale=true`: add warning icon with tooltip "Prices may have changed. Try searching again."
  - Make accessible (proper ARIA label)
  - _Requirements: 15.1, 15.2, 15.3, 15.4_

- [ ]* 9.4 Write component tests for FlightResultCard
  - Create `src/components/flights/__tests__/FlightResultCard.test.tsx`
  - Test all flight details render correctly
  - Test "Book Now" button calls callback
  - Test keyboard interaction (Enter key)
  - Test ARIA labels present
  - Test layover details expand/collapse
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 12.5_

- [ ]* 9.5 Write component tests for FlightSearchResults
  - Create `src/components/flights/__tests__/FlightSearchResults.test.tsx`
  - Test results render in default sort order
  - Test filters apply correctly (stops, airlines, time)
  - Test sort options work correctly
  - Test results count updates when filters change
  - Test data source indicator displays correctly
  - Test stale data warning appears when appropriate
  - Test ARIA live region announces changes
  - Test keyboard navigation through filters
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 12.4, 12.6, 15.3, 15.4_

### 10. Main Page Integration

- [ ] 10.1 Create flight search page
  - Create `src/app/[locale]/flights/search/page.tsx`
  - Implement client component that combines:
    - `FlightSearchForm` component (top)
    - `FlightSearchResults` component (below, initially hidden)
  - Manage state:
    - `results: FlightResult[] | null` (initially null)
    - `metadata: FlightSearchMetadata | null`
    - `error: string | null`
    - `loading: boolean`
  - Wire up callbacks:
    - `FlightSearchForm.onResults` → update state with results + metadata
    - `FlightSearchForm.onError` → update state with error message
    - `FlightResultCard.onBook` → track booking click (analytics optional)
  - Show empty state when no results
  - Show error state with retry button
  - Use proper layout (max-width container, padding)
  - Add page title and meta description for SEO
  - Make fully responsive
  - _Requirements: 1.1-1.9, 7.1-7.7, 8.1-8.7, 11.4, 13.1-13.6_

- [ ] 10.2 Add navigation link to flight search
  - Update main navigation component (if exists)
  - Add "Search Flights" link to `/flights/search`
  - Ensure link is accessible and keyboard navigable
  - _Requirements: 1.1, 12.2_

### 11. Performance Optimization

- [ ] 11.1 Add loading states and skeletons
  - Create `src/components/flights/FlightSearchSkeleton.tsx`
  - Show skeleton cards while search is in progress
  - Animate skeleton to indicate loading
  - Show count placeholder
  - _Requirements: 11.4_

- [ ] 11.2 Add error boundary for flight search
  - Create `src/components/flights/FlightSearchErrorBoundary.tsx`
  - Catch runtime errors in flight search components
  - Display user-friendly error message
  - Provide "Try Again" button to reset state
  - Log errors to console (or monitoring service)
  - _Requirements: 10.5, 10.6_

- [ ] 11.3 Optimize bundle size
  - Lazy load flight provider adapters (dynamic imports)
  - Lazy load Redis client (dynamic import)
  - Ensure Amadeus SDK is only loaded when needed
  - Use Next.js code splitting for flight search page
  - _Requirements: 11.1, 11.2_

### 12. Monitoring and Logging

- [ ] 12.1 Add structured logging for search requests
  - Create `src/lib/logging/flight-search-logger.ts`
  - Implement logging helpers:
    - `logSearchRequest(userId, params, timestamp)`
    - `logSearchResult(userId, source, resultCount, duration)`
    - `logProviderFailure(provider, error, params)`
    - `logCacheHit(source, userId, params)`
  - Use structured format (JSON) for easy parsing
  - Log to console (can be extended to external service)
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 12.2 Add cache hit rate tracking
  - Extend `FlightCacheManager` with metrics:
    - Count cache hits (Redis)
    - Count cache hits (Supabase)
    - Count cache misses
    - Calculate hit rate percentage
  - Log metrics periodically (every 100 requests)
  - _Requirements: 10.7_

### 13. Testing and Quality Assurance

- [ ] 13.1 Checkpoint - Run all unit tests
  - Execute `npm test` or equivalent
  - Ensure all test files pass:
    - Cache manager tests
    - Provider adapter tests
    - Orchestrator tests
    - Rate limiter tests
    - Component tests
  - Fix any failing tests before proceeding
  - Ensure code coverage >80% for critical paths

- [ ]* 13.2 Write E2E test for complete search flow
  - Create `e2e/flight-search.spec.ts` (using Playwright or Cypress)
  - Test scenario: User searches for flights successfully
    - Navigate to `/flights/search`
    - Fill in search form with valid data
    - Submit form
    - Wait for results to load
    - Verify results display
    - Verify source indicator shows
    - Apply filter (e.g., "Direct flights only")
    - Verify results update
    - Change sort order
    - Verify results reorder
    - Click "Book Now" on first result
    - Verify new tab opens with booking URL
  - Test scenario: User encounters validation error
    - Fill in form with invalid data (same origin/destination)
    - Submit form
    - Verify error message displays
  - Test scenario: User rate limited
    - Make 11 searches rapidly
    - Verify 11th request blocked
    - Verify retry message displays
  - _Requirements: 1.1-1.9, 2.6, 7.1-7.7, 8.7, 9.3, 9.4_

- [ ]* 13.3 Write E2E test for fallback scenarios
  - Mock Google Flights adapter to fail
  - Verify Amadeus adapter is called
  - Verify results returned from Amadeus
  - Mock both adapters to fail
  - Verify expired cache is returned with warning
  - Mock all sources to fail (no expired cache)
  - Verify service unavailable error shown
  - _Requirements: 4.6, 4.7, 5.5, 5.6, 5.7, 15.4_

### 14. Documentation

- [ ] 14.1 Create API documentation
  - Create `docs/api/flights-search.md`
  - Document POST `/api/v1/flights/search` endpoint:
    - Request body schema (JSON)
    - Response schema (success and error)
    - Authentication requirements
    - Rate limiting rules
    - Example requests and responses
    - Error codes and meanings
  - _Requirements: 14.1, 14.2, 14.3_

- [ ] 14.2 Create setup guide
  - Create `docs/setup/flight-search-integration.md`
  - Document environment variables required
  - Document Redis setup instructions
  - Document Amadeus API account setup
  - Document Supabase migration steps
  - Document how to run locally
  - Document how to test
  - _Requirements: 4.2, 5.2, 6.1_

- [ ] 14.3 Add inline code comments
  - Review all implementation files
  - Add JSDoc comments to all public functions and classes
  - Add inline comments explaining complex logic (especially normalization functions)
  - Document rate limiting rules
  - Document cache TTL values
  - Document timeout values and retry logic

### 15. Deployment Preparation

- [ ] 15.1 Configure production Redis
  - Set up Upstash Redis or Redis Cloud instance
  - Update `.env.production` with `REDIS_URL` and `REDIS_TOKEN`
  - Test connection from production environment
  - _Requirements: 6.1_

- [ ] 15.2 Configure Amadeus production credentials
  - Create production Amadeus API account (if different from test)
  - Update `.env.production` with production `AMADEUS_API_KEY`, `AMADEUS_API_SECRET`, and `AMADEUS_HOSTNAME=production`
  - _Requirements: 5.2_

- [ ] 15.3 Run Supabase migration in production
  - Apply `flight_search_cache` table migration to production database
  - Verify table created with correct schema
  - Verify indexes created
  - _Requirements: 6.2-6.6_

- [ ] 15.4 Deploy to Vercel/production
  - Ensure all environment variables set in hosting provider
  - Deploy application
  - Test API endpoint in production
  - Test UI in production
  - Monitor logs for errors
  - Verify Redis connection works
  - Verify Amadeus API calls work
  - _Requirements: All_

- [ ] 15.5 Set up monitoring and alerts
  - Configure error tracking (e.g., Sentry)
  - Set up alerts for high error rates
  - Set up alerts for rate limit breaches
  - Monitor cache hit rates
  - Monitor API response times
  - _Requirements: 10.1-10.7, 11.1-11.3_

### 16. Final Checkpoint

- [ ] 16.1 Final verification
  - Manually test complete user flow in production:
    - Search with various parameters (one-way, round-trip, different cabin classes)
    - Verify results display correctly
    - Verify filters work
    - Verify sorting works
    - Verify data source indicators show
    - Verify rate limiting works (try 11th request)
    - Verify error messages are user-friendly
  - Run full test suite one final time
  - Verify no console errors in browser
  - Verify accessibility with screen reader
  - Verify mobile responsiveness on real device
  - Verify performance (<3s cache hit, <8s fresh search)
  - Ask user if any issues or questions arise

## Notes

- Tasks marked with `*` are optional test tasks that can be skipped for faster MVP delivery
- Each task references specific requirements from requirements.md for traceability
- Tasks are ordered to build incrementally (types → adapters → orchestration → API → UI)
- Checkpoints ensure validation before proceeding
- All code follows existing tech stack rules (Supabase patterns, TABLES constant, response helpers)
- TypeScript strict mode is enforced throughout
- WCAG 2.1 AA accessibility compliance is mandatory
- Mobile responsiveness is built into every component

## Task Dependency Graph

```json
{
  "waves": [
    {
      "id": 0,
      "tasks": ["1.1", "1.2", "1.3"]
    },
    {
      "id": 1,
      "tasks": ["2.1", "2.2", "2.3"]
    },
    {
      "id": 2,
      "tasks": ["3.1"]
    },
    {
      "id": 3,
      "tasks": ["3.2", "4.1", "6.1"]
    },
    {
      "id": 4,
      "tasks": ["3.3", "4.2", "4.3", "6.2"]
    },
    {
      "id": 5,
      "tasks": ["4.4", "4.5", "4.6"]
    },
    {
      "id": 6,
      "tasks": ["5.1"]
    },
    {
      "id": 7,
      "tasks": ["5.2", "7.1", "12.1"]
    },
    {
      "id": 8,
      "tasks": ["7.2", "8.1", "12.2"]
    },
    {
      "id": 9,
      "tasks": ["8.2", "9.1"]
    },
    {
      "id": 10,
      "tasks": ["9.2", "9.3"]
    },
    {
      "id": 11,
      "tasks": ["9.4", "9.5", "10.1"]
    },
    {
      "id": 12,
      "tasks": ["10.2", "11.1", "11.2"]
    },
    {
      "id": 13,
      "tasks": ["11.3", "13.1"]
    },
    {
      "id": 14,
      "tasks": ["13.2", "13.3"]
    },
    {
      "id": 15,
      "tasks": ["14.1", "14.2", "14.3"]
    },
    {
      "id": 16,
      "tasks": ["15.1", "15.2", "15.3"]
    },
    {
      "id": 17,
      "tasks": ["15.4", "15.5"]
    },
    {
      "id": 18,
      "tasks": ["16.1"]
    }
  ]
}
```
