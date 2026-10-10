# Design Document: Flight Search Integration System

## Overview

The Flight Search Integration System is a hybrid, performance-optimized flight search solution that provides real-time flight availability to travelers through a Next.js 14 application. The system uses a dual-source strategy with Google Flights scraping (via fast-flights) as the primary source and Amadeus API as a fallback, combined with multi-layer caching (Redis + Supabase) to minimize API costs and maximize response speed.

**Core Design Principles:**
- **Performance First**: Cache-first architecture with sub-3-second cache hits
- **Cost Optimization**: Unlimited free searches via Google Flights with intelligent fallback
- **Resilience**: Multi-level fallback chain ensures high availability
- **User Experience**: Real-time feedback, accessibility-compliant interface
- **Security**: Input validation, rate limiting, sanitization at every layer

## Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Client Layer                                │
│  ┌───────────────┐      ┌──────────────────────────────────────┐   │
│  │ FlightSearch  │─────▶│  FlightSearchResults                 │   │
│  │ Form          │      │  - Result Cards                      │   │
│  │ - Validation  │      │  - Filters (stops, airline, time)    │   │
│  │ - Date Picker │      │  - Sort Controls                     │   │
│  │ - Class Select│      │  - Source Indicator                  │   │
│  └───────────────┘      └──────────────────────────────────────┘   │
│         │                              ▲                            │
│         │ POST /api/v1/flights/search │                            │
│         ▼                              │                            │
└─────────────────────────────────────────────────────────────────────┘
          │                              │
          │                              │
┌─────────────────────────────────────────────────────────────────────┐
│                       API Route Layer                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ POST /api/v1/flights/search/route.ts                          │  │
│  │                                                               │  │
│  │ 1. requireUser() - Auth Guard                                │  │
│  │ 2. Rate Limiter Check (10/min per user)                      │  │
│  │ 3. Validate with RealTimeSearchSchema                        │  │
│  │ 4. Call Search Orchestrator                                  │  │
│  │ 5. Return successResponse(results)                           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ Search Orchestrator                                           │  │
│  │                                                               │  │
│  │ coordinateSearch(params: SearchParameters)                    │  │
│  │   ├─▶ Cache Lookup (Redis → Supabase)                        │  │
│  │   │   └─▶ if hit: return cached + update Redis              │  │
│  │   ├─▶ Google Flights Adapter                                 │  │
│  │   │   └─▶ if success: cache + return                         │  │
│  │   ├─▶ Amadeus Adapter (fallback)                             │  │
│  │   │   └─▶ if success: cache + return                         │  │
│  │   └─▶ Expired Cache Fallback (last resort)                   │  │
│  │       └─▶ if exists: return with warning                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
          │         │         │         │
          │         │         │         │
┌─────────────────────────────────────────────────────────────────────┐
│                      Data Provider Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐        │
│  │ Cache    │  │ Google   │  │ Amadeus  │  │ Rate         │        │
│  │ Manager  │  │ Flights  │  │ Adapter  │  │ Limiter      │        │
│  │          │  │ Adapter  │  │          │  │              │        │
│  │ - Redis  │  │ - fast-  │  │ - Amadeus│  │ - In-memory  │        │
│  │ - Supabase│  │ flights │  │   SDK    │  │ - Per user   │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
          │                                           │
          ▼                                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      External Services                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐   │
│  │ Redis Cloud /    │  │ Google Flights   │  │ Amadeus Self-   │   │
│  │ Upstash Redis    │  │ (web scraping)   │  │ Service API     │   │
│  │ (30min TTL)      │  │                  │  │ (REST API)      │   │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Successful Cache Hit Flow:**
```
User → Search Form → API Route → Rate Limiter → Validation 
  → Search Orchestrator → Cache Manager (Redis)
  → [CACHE HIT] → Return results (< 3 seconds)
  → Results Display
```

**Google Flights Success Flow:**
```
User → Search Form → API Route → Rate Limiter → Validation
  → Search Orchestrator → Cache Manager (Redis)
  → [CACHE MISS] → Cache Manager (Supabase)
  → [CACHE MISS] → Google Flights Adapter
  → [SUCCESS] → Normalize Results → Cache Manager (Redis + Supabase)
  → Return results (< 8 seconds)
  → Results Display
```

**Fallback Chain Flow:**
```
User → Search Form → API Route → Rate Limiter → Validation
  → Search Orchestrator → Cache Manager (Redis)
  → [CACHE MISS] → Cache Manager (Supabase)
  → [CACHE MISS] → Google Flights Adapter
  → [FAILURE] → Amadeus Adapter
  → [FAILURE] → Cache Manager (Expired Cache)
  → [FOUND] → Return with staleness warning
  → Results Display (with warning indicator)
```

### Data Flow Diagram

```
┌────────────────────────────────────────────────────────────┐
│ Phase 1: Input & Validation                                 │
│                                                             │
│ SearchParameters (Raw)                                      │
│   {                                                         │
│     origin: "CAI",                                          │
│     destination: "DXB",                                     │
│     departureDate: "2024-03-15",                            │
│     returnDate: "2024-03-20",                               │
│     passengers: 2,                                          │
│     cabinClass: "economy"                                   │
│   }                                                         │
│         │                                                   │
│         ▼                                                   │
│   RealTimeSearchSchema.parse()                              │
│         │                                                   │
│         ▼                                                   │
│   ValidatedSearchParameters                                 │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ Phase 2: Cache Key Generation                               │
│                                                             │
│   generateCacheKey(params)                                  │
│     → "flights:CAI:DXB:2024-03-15:2024-03-20:2:economy"    │
│                                                             │
│   generateHashKey(params)                                   │
│     → SHA-256 hash for Supabase lookups                     │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ Phase 3: Cache Lookup (Parallel)                            │
│                                                             │
│   Redis.get(cacheKey)                                       │
│     ├─ HIT → Return cached FlightResult[]                  │
│     └─ MISS → Continue                                      │
│                                                             │
│   Supabase.from(flightSearchCache)                          │
│            .select('*')                                     │
│            .eq('search_params_hash', hashKey)               │
│            .gt('expires_at', now())                         │
│     ├─ HIT → Update Redis → Return FlightResult[]          │
│     └─ MISS → Continue to providers                         │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ Phase 4: Provider Fetch (Sequential with Fallback)          │
│                                                             │
│   Try 1: Google Flights Adapter                             │
│     googleFlights.search(params)                            │
│       → Raw Google Flights Data                             │
│       → normalizeGoogleFlightsResults()                     │
│       → FlightResult[]                                      │
│     ├─ SUCCESS → Cache + Return                            │
│     └─ FAILURE → Try Amadeus                               │
│                                                             │
│   Try 2: Amadeus Adapter                                    │
│     amadeusClient.shopping.flightOffersSearch.get(params)   │
│       → Raw Amadeus Data                                    │
│       → normalizeAmadeusResults()                           │
│       → FlightResult[]                                      │
│     ├─ SUCCESS → Cache + Return                            │
│     └─ FAILURE → Try Expired Cache                         │
│                                                             │
│   Try 3: Expired Cache Fallback                             │
│     Supabase.from(flightSearchCache)                        │
│              .select('*')                                   │
│              .eq('search_params_hash', hashKey)             │
│              .order('created_at', desc)                     │
│              .limit(1)                                      │
│     ├─ FOUND → Return with staleness warning               │
│     └─ NOT FOUND → Throw ServiceUnavailableError           │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ Phase 5: Response Normalization                             │
│                                                             │
│   FlightResult[] {                                          │
│     id: string,                                             │
│     source: 'google_flights' | 'amadeus' | 'cache_...',    │
│     price: number,                                          │
│     currency: string,                                       │
│     airline: string,                                        │
│     flightNumber?: string,                                  │
│     departure: { airport, time, terminal? },                │
│     arrival: { airport, time, terminal? },                  │
│     duration: number,                                       │
│     stops: number,                                          │
│     layovers?: LayoverInfo[],                               │
│     bookingUrl: string,                                     │
│     cabinClass: 'economy' | 'business' | 'first'            │
│   }                                                         │
│                                                             │
│   Metadata: {                                               │
│     searchId: uuid,                                         │
│     source: string,                                         │
│     cached: boolean,                                        │
│     stale: boolean,                                         │
│     timestamp: ISO string                                   │
│   }                                                         │
└────────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────────┐
│ Phase 6: Client-Side Filtering & Display                    │
│                                                             │
│   Results Display receives FlightResult[]                   │
│     │                                                       │
│     ├─▶ Apply filters (stops, airline, time)               │
│     ├─▶ Apply sorting (price, duration, departure)         │
│     ├─▶ Render cards with accessibility                    │
│     └─▶ Show source indicator + stale warning              │
└────────────────────────────────────────────────────────────┘
```

### Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     Error Scenarios                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │ Validation Error?       │
              └─────────────────────────┘
                     │ Yes          │ No
                     ▼              ▼
         ┌────────────────┐   ┌────────────────┐
         │ Return 400     │   │ Rate Limited?  │
         │ with field     │   └────────────────┘
         │ errors         │        │ Yes    │ No
         └────────────────┘        ▼        ▼
                           ┌────────────┐  ┌────────────────┐
                           │ Return 429 │  │ Auth Failed?   │
                           │ with retry │  └────────────────┘
                           │ header     │       │ Yes  │ No
                           └────────────┘       ▼      ▼
                                       ┌────────────┐ ┌─────────────────┐
                                       │ Return 401 │ │ Google Flights  │
                                       │ error      │ │ Timeout/Error?  │
                                       └────────────┘ └─────────────────┘
                                                           │ Yes      │ No
                                                           ▼          ▼
                                                  ┌────────────┐ ┌────────────┐
                                                  │ Fallback   │ │ Amadeus    │
                                                  │ to Amadeus │ │ Failed?    │
                                                  └────────────┘ └────────────┘
                                                                     │ Yes │ No
                                                                     ▼     ▼
                                                            ┌──────────┐ ┌──────────┐
                                                            │ Try      │ │ Success  │
                                                            │ Expired  │ │ Return   │
                                                            │ Cache    │ │ Results  │
                                                            └──────────┘ └──────────┘
                                                                 │
                                                    ┌────────────┴────────────┐
                                                    │ Found?        Not Found?│
                                                    ▼                         ▼
                                          ┌───────────────┐        ┌─────────────┐
                                          │ Return with   │        │ Return 503  │
                                          │ stale warning │        │ Service     │
                                          └───────────────┘        │ Unavailable │
                                                                   └─────────────┘
```

## Components and Interfaces

### Backend Components

#### 1. Flight Provider Adapters

**Location:** `src/lib/flight-providers/`

**Interface Definition:**
```typescript
// src/lib/flight-providers/types.ts
export interface FlightProviderAdapter {
  name: string;
  search(params: NormalizedSearchParams): Promise<FlightResult[]>;
  isAvailable(): Promise<boolean>;
}

export interface NormalizedSearchParams {
  origin: string;       // IATA code
  destination: string;  // IATA code
  departureDate: string; // YYYY-MM-DD
  returnDate?: string;   // YYYY-MM-DD
  passengers: number;
  cabinClass: 'economy' | 'business' | 'first';
}

export interface RawGoogleFlightsResult {
  // Raw structure from fast-flights library
  price: number;
  currency: string;
  airline: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  stops: number;
  link: string;
  // ... other fields from fast-flights
}

export interface RawAmadeusResult {
  // Raw structure from Amadeus API
  type: string;
  id: string;
  price: {
    total: string;
    currency: string;
  };
  itineraries: Array<{
    segments: Array<{
      departure: {
        iataCode: string;
        at: string;
      };
      arrival: {
        iataCode: string;
        at: string;
      };
      carrierCode: string;
      number: string;
      duration: string;
    }>;
  }>;
  // ... other Amadeus fields
}
```

**Google Flights Adapter:**
```typescript
// src/lib/flight-providers/google-flights-adapter.ts
import { FlightProviderAdapter, NormalizedSearchParams, RawGoogleFlightsResult } from './types';
import { FlightResult } from '@/types/flights';
import { AppError } from '@/lib/api/errors';

export class GoogleFlightsAdapter implements FlightProviderAdapter {
  name = 'google_flights';
  private timeout = 7000; // 7 seconds

