-- =====================================================================
-- Migration 021: Flights Inventory
-- =====================================================================
-- Creates flights table with seat availability tracking
-- Creates flight_search_cache for API aggregator results
-- Supports manual entry + external API integration (Amadeus/Kiwi/SerpAPI)
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. FLIGHTS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.flights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Flight identity
  airline TEXT NOT NULL,                    -- e.g., 'EgyptAir', 'Air Cairo', 'Nile Air'
  flight_number TEXT NOT NULL,              -- e.g., 'MS123', 'SM456'
  aircraft_type TEXT,                       -- e.g., 'Boeing 737', 'Airbus A320'
  
  -- Route
  origin_iata TEXT NOT NULL,                -- 3-letter IATA code, e.g., 'CAI'
  origin_city TEXT NOT NULL,                -- e.g., 'Cairo', 'القاهرة'
  destination_iata TEXT NOT NULL,           -- e.g., 'SSH', 'JED', 'DXB'
  destination_city TEXT NOT NULL,           -- e.g., 'Sharm El Sheikh', 'شرم الشيخ'
  
  -- Schedule
  departure_at TIMESTAMPTZ NOT NULL,
  arrival_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (arrival_at - departure_at)) / 60
  ) STORED,
  
  -- Cabin class
  class TEXT NOT NULL CHECK (class IN ('economy', 'business', 'first')),
  
  -- Inventory
  seats_total INTEGER NOT NULL CHECK (seats_total > 0),
  seats_available INTEGER NOT NULL CHECK (seats_available >= 0 AND seats_available <= seats_total),
  
  -- Pricing (EGP only as per requirements)
  base_price NUMERIC(12,2) NOT NULL CHECK (base_price > 0),
  taxes_amount NUMERIC(12,2) DEFAULT 0 CHECK (taxes_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  
  -- Baggage & policies
  baggage_kg INTEGER DEFAULT 20 CHECK (baggage_kg >= 0),
  refundable BOOLEAN DEFAULT false,
  
  -- Visibility & status
  is_public BOOLEAN DEFAULT true,           -- Show on public site
  enabled BOOLEAN DEFAULT true,             -- Active inventory (staff can disable)
  
  -- External API tracking (optional — for aggregator-sourced flights)
  external_source TEXT CHECK (external_source IN ('manual', 'amadeus', 'kiwi', 'serpapi', 'google_flights')),
  external_id TEXT,                         -- API provider's flight ID
  last_synced_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_departure_arrival CHECK (arrival_at > departure_at),
  CONSTRAINT valid_iata_codes CHECK (
    LENGTH(origin_iata) = 3 AND 
    LENGTH(destination_iata) = 3 AND
    origin_iata ~ '^[A-Z]{3}$' AND
    destination_iata ~ '^[A-Z]{3}$'
  )
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_flights_departure ON public.flights(departure_at);
CREATE INDEX IF NOT EXISTS idx_flights_route ON public.flights(origin_iata, destination_iata);
CREATE INDEX IF NOT EXISTS idx_flights_public_enabled ON public.flights(is_public, enabled) WHERE is_public AND enabled;
CREATE INDEX IF NOT EXISTS idx_flights_airline ON public.flights(airline);
CREATE INDEX IF NOT EXISTS idx_flights_class ON public.flights(class);
CREATE INDEX IF NOT EXISTS idx_flights_external_source ON public.flights(external_source);

-- Unique constraint for manual flights (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_flights_unique_manual 
  ON public.flights(airline, flight_number, departure_at, class)
  WHERE external_source = 'manual' OR external_source IS NULL;

-- Unique constraint for external API flights
CREATE UNIQUE INDEX IF NOT EXISTS idx_flights_unique_external
  ON public.flights(external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

COMMENT ON TABLE public.flights IS 
  'Flight inventory — manual staff entry + external API aggregator results';

COMMENT ON COLUMN public.flights.seats_available IS 
  'Decremented atomically on booking via RPC functions';

COMMENT ON COLUMN public.flights.external_source IS 
  'Where this flight came from: manual (staff entered) or API provider name';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. FLIGHT SEARCH CACHE (for aggregator API results)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.flight_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Search parameters (composite key for cache lookup)
  origin_iata TEXT NOT NULL,
  destination_iata TEXT NOT NULL,
  departure_date DATE NOT NULL,
  return_date DATE,                         -- NULL for one-way
  passengers INTEGER NOT NULL DEFAULT 1,
  class TEXT NOT NULL,
  
  -- Cached API response
  results JSONB NOT NULL,                   -- Array of flight objects from API
  result_count INTEGER NOT NULL,
  source TEXT NOT NULL,                     -- 'amadeus', 'kiwi', 'serpapi', etc.
  
  -- Cache metadata
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Composite index for fast cache lookup
CREATE INDEX IF NOT EXISTS idx_flight_cache_lookup 
  ON public.flight_search_cache(
    origin_iata, 
    destination_iata, 
    departure_date, 
    return_date, 
    passengers, 
    class
  )
  WHERE expires_at > now();

-- Index for cache cleanup
CREATE INDEX IF NOT EXISTS idx_flight_cache_expires 
  ON public.flight_search_cache(expires_at);

COMMENT ON TABLE public.flight_search_cache IS 
  'Caches external API flight search results (15min TTL) to reduce API calls';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. HELPER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function: Search available flights (public-facing)
CREATE OR REPLACE FUNCTION public.search_flights(
  p_origin TEXT,
  p_destination TEXT,
  p_departure_date DATE,
  p_return_date DATE DEFAULT NULL,
  p_passengers INTEGER DEFAULT 1,
  p_class TEXT DEFAULT 'economy'
)
RETURNS TABLE (
  id UUID,
  airline TEXT,
  flight_number TEXT,
  origin_iata TEXT,
  origin_city TEXT,
  destination_iata TEXT,
  destination_city TEXT,
  departure_at TIMESTAMPTZ,
  arrival_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  class TEXT,
  seats_available INTEGER,
  base_price NUMERIC,
  taxes_amount NUMERIC,
  total_price NUMERIC,
  baggage_kg INTEGER,
  refundable BOOLEAN
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    f.id,
    f.airline,
    f.flight_number,
    f.origin_iata,
    f.origin_city,
    f.destination_iata,
    f.destination_city,
    f.departure_at,
    f.arrival_at,
    f.duration_minutes,
    f.class,
    f.seats_available,
    f.base_price,
    f.taxes_amount,
    (f.base_price + f.taxes_amount) * p_passengers AS total_price,
    f.baggage_kg,
    f.refundable
  FROM public.flights f
  WHERE f.is_public = true
    AND f.enabled = true
    AND f.seats_available >= p_passengers
    AND f.origin_iata = UPPER(p_origin)
    AND f.destination_iata = UPPER(p_destination)
    AND f.class = p_class
    AND DATE(f.departure_at) = p_departure_date
    AND f.departure_at > now()  -- Only future flights
  ORDER BY f.base_price ASC, f.departure_at ASC;
$$;

COMMENT ON FUNCTION public.search_flights IS 
  'Public flight search — returns available flights matching criteria, sorted by price';

-- Function: Get flight details by ID (public-facing)
CREATE OR REPLACE FUNCTION public.get_flight_details(p_flight_id UUID)
RETURNS TABLE (
  id UUID,
  airline TEXT,
  flight_number TEXT,
  aircraft_type TEXT,
  origin_iata TEXT,
  origin_city TEXT,
  destination_iata TEXT,
  destination_city TEXT,
  departure_at TIMESTAMPTZ,
  arrival_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  class TEXT,
  seats_available INTEGER,
  base_price NUMERIC,
  taxes_amount NUMERIC,
  currency TEXT,
  baggage_kg INTEGER,
  refundable BOOLEAN
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    f.id,
    f.airline,
    f.flight_number,
    f.aircraft_type,
    f.origin_iata,
    f.origin_city,
    f.destination_iata,
    f.destination_city,
    f.departure_at,
    f.arrival_at,
    f.duration_minutes,
    f.class,
    f.seats_available,
    f.base_price,
    f.taxes_amount,
    f.currency,
    f.baggage_kg,
    f.refundable
  FROM public.flights f
  WHERE f.id = p_flight_id
    AND f.is_public = true
    AND f.enabled = true;
$$;

COMMENT ON FUNCTION public.get_flight_details IS 
  'Fetch single flight details by ID — used on detail/booking pages';

-- Function: Cleanup expired flight search cache
CREATE OR REPLACE FUNCTION public.cleanup_flight_cache()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.flight_search_cache
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON FUNCTION public.cleanup_flight_cache IS 
  'Deletes expired cache entries — call via cron job or before search';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trigger function: Update timestamps
CREATE OR REPLACE FUNCTION public.update_flights_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_flights_updated ON public.flights;
CREATE TRIGGER on_flights_updated
  BEFORE UPDATE ON public.flights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_flights_timestamp();

-- =====================================================================
-- MIGRATION 021 COMPLETE ✅
-- =====================================================================
-- Tables: flights, flight_search_cache
-- Functions: search_flights(), get_flight_details(), cleanup_flight_cache()
-- Indexes: route, departure, public/enabled, unique constraints
-- Supports: manual staff entry + external API aggregator integration
-- =====================================================================