  async search(params: NormalizedSearchParams): Promise<FlightResult[]> {
    try {
      // Call fast-flights library (Node.js implementation)
      const { searchFlights } = await import('fast-flights');
      
      const rawResults: RawGoogleFlightsResult[] = await Promise.race([
        searchFlights({
          origin: params.origin,
          destination: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          passengers: params.passengers,
          travelClass: params.cabinClass.toUpperCase(),
        }),
        this.timeoutPromise(),
      ]);

      return this.normalizeResults(rawResults, params);
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new AppError('Google Flights timeout', 504);
      }
      throw new AppError(
        `Google Flights search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        500
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    // Simple check - can be enhanced with health check endpoint
    return true;
  }

  private normalizeResults(
    rawResults: RawGoogleFlightsResult[],
    params: NormalizedSearchParams
  ): FlightResult[] {
    return rawResults.map((raw, index) => ({
      id: `gf-${Date.now()}-${index}`,
      source: 'google_flights' as const,
      price: raw.price,
      currency: raw.currency,
      airline: raw.airline,
      flightNumber: undefined, // Google Flights doesn't always provide this
      departure: {
        airport: params.origin,
        time: raw.departure_time,
      },
      arrival: {
        airport: params.destination,
        time: raw.arrival_time,
      },
      duration: raw.duration,
      stops: raw.stops,
      layovers: this.extractLayovers(raw),
      bookingUrl: raw.link,
      cabinClass: params.cabinClass,
    }));
  }

  private extractLayovers(raw: RawGoogleFlightsResult): FlightResult['layovers'] {
    // Extract layover information from raw data if available
    // Implementation depends on fast-flights data structure
    return [];
  }

  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new TimeoutError('Request timeout')), this.timeout);
    });
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
```

**Amadeus Adapter:**
```typescript
// src/lib/flight-providers/amadeus-adapter.ts
import Amadeus from 'amadeus';
import { FlightProviderAdapter, NormalizedSearchParams, RawAmadeusResult } from './types';
import { FlightResult } from '@/types/flights';
import { AppError } from '@/lib/api/errors';

export class AmadeusAdapter implements FlightProviderAdapter {
  name = 'amadeus';
  private client: Amadeus;
  private timeout = 7000; // 7 seconds

  constructor() {
    const apiKey = process.env.AMADEUS_API_KEY;
    const apiSecret = process.env.AMADEUS_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Amadeus credentials not configured');
    }

    this.client = new Amadeus({
      clientId: apiKey,
      clientSecret: apiSecret,
      hostname: 'production', // or 'test' for sandbox
    });
  }

  async search(params: NormalizedSearchParams): Promise<FlightResult[]> {
    try {
      const response = await Promise.race([
        this.client.shopping.flightOffersSearch.get({
          originLocationCode: params.origin,
          destinationLocationCode: params.destination,
          departureDate: params.departureDate,
          returnDate: params.returnDate,
          adults: params.passengers,
          travelClass: this.mapCabinClass(params.cabinClass),
          max: 50, // Maximum results
        }),
        this.timeoutPromise(),
      ]);

      const rawResults: RawAmadeusResult[] = response.data;
      return this.normalizeResults(rawResults, params);
    } catch (error) {
      if (error instanceof TimeoutError) {
        throw new AppError('Amadeus API timeout', 504);
      }
      if (error instanceof Error && 'response' in error) {
        const amadeusError = error as any;
        throw new AppError(
          `Amadeus API error: ${amadeusError.response?.data?.errors?.[0]?.detail || 'Unknown error'}`,
          amadeusError.response?.status || 500
        );
      }
      throw new AppError('Amadeus API request failed', 500);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Try a simple availability check
      await this.client.shopping.availability.flightAvailabilities.post({});
      return true;
    } catch {
      return false;
    }
  }

  private normalizeResults(
    rawResults: RawAmadeusResult[],
    params: NormalizedSearchParams
  ): FlightResult[] {
    return rawResults.map((raw) => {
      const firstSegment = raw.itineraries[0].segments[0];
      const lastSegment = raw.itineraries[0].segments[raw.itineraries[0].segments.length - 1];

      return {
        id: raw.id,
        source: 'amadeus' as const,
        price: parseFloat(raw.price.total),
        currency: raw.price.currency,
        airline: firstSegment.carrierCode,
        flightNumber: `${firstSegment.carrierCode}${firstSegment.number}`,
        departure: {
          airport: firstSegment.departure.iataCode,
          time: firstSegment.departure.at,
        },
        arrival: {
          airport: lastSegment.arrival.iataCode,
          time: lastSegment.arrival.at,
        },
        duration: this.parseDuration(raw.itineraries[0].segments),
        stops: raw.itineraries[0].segments.length - 1,
        layovers: this.extractLayovers(raw.itineraries[0].segments),
        bookingUrl: this.generateBookingUrl(raw.id),
        cabinClass: params.cabinClass,
      };
    });
  }

  private mapCabinClass(cabinClass: string): string {
    const mapping: Record<string, string> = {
      economy: 'ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST',
    };
    return mapping[cabinClass] || 'ECONOMY';
  }

  private parseDuration(segments: any[]): number {
    // Convert ISO 8601 duration to minutes
    const totalMinutes = segments.reduce((acc, segment) => {
      const duration = segment.duration; // e.g., "PT2H30M"
      const hours = parseInt(duration.match(/(\d+)H/)?.[1] || '0', 10);
      const minutes = parseInt(duration.match(/(\d+)M/)?.[1] || '0', 10);
      return acc + hours * 60 + minutes;
    }, 0);
    return totalMinutes;
  }

  private extractLayovers(segments: any[]): FlightResult['layovers'] {
    if (segments.length <= 1) return [];

    return segments.slice(0, -1).map((segment, index) => {
      const nextSegment = segments[index + 1];
      const layoverDuration = this.calculateLayoverDuration(
        segment.arrival.at,
        nextSegment.departure.at
      );

      return {
        airport: segment.arrival.iataCode,
        duration: layoverDuration,
      };
    });
  }

  private calculateLayoverDuration(arrivalTime: string, departureTime: string): number {
    const arrival = new Date(arrivalTime);
    const departure = new Date(departureTime);
    return Math.round((departure.getTime() - arrival.getTime()) / 60000); // minutes
  }

  private generateBookingUrl(offerId: string): string {
    // In production, this would link to your booking flow
    return `/booking/confirm?offerId=${offerId}&source=amadeus`;
  }

  private timeoutPromise(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new TimeoutError('Request timeout')), this.timeout);
    });
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
```

**Provider Index:**
```typescript
// src/lib/flight-providers/index.ts
export { GoogleFlightsAdapter } from './google-flights-adapter';
export { AmadeusAdapter } from './amadeus-adapter';
export type { FlightProviderAdapter, NormalizedSearchParams } from './types';
```

#### 2. Cache Manager

**Location:** `src/lib/cache/flight-cache-manager.ts`

```typescript
import { createServerClient } from '@/lib/supabase/server';
import { TABLES } from '@/lib/db/schema';
import { FlightResult } from '@/types/flights';
import { NormalizedSearchParams } from '@/lib/flight-providers/types';
import crypto from 'crypto';

export interface CacheResult {
  results: FlightResult[];
  source: 'cache_redis' | 'cache_database' | 'cache_expired';
  stale: boolean;
}

export class FlightCacheManager {
  private redisClient: any; // Replace with actual Redis client type
  private readonly cacheTTL = 30 * 60; // 30 minutes in seconds

  constructor(redisClient: any) {
    this.redisClient = redisClient;
  }

  /**
   * Generate cache key from search parameters
   */
  generateCacheKey(params: NormalizedSearchParams): string {
    const parts = [
      'flights',
      params.origin,
      params.destination,
      params.departureDate,
      params.returnDate || 'oneway',
      params.passengers.toString(),
      params.cabinClass,
    ];
    return parts.join(':');
  }

  /**
   * Generate hash for Supabase lookup
   */
  generateHashKey(params: NormalizedSearchParams): string {
    const normalized = JSON.stringify({
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate,
      returnDate: params.returnDate,
      passengers: params.passengers,
      cabinClass: params.cabinClass,
    });
    return crypto.createHash('sha256').update(normalized).digest('hex');
  }

  /**
   * Lookup cache in Redis first, then Supabase
   */
  async lookup(params: NormalizedSearchParams): Promise<CacheResult | null> {
    // Try Redis first
    const redisResult = await this.lookupRedis(params);
    if (redisResult) {
      return redisResult;
    }

    // Try Supabase
    const supabaseResult = await this.lookupSupabase(params);
    if (supabaseResult) {
      // Update Redis for next time
      await this.storeRedis(params, supabaseResult.results);
      return supabaseResult;
    }

    return null;
  }

  /**
   * Lookup in Redis cache
   */
  private async lookupRedis(params: NormalizedSearchParams): Promise<CacheResult | null> {
    try {
      const cacheKey = this.generateCacheKey(params);
      const cached = await this.redisClient.get(cacheKey);

      if (!cached) {
        return null;
      }

      const results: FlightResult[] = JSON.parse(cached);
      return {
        results,
        source: 'cache_redis',
        stale: false,
      };
    } catch (error) {
      console.error('Redis lookup error:', error);
      return null;
    }
  }

  /**
   * Lookup in Supabase cache
   */
  private async lookupSupabase(
    params: NormalizedSearchParams
  ): Promise<CacheResult | null> {
    try {
      const supabase = await createServerClient();
      const hashKey = this.generateHashKey(params);
      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from(TABLES.flightSearchCache)
        .select('*')
        .eq('search_params_hash', hashKey)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      const results: FlightResult[] = JSON.parse(data.results_json);
      return {
        results,
        source: 'cache_database',
        stale: false,
      };
    } catch (error) {
      console.error('Supabase cache lookup error:', error);
      return null;
    }
  }

  /**
   * Get expired cache as last resort fallback
   */
  async lookupExpired(params: NormalizedSearchParams): Promise<CacheResult | null> {
    try {
      const supabase = await createServerClient();
      const hashKey = this.generateHashKey(params);

      const { data, error } = await supabase
        .from(TABLES.flightSearchCache)
        .select('*')
        .eq('search_params_hash', hashKey)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error || !data) {
        return null;
      }

      const results: FlightResult[] = JSON.parse(data.results_json);
      return {
        results,
        source: 'cache_expired',
        stale: true,
      };
    } catch (error) {
      console.error('Expired cache lookup error:', error);
      return null;
    }
  }

  /**
   * Store results in Redis
   */
  private async storeRedis(
    params: NormalizedSearchParams,
    results: FlightResult[]
  ): Promise<void> {
    try {
      const cacheKey = this.generateCacheKey(params);
      const value = JSON.stringify(results);
      await this.redisClient.setex(cacheKey, this.cacheTTL, value);
    } catch (error) {
      console.error('Redis store error:', error);
      // Non-fatal - continue without Redis caching
    }
  }

  /**
   * Store results in Supabase
   */
  private async storeSupabase(
    params: NormalizedSearchParams,
    results: FlightResult[]
  ): Promise<void> {
    try {
      const supabase = await createServerClient();
      const hashKey = this.generateHashKey(params);
      const expiresAt = new Date(Date.now() + this.cacheTTL * 1000).toISOString();

      const { error } = await supabase.from(TABLES.flightSearchCache).insert({
        search_params_hash: hashKey,
        origin: params.origin,
        destination: params.destination,
        departure_date: params.departureDate,
        return_date: params.returnDate,
        results_json: JSON.stringify(results),
        expires_at: expiresAt,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error('Supabase cache store error:', error);
      }
    } catch (error) {
      console.error('Supabase store error:', error);
      // Non-fatal - continue without Supabase caching
    }
  }

  /**
   * Store fresh results in both cache layers
   */
  async store(params: NormalizedSearchParams, results: FlightResult[]): Promise<void> {
    await Promise.all([
      this.storeRedis(params, results),
      this.storeSupabase(params, results),
    ]);
  }

  /**
   * Log cache metrics for monitoring
   */
  logMetrics(hit: boolean, source?: string): void {
    // In production, send to monitoring service
    console.log('[Cache Metrics]', {
      hit,
      source,
      timestamp: new Date().toISOString(),
    });
  }
}
```

#### 3. Search Orchestrator

**Location:** `src/lib/search/flight-search-orchestrator.ts`

```typescript
import { GoogleFlightsAdapter } from '@/lib/flight-providers/google-flights-adapter';
import { AmadeusAdapter } from '@/lib/flight-providers/amadeus-adapter';
import { FlightCacheManager } from '@/lib/cache/flight-cache-manager';
import { FlightResult, SearchResponse } from '@/types/flights';
import { NormalizedSearchParams } from '@/lib/flight-providers/types';
import { AppError, ServiceUnavailableError } from '@/lib/api/errors';

export class FlightSearchOrchestrator {
  private googleAdapter: GoogleFlightsAdapter;
  private amadeusAdapter: AmadeusAdapter;
  private cacheManager: FlightCacheManager;

  constructor(cacheManager: FlightCacheManager) {
    this.googleAdapter = new GoogleFlightsAdapter();
    this.amadeusAdapter = new AmadeusAdapter();
    this.cacheManager = cacheManager;
  }

  /**
   * Coordinate search across cache and providers
   */
  async search(params: NormalizedSearchParams): Promise<SearchResponse> {
    const searchId = this.generateSearchId();

    // Phase 1: Try cache
    const cached = await this.cacheManager.lookup(params);
    if (cached) {
      this.cacheManager.logMetrics(true, cached.source);
      return {
        searchId,
        results: cached.results,
        metadata: {
          source: cached.source,
          cached: true,
          stale: cached.stale,
          timestamp: new Date().toISOString(),
        },
      };
    }

    this.cacheManager.logMetrics(false);

    // Phase 2: Try Google Flights
    try {
      const results = await this.googleAdapter.search(params);
      await this.cacheManager.store(params, results);

      return {
        searchId,
        results,
        metadata: {
          source: 'google_flights',
          cached: false,
          stale: false,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (googleError) {
      console.error('Google Flights failed:', googleError);
      // Continue to Amadeus fallback
    }

    // Phase 3: Try Amadeus
    try {
      const results = await this.amadeusAdapter.search(params);
      await this.cacheManager.store(params, results);

      return {
        searchId,
        results,
        metadata: {
          source: 'amadeus',
          cached: false,
          stale: false,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (amadeusError) {
      console.error('Amadeus failed:', amadeusError);
      // Continue to expired cache fallback
    }

    // Phase 4: Try expired cache as last resort
    const expiredCache = await this.cacheManager.lookupExpired(params);
    if (expiredCache) {
      return {
        searchId,
        results: expiredCache.results,
        metadata: {
          source: 'cache_expired',
          cached: true,
          stale: true,
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Phase 5: All options exhausted
    throw new ServiceUnavailableError(
      'Flight search is temporarily unavailable. Please try again later.'
    );
  }

  private generateSearchId(): string {
    return `search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 4. Rate Limiter

**Location:** `src/lib/rate-limiter/flight-rate-limiter.ts`

```typescript
export class FlightRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly maxRequests = 10;
  private readonly windowMs = 60 * 1000; // 1 minute

  /**
   * Check if user has exceeded rate limit
   * @returns null if allowed, retry-after seconds if limited
   */
  check(userId: string): number | null {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Filter out requests outside the time window
    const recentRequests = userRequests.filter((timestamp) => now - timestamp < this.windowMs);

    if (recentRequests.length >= this.maxRequests) {
      // Calculate retry-after in seconds
      const oldestRequest = Math.min(...recentRequests);
      const retryAfterMs = this.windowMs - (now - oldestRequest);
      return Math.ceil(retryAfterMs / 1000);
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(userId, recentRequests);

    // Cleanup old entries periodically
    if (this.requests.size > 10000) {
      this.cleanup();
    }

    return null;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [userId, timestamps] of this.requests.entries()) {
      const recent = timestamps.filter((ts) => now - ts < this.windowMs);
      if (recent.length === 0) {
        this.requests.delete(userId);
      } else {
        this.requests.set(userId, recent);
      }
    }
  }
}

// Singleton instance
let rateLimiterInstance: FlightRateLimiter | null = null;

export function getFlightRateLimiter(): FlightRateLimiter {
  if (!rateLimiterInstance) {
    rateLimiterInstance = new FlightRateLimiter();
  }
  return rateLimiterInstance;
}
```

#### 5. API Route

**Location:** `src/app/api/v1/flights/search/route.ts`

```typescript
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/api/server-utils';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api/response';
import { RateLimitError } from '@/lib/api/errors';
import { RealTimeSearchSchema } from '@/lib/validations/flights.schema';
import { FlightSearchOrchestrator } from '@/lib/search/flight-search-orchestrator';
import { FlightCacheManager } from '@/lib/cache/flight-cache-manager';
import { getFlightRateLimiter } from '@/lib/rate-limiter/flight-rate-limiter';
import { getRedisClient } from '@/lib/redis/client';

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication
    const supabase = await createServerClient();
    const user = await requireUser(supabase);

    // 2. Rate Limiting
    const rateLimiter = getFlightRateLimiter();
    const retryAfter = rateLimiter.check(user.id);
    if (retryAfter !== null) {
      throw new RateLimitError(
        `Too many search requests. Please try again in ${retryAfter} seconds.`
      );
    }

    // 3. Parse and Validate Request Body
    const body = await request.json();
    const parseResult = RealTimeSearchSchema.safeParse(body);

    if (!parseResult.success) {
      return validationErrorResponse(parseResult.error);
    }

    const searchParams = parseResult.data;

    // 4. Additional Business Logic Validation
    if (searchParams.origin === searchParams.destination) {
      return validationErrorResponse({
        origin: 'Origin and destination cannot be the same',
      });
    }

    const departureDate = new Date(searchParams.departureDate);
    if (departureDate < new Date()) {
      return validationErrorResponse({
        departureDate: 'Departure date cannot be in the past',
      });
    }

    if (searchParams.returnDate) {
      const returnDate = new Date(searchParams.returnDate);
      if (returnDate < departureDate) {
        return validationErrorResponse({
          returnDate: 'Return date cannot be before departure date',
        });
      }
    }

    // 5. Execute Search
    const redisClient = await getRedisClient();
    const cacheManager = new FlightCacheManager(redisClient);
    const orchestrator = new FlightSearchOrchestrator(cacheManager);

    const searchResponse = await orchestrator.search({
      origin: searchParams.origin,
      destination: searchParams.destination,
      departureDate: searchParams.departureDate,
      returnDate: searchParams.returnDate,
      passengers: searchParams.passengers,
      cabinClass: searchParams.cabinClass,
    });

    // 6. Log Search
    await supabase.from('system_logs').insert({
      level: 'info',
      message: 'Flight search executed',
      metadata: {
        userId: user.id,
        searchId: searchResponse.searchId,
        source: searchResponse.metadata.source,
        resultCount: searchResponse.results.length,
      },
    });

    // 7. Return Response
    return successResponse(searchResponse);
  } catch (err) {
    return errorResponse(err as Error);
  }
}
```

#### 6. Validation Schemas Extension

**Location:** `src/lib/validations/flights.schema.ts` (extend existing file)

```typescript
// Add to existing flights.schema.ts

// Real-time search schema for external API calls
export const RealTimeSearchSchema = z.object({
  origin: z
    .string()
    .length(3, 'Origin must be a 3-letter IATA code')
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Origin must contain only letters'),
  destination: z
    .string()
    .length(3, 'Destination must be a 3-letter IATA code')
    .toUpperCase()
    .regex(/^[A-Z]{3}$/, 'Destination must contain only letters'),
  departureDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be in YYYY-MM-DD format'),
  returnDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be in YYYY-MM-DD format')
    .optional(),
  passengers: z
    .number()
    .int('Passengers must be an integer')
    .min(1, 'At least one passenger required')
    .max(9, 'Maximum 9 passengers allowed'),
  cabinClass: z.enum(['economy', 'business', 'first'], {
    errorMap: () => ({ message: 'Cabin class must be economy, business, or first' }),
  }),
});

export type RealTimeSearch = z.infer<typeof RealTimeSearchSchema>;
```

#### 7. Redis Client Setup

**Location:** `src/lib/redis/client.ts`

```typescript
import { Redis } from 'ioredis';

let redisClient: Redis | null = null;

export async function getRedisClient(): Promise<Redis> {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('REDIS_URL environment variable is not set');
  }

  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy: (times) => {
      if (times > 3) {
        return null; // Stop retrying
      }
      return Math.min(times * 100, 3000); // Exponential backoff
    },
  });

  redisClient.on('error', (err) => {
    console.error('Redis connection error:', err);
  });

  redisClient.on('connect', () => {
    console.log('Redis connected successfully');
  });

  return redisClient;
}

export function closeRedisClient(): void {
  if (redisClient) {
    redisClient.disconnect();
    redisClient = null;
  }
}
```

### Frontend Components

#### 1. Flight Search Form

**Location:** `src/components/flight-search/FlightSearchForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RealTimeSearchSchema, type RealTimeSearch } from '@/lib/validations/flights.schema';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface FlightSearchFormProps {
  onSearchComplete: (results: any) => void;
  onSearchStart: () => void;
}

export function FlightSearchForm({ onSearchComplete, onSearchStart }: FlightSearchFormProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RealTimeSearch>({
    resolver: zodResolver(RealTimeSearchSchema),
    defaultValues: {
      passengers: 1,
      cabinClass: 'economy',
    },
  });

  const departureDate = watch('departureDate');

  const onSubmit = async (data: RealTimeSearch) => {
    setIsSearching(true);
    setSearchError(null);
    onSearchStart();

    try {
      const response = await fetch('/api/v1/flights/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Search failed');
      }

      onSearchComplete(result.data);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : 'An unexpected error occurred'
      );
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Origin */}
        <div>
          <Label htmlFor="origin">From (Airport Code)</Label>
          <Input
            id="origin"
            {...register('origin')}
            placeholder="e.g., CAI"
            maxLength={3}
            aria-invalid={errors.origin ? 'true' : 'false'}
            aria-describedby={errors.origin ? 'origin-error' : undefined}
            className="uppercase"
          />
          {errors.origin && (
            <p id="origin-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.origin.message}
            </p>
          )}
        </div>

        {/* Destination */}
        <div>
          <Label htmlFor="destination">To (Airport Code)</Label>
          <Input
            id="destination"
            {...register('destination')}
            placeholder="e.g., DXB"
            maxLength={3}
            aria-invalid={errors.destination ? 'true' : 'false'}
            aria-describedby={errors.destination ? 'destination-error' : undefined}
            className="uppercase"
          />
          {errors.destination && (
            <p id="destination-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.destination.message}
            </p>
          )}
        </div>

        {/* Departure Date */}
        <div>
          <Label htmlFor="departureDate">Departure Date</Label>
          <DatePicker
            id="departureDate"
            selected={departureDate ? new Date(departureDate) : undefined}
            onSelect={(date) => setValue('departureDate', date?.toISOString().split('T')[0] || '')}
            minDate={new Date()}
            aria-invalid={errors.departureDate ? 'true' : 'false'}
            aria-describedby={errors.departureDate ? 'departure-error' : undefined}
          />
          {errors.departureDate && (
            <p id="departure-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.departureDate.message}
            </p>
          )}
        </div>

        {/* Return Date */}
        <div>
          <Label htmlFor="returnDate">Return Date (Optional)</Label>
          <DatePicker
            id="returnDate"
            selected={watch('returnDate') ? new Date(watch('returnDate')!) : undefined}
            onSelect={(date) => setValue('returnDate', date?.toISOString().split('T')[0])}
            minDate={departureDate ? new Date(departureDate) : new Date()}
            aria-invalid={errors.returnDate ? 'true' : 'false'}
            aria-describedby={errors.returnDate ? 'return-error' : undefined}
          />
          {errors.returnDate && (
            <p id="return-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.returnDate.message}
            </p>
          )}
        </div>

        {/* Passengers */}
        <div>
          <Label htmlFor="passengers">Passengers</Label>
          <Input
            id="passengers"
            type="number"
            {...register('passengers', { valueAsNumber: true })}
            min={1}
            max={9}
            aria-invalid={errors.passengers ? 'true' : 'false'}
            aria-describedby={errors.passengers ? 'passengers-error' : undefined}
          />
          {errors.passengers && (
            <p id="passengers-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.passengers.message}
            </p>
          )}
        </div>

        {/* Cabin Class */}
        <div>
          <Label htmlFor="cabinClass">Cabin Class</Label>
          <Select
            id="cabinClass"
            {...register('cabinClass')}
            aria-invalid={errors.cabinClass ? 'true' : 'false'}
            aria-describedby={errors.cabinClass ? 'cabin-error' : undefined}
          >
            <option value="economy">Economy</option>
            <option value="business">Business</option>
            <option value="first">First Class</option>
          </Select>
          {errors.cabinClass && (
            <p id="cabin-error" className="text-sm text-red-600 mt-1" role="alert">
              {errors.cabinClass.message}
            </p>
          )}
        </div>
      </div>

      {/* Error Message */}
      {searchError && (
        <div
          className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded"
          role="alert"
        >
          {searchError}
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isSearching}
        className="w-full md:w-auto min-w-[200px]"
        aria-busy={isSearching}
      >
        {isSearching ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            Searching Flights...
          </>
        ) : (
          'Search Flights'
        )}
      </Button>
    </form>
  );
}
```

#### 2. Flight Search Results

**Location:** `src/components/flight-search/FlightSearchResults.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { FlightResultCard } from './FlightResultCard';
import { FlightResult } from '@/types/flights';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';

interface FlightSearchResultsProps {
  results: FlightResult[];
  metadata: {
    source: string;
    cached: boolean;
    stale: boolean;
    timestamp: string;
  };
}

type SortOption = 'price-asc' | 'duration-asc' | 'departure-asc';

export function FlightSearchResults({ results, metadata }: FlightSearchResultsProps) {
  const [sortBy, setSortBy] = useState<SortOption>('price-asc');
  const [filterStops, setFilterStops] = useState<string>('all');
  const [filterAirline, setFilterAirline] = useState<string>('all');
  const [filterTimeRange, setFilterTimeRange] = useState<string>('all');

  // Extract unique airlines
  const airlines = useMemo(() => {
    const uniqueAirlines = Array.from(new Set(results.map((r) => r.airline)));
    return uniqueAirlines.sort();
  }, [results]);

  // Apply filters and sorting
  const filteredAndSortedResults = useMemo(() => {
    let filtered = [...results];

    // Filter by stops
    if (filterStops !== 'all') {
      const maxStops = parseInt(filterStops, 10);
      filtered = filtered.filter((r) => r.stops <= maxStops);
    }

    // Filter by airline
    if (filterAirline !== 'all') {
      filtered = filtered.filter((r) => r.airline === filterAirline);
    }

    // Filter by time range
    if (filterTimeRange !== 'all') {
      filtered = filtered.filter((r) => {
        const hour = new Date(r.departure.time).getHours();
        switch (filterTimeRange) {
          case 'morning':
            return hour >= 6 && hour < 12;
          case 'afternoon':
            return hour >= 12 && hour < 18;
          case 'evening':
            return hour >= 18 && hour < 24;
          case 'night':
            return hour >= 0 && hour < 6;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc':
          return a.price - b.price;
        case 'duration-asc':
          return a.duration - b.duration;
        case 'departure-asc':
          return new Date(a.departure.time).getTime() - new Date(b.departure.time).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }, [results, sortBy, filterStops, filterAirline, filterTimeRange]);

  const resultCount = filteredAndSortedResults.length;
  const totalCount = results.length;

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={metadata.cached ? 'secondary' : 'default'}>
            {metadata.source === 'google_flights' && 'Google Flights'}
            {metadata.source === 'amadeus' && 'Amadeus'}
            {metadata.source === 'cache_redis' && 'Cached (Fast)'}
            {metadata.source === 'cache_database' && 'Cached'}
            {metadata.source === 'cache_expired' && 'Cached (Expired)'}
          </Badge>
          {metadata.stale && (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
              <span className="text-sm">Prices may have changed</span>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600">
          <span className="sr-only">Search results:</span>
          {resultCount} {resultCount === 1 ? 'flight' : 'flights'}
          {resultCount !== totalCount && ` (filtered from ${totalCount})`}
        </p>
      </div>

      {/* Filters and Sort Controls */}
      <div
        className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg"
        role="region"
        aria-label="Filter and sort controls"
      >
        {/* Sort By */}
        <div>
          <Label htmlFor="sort-by">Sort By</Label>
          <Select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            aria-label="Sort results"
          >
            <option value="price-asc">Price (Low to High)</option>
            <option value="duration-asc">Duration (Shortest)</option>
            <option value="departure-asc">Departure Time (Earliest)</option>
          </Select>
        </div>

        {/* Filter by Stops */}
        <div>
          <Label htmlFor="filter-stops">Maximum Stops</Label>
          <Select
            id="filter-stops"
            value={filterStops}
            onChange={(e) => setFilterStops(e.target.value)}
            aria-label="Filter by number of stops"
          >
            <option value="all">Any</option>
            <option value="0">Direct Only</option>
            <option value="1">1 Stop or Less</option>
            <option value="2">2 Stops or Less</option>
          </Select>
        </div>

        {/* Filter by Airline */}
        <div>
          <Label htmlFor="filter-airline">Airline</Label>
          <Select
            id="filter-airline"
            value={filterAirline}
            onChange={(e) => setFilterAirline(e.target.value)}
            aria-label="Filter by airline"
          >
            <option value="all">All Airlines</option>
            {airlines.map((airline) => (
              <option key={airline} value={airline}>
                {airline}
              </option>
            ))}
          </Select>
        </div>

        {/* Filter by Time */}
        <div>
          <Label htmlFor="filter-time">Departure Time</Label>
          <Select
            id="filter-time"
            value={filterTimeRange}
            onChange={(e) => setFilterTimeRange(e.target.value)}
            aria-label="Filter by departure time"
          >
            <option value="all">Any Time</option>
            <option value="morning">Morning (6am - 12pm)</option>
            <option value="afternoon">Afternoon (12pm - 6pm)</option>
            <option value="evening">Evening (6pm - 12am)</option>
            <option value="night">Night (12am - 6am)</option>
          </Select>
        </div>
      </div>

      {/* Results List */}
      {resultCount === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">
            No flights found matching your filters. Try adjusting your search criteria.
          </p>
        </div>
      ) : (
        <div
          className="space-y-4"
          role="list"
          aria-label={`${resultCount} flight results`}
        >
          {filteredAndSortedResults.map((result) => (
            <div key={result.id} role="listitem">
              <FlightResultCard result={result} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

#### 3. Flight Result Card

**Location:** `src/components/flight-search/FlightResultCard.tsx`

```typescript
'use client';

import { FlightResult } from '@/types/flights';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plane, Clock, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface FlightResultCardProps {
  result: FlightResult;
}

export function FlightResultCard({ result }: FlightResultCardProps) {
  const departureTime = new Date(result.departure.time);
  const arrivalTime = new Date(result.arrival.time);
  const hours = Math.floor(result.duration / 60);
  const minutes = result.duration % 60;

  const handleBookNow = () => {
    window.open(result.bookingUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        {/* Airline and Flight Number */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Plane className="h-5 w-5 text-gray-600" aria-hidden="true" />
            <span className="font-semibold">{result.airline}</span>
          </div>
          {result.flightNumber && (
            <p className="text-sm text-gray-600">Flight {result.flightNumber}</p>
          )}
          <Badge variant="outline" className="mt-2">
            {result.cabinClass.charAt(0).toUpperCase() + result.cabinClass.slice(1)}
          </Badge>
        </div>

        {/* Departure Info */}
        <div>
          <p className="text-2xl font-bold">{format(departureTime, 'HH:mm')}</p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {result.departure.airport}
          </p>
          {result.departure.terminal && (
            <p className="text-xs text-gray-500">Terminal {result.departure.terminal}</p>
          )}
        </div>

        {/* Duration and Stops */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-gray-600" aria-hidden="true" />
            <span className="text-sm text-gray-600">
              {hours}h {minutes}m
            </span>
          </div>
          <div className="relative">
            <div className="border-t-2 border-gray-300"></div>
            {result.stops > 0 && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-2">
                <span className="text-xs text-gray-600">
                  {result.stops} {result.stops === 1 ? 'stop' : 'stops'}
                </span>
              </div>
            )}
          </div>
          {result.stops === 0 && (
            <p className="text-xs text-green-600 mt-1">Direct flight</p>
          )}
          {result.layovers && result.layovers.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              via {result.layovers.map((l) => l.airport).join(', ')}
            </p>
          )}
        </div>

        {/* Arrival Info */}
        <div>
          <p className="text-2xl font-bold">{format(arrivalTime, 'HH:mm')}</p>
          <p className="text-sm text-gray-600 flex items-center gap-1">
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {result.arrival.airport}
          </p>
          {result.arrival.terminal && (
            <p className="text-xs text-gray-500">Terminal {result.arrival.terminal}</p>
          )}
        </div>
      </div>

      {/* Price and Book Button */}
      <div className="flex items-center justify-between mt-6 pt-6 border-t">
        <div>
          <p className="text-3xl font-bold text-primary">
            {result.currency} {result.price.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500">Total price for all passengers</p>
        </div>
        <Button onClick={handleBookNow} size="lg" aria-label={`Book flight for ${result.currency} ${result.price}`}>
          Book Now
        </Button>
      </div>
    </Card>
  );
}
```

## Data Models

### TypeScript Types

**Location:** `src/types/flights.ts`

```typescript
export interface FlightResult {
  id: string;
  source: 'google_flights' | 'amadeus' | 'cache_redis' | 'cache_database' | 'cache_expired';
  price: number;
  currency: string;
  airline: string;
  flightNumber?: string;
  departure: {
    airport: string; // IATA code
    time: string; // ISO 8601
    terminal?: string;
  };
  arrival: {
    airport: string; // IATA code
    time: string; // ISO 8601
    terminal?: string;
  };
  duration: number; // minutes
  stops: number;
  layovers?: Array<{
    airport: string; // IATA code
    duration: number; // minutes
  }>;
  bookingUrl: string;
  cabinClass: 'economy' | 'business' | 'first';
}

export interface SearchResponse {
  searchId: string;
  results: FlightResult[];
  metadata: {
    source: string;
    cached: boolean;
    stale: boolean;
    timestamp: string;
  };
}

export interface CacheRecord {
  id?: string;
  search_params_hash: string;
  origin: string;
  destination: string;
  departure_date: string;
  return_date?: string;
  results_json: string; // JSON stringified FlightResult[]
  expires_at: string; // ISO 8601
  created_at: string; // ISO 8601
}
```

### Database Schema

**Table:** `flight_search_cache` (already exists in TABLES constant)

```sql
CREATE TABLE IF NOT EXISTS flight_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_params_hash VARCHAR(64) NOT NULL,
  origin VARCHAR(3) NOT NULL,
  destination VARCHAR(3) NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,
  results_json JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  INDEX idx_search_hash (search_params_hash),
  INDEX idx_expires_at (expires_at),
  INDEX idx_route_date (origin, destination, departure_date)
);
```

## External Dependencies

### NPM Packages

```json
{
  "dependencies": {
    "fast-flights": "^3.0.0",
    "amadeus": "^8.0.0",
    "ioredis": "^5.3.2"
  }
}
```

**Installation:**
```bash
npm install fast-flights amadeus ioredis
```

### Environment Variables

**Required in `.env.local`:**
```env
# Redis
REDIS_URL=redis://localhost:6379
# or for Upstash:
# REDIS_URL=rediss://default:YOUR_PASSWORD@YOUR_HOST.upstash.io:6379

# Amadeus API
AMADEUS_API_KEY=your_amadeus_client_id
AMADEUS_API_SECRET=your_amadeus_client_secret

# Existing Supabase vars (already configured)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Performance Optimizations

### 1. Redis Connection Pooling

- Use singleton pattern for Redis client
- Configure max retries and retry strategy
- Implement connection error handling

### 2. Parallel Cache Checks

If Redis is slow, implement parallel checks:

```typescript
async lookup(params: NormalizedSearchParams): Promise<CacheResult | null> {
  const [redisResult, supabaseResult] = await Promise.allSettled([
    this.lookupRedis(params),
    this.lookupSupabase(params),
  ]);

  // Return first successful result
  if (redisResult.status === 'fulfilled' && redisResult.value) {
    return redisResult.value;
  }

  if (supabaseResult.status === 'fulfilled' && supabaseResult.value) {
    // Update Redis for next time
    await this.storeRedis(params, supabaseResult.value.results);
    return supabaseResult.value;
  }

  return null;
}
```

### 3. Request Deduplication

Prevent duplicate concurrent searches for same parameters:

```typescript
private activeSearches: Map<string, Promise<SearchResponse>> = new Map();

async search(params: NormalizedSearchParams): Promise<SearchResponse> {
  const cacheKey = this.cacheManager.generateCacheKey(params);

  if (this.activeSearches.has(cacheKey)) {
    return this.activeSearches.get(cacheKey)!;
  }

  const searchPromise = this.executeSearch(params);
  this.activeSearches.set(cacheKey, searchPromise);

  try {
    const result = await searchPromise;
    return result;
  } finally {
    this.activeSearches.delete(cacheKey);
  }
}
```

### 4. Stale-While-Revalidate Pattern

For near-expired cache entries, return immediately and refresh in background:

```typescript
async lookup(params: NormalizedSearchParams): Promise<CacheResult | null> {
  const cached = await this.lookupRedis(params);
  
  if (cached) {
    // Check if expiring soon (within 5 minutes)
    const ttl = await this.redisClient.ttl(this.generateCacheKey(params));
    if (ttl < 300) {
      // Trigger background refresh (don't await)
      this.refreshCache(params).catch(console.error);
    }
    return cached;
  }

  return null;
}
```

## Security Considerations

### 1. Input Sanitization

- All inputs validated with Zod schemas
- IATA codes restricted to 3 uppercase letters
- Dates restricted to YYYY-MM-DD format
- No special characters allowed in search parameters

### 2. Rate Limiting

- 10 requests per user per minute
- In-memory tracking (can be upgraded to Redis for distributed systems)
- Returns 429 with Retry-After header

### 3. Sensitive Data Protection

- No API credentials in client code
- No scraping implementation details exposed in errors
- Cache keys do not contain user IDs or sensitive data
- Booking URLs sanitized and validated

### 4. HTTPS-Only Booking URLs

```typescript
private validateBookingUrl(url: string): string {
  const parsed = new URL(url);
  if (parsed.protocol !== 'https:') {
    throw new Error('Booking URL must use HTTPS');
  }
  return url;
}
```

### 5. CORS Configuration

**Location:** `src/app/api/v1/flights/search/route.ts`

```typescript
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': process.env.ALLOWED_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

## Error Handling Strategy

### Error Mapping

```typescript
// src/lib/api/errors.ts extensions
export class GoogleFlightsError extends AppError {
  constructor(message: string) {
    super(message, 502);
    this.code = 'GOOGLE_FLIGHTS_ERROR';
  }
}

export class AmadeusError extends AppError {
  constructor(message: string) {
    super(message, 502);
    this.code = 'AMADEUS_ERROR';
  }
}

export class CacheError extends AppError {
  constructor(message: string) {
    super(message, 500);
    this.code = 'CACHE_ERROR';
  }
}
```

### User-Facing Error Messages

**Client receives generic messages:**

| Internal Error | User Message |
|---------------|--------------|
| Google Flights timeout | "Flight search is taking longer than expected. Please try again." |
| Amadeus API error | "We're experiencing technical difficulties. Please try again in a few moments." |
| Rate limit exceeded | "You've made too many searches. Please wait {seconds} seconds." |
| Validation error | Specific field errors (e.g., "Origin must be a 3-letter airport code") |
| No results found | "No flights found matching your criteria. Try different dates or destinations." |

### Logging Strategy

```typescript
interface SearchLog {
  timestamp: string;
  userId: string;
  searchId: string;
  params: NormalizedSearchParams;
  source: string; // 'google_flights', 'amadeus', 'cache_redis', etc.
  resultCount: number;
  duration: number; // milliseconds
  error?: string;
}

async function logSearch(log: SearchLog): Promise<void> {
  const supabase = await createServerClient();
  await supabase.from(TABLES.systemLogs).insert({
    level: log.error ? 'error' : 'info',
    message: log.error || 'Flight search completed',
    metadata: log,
  });
}
```

## Testing Strategy

### 1. Unit Tests (Vitest)

**Test Coverage:**
- Validation schemas (all edge cases)
- Cache key generation
- Result normalization from Google Flights format
- Result normalization from Amadeus format
- Rate limiter logic
- Filter and sort logic in frontend components

**Example Test:**
```typescript
// src/lib/cache/__tests__/flight-cache-manager.test.ts
import { describe, it, expect } from 'vitest';
import { FlightCacheManager } from '../flight-cache-manager';

describe('FlightCacheManager', () => {
  describe('generateCacheKey', () => {
    it('should generate consistent cache keys for same parameters', () => {
      const manager = new FlightCacheManager(mockRedisClient);
      const params = {
        origin: 'CAI',
        destination: 'DXB',
        departureDate: '2024-03-15',
        returnDate: '2024-03-20',
        passengers: 2,
        cabinClass: 'economy' as const,
      };

      const key1 = manager.generateCacheKey(params);
      const key2 = manager.generateCacheKey(params);

      expect(key1).toBe(key2);
      expect(key1).toBe('flights:CAI:DXB:2024-03-15:2024-03-20:2:economy');
    });

    it('should generate different keys for different parameters', () => {
      const manager = new FlightCacheManager(mockRedisClient);
      const params1 = {
        origin: 'CAI',
        destination: 'DXB',
        departureDate: '2024-03-15',
        passengers: 2,
        cabinClass: 'economy' as const,
      };
      const params2 = { ...params1, passengers: 3 };

      const key1 = manager.generateCacheKey(params1);
      const key2 = manager.generateCacheKey(params2);

      expect(key1).not.toBe(key2);
    });
  });
});
```

### 2. Integration Tests

**Test Coverage:**
- API endpoint with mocked adapters
- Cache flow (Redis → Supabase → Fresh fetch)
- Fallback chain (Google → Amadeus → Expired Cache)
- Rate limiter with multiple requests

**Example Test:**
```typescript
// src/app/api/v1/flights/search/__tests__/route.test.ts
import { describe, it, expect, vi } from 'vitest';
import { POST } from '../route';

describe('POST /api/v1/flights/search', () => {
  it('should return cached results when available', async () => {
    // Mock cache hit
    vi.mock('@/lib/cache/flight-cache-manager', () => ({
      FlightCacheManager: vi.fn().mockImplementation(() => ({
        lookup: vi.fn().mockResolvedValue({
          results: mockFlightResults,
          source: 'cache_redis',
          stale: false,
        }),
      })),
    }));

    const request = new Request('http://localhost/api/v1/flights/search', {
      method: 'POST',
      body: JSON.stringify(validSearchParams),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data.metadata.source).toBe('cache_redis');
    expect(data.data.results).toHaveLength(mockFlightResults.length);
  });
});
```

### 3. E2E Tests (Playwright)

**Test Coverage:**
- Complete search flow from form submission to results display
- Filter and sort interactions
- Accessibility with screen reader navigation
- Mobile responsive layout

### 4. Load Testing

**Tool:** Apache JMeter or k6

**Test Scenarios:**
- 100 concurrent users searching different routes
- Rate limiter behavior under load
- Cache hit rate measurement
- Redis connection pool stability

### 5. Accessibility Testing

**Tool:** axe-core

**Coverage:**
- Form field labels and error announcements
- Keyboard navigation through all interactive elements
- Screen reader announcements for result count and filters
- Color contrast ratios (WCAG 2.1 AA)

## Deployment Considerations

### Environment Setup

1. **Redis Setup (Upstash Free Tier)**
   - Create account at upstash.com
   - Create Redis database
   - Copy REDIS_URL to `.env.local`

2. **Amadeus API Setup**
   - Create account at developers.amadeus.com
   - Create app and get API key/secret
   - Add credentials to `.env.local`

3. **Supabase Migration**
   - Check if `flight_search_cache` table exists
   - If not, run migration:
   ```sql
   -- Already exists in migration 115
   -- Table should be available
   ```

### Monitoring Setup

**Metrics to Track:**
- Cache hit rate (Redis vs Supabase vs miss)
- Source distribution (Google Flights vs Amadeus vs cache)
- Average search duration by source
- Error rate by error type
- Rate limit rejections per hour

**Logging:**
```typescript
// Example monitoring integration
interface SearchMetrics {
  searchId: string;
  userId: string;
  duration: number;
  source: string;
  cacheHit: boolean;
  resultCount: number;
  error?: string;
}

async function trackSearchMetrics(metrics: SearchMetrics): Promise<void> {
  // Send to monitoring service (e.g., DataDog, New Relic, CloudWatch)
  await fetch('https://monitoring-service.com/metrics', {
    method: 'POST',
    body: JSON.stringify(metrics),
  });
}
```

### Deployment Checklist

- [ ] Environment variables configured in Vercel/hosting platform
- [ ] Redis instance provisioned and accessible
- [ ] Amadeus API credentials validated
- [ ] Supabase migration verified
- [ ] Rate limiter tested under load
- [ ] Error monitoring configured
- [ ] Cache hit rate baseline established
- [ ] Accessibility audit passed
- [ ] Mobile responsive design verified
- [ ] HTTPS enforced for all booking URLs

### Scaling Considerations

**If traffic increases:**
1. **Upgrade Redis:** Move from Upstash free tier to paid plan
2. **Distributed Rate Limiting:** Move rate limiter to Redis
3. **CDN Caching:** Add Vercel Edge caching for common routes
4. **Database Indexes:** Add composite indexes on `flight_search_cache`
5. **Request Queuing:** Implement queue for background cache refreshes

## Design Decision Rationale

### Why Google Flights First?

- **Cost:** Unlimited free searches via web scraping
- **Coverage:** Comprehensive flight data across most airlines
- **Speed:** Direct scraping can be faster than API round-trips
- **Risk:** If scraping breaks, Amadeus provides full fallback

### Why Redis + Supabase Cache?

- **Redis:** Sub-millisecond reads for hot data
- **Supabase:** Persistent storage, queryable, survives Redis restarts
- **Together:** Best of both worlds - speed + reliability

### Why 30-Minute TTL?

- **Flight prices:** Can change frequently
- **User behavior:** Users typically compare and book within 30 minutes
- **Cost optimization:** Balances freshness with API call reduction
- **Stale fallback:** Expired cache provides last-resort data

### Why In-Memory Rate Limiter?

- **Simplicity:** No external dependency for MVP
- **Performance:** Zero latency overhead
- **Scale:** Can be upgraded to Redis when needed
- **Trade-off:** Single-server limitation (acceptable for initial deployment)

---

## Summary

This design provides a production-ready, scalable flight search integration with:

✅ **Hybrid data sourcing** (Google Flights + Amadeus)
✅ **Multi-layer caching** (Redis + Supabase)
✅ **Resilient fallback chain**
✅ **Performance optimizations** (< 3s cache hits, < 8s fresh searches)
✅ **Security hardening** (validation, rate limiting, sanitization)
✅ **Accessibility compliance** (WCAG 2.1 AA)
✅ **Mobile-first design**
✅ **Comprehensive error handling**
✅ **Production monitoring** (logs, metrics, alerts)

The architecture is modular, testable, and extensible for future enhancements like multi-city searches, fare alerts, or additional providers.
