-- =====================================================================
-- Migration 024: Trips (Tours/Packages)
-- =====================================================================
-- Creates trips table with itinerary builder
-- Staff manual entry (special offers) via dashboard
-- Spots-based inventory (group tours with limited capacity)
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. TRIPS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity (bilingual)
  title_ar TEXT NOT NULL,
  title_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,                -- URL-friendly: 'marsa-alam-dive-safari-5-days'
  
  -- Destination
  destination TEXT NOT NULL,                -- e.g., 'Marsa Alam', 'Siwa Oasis', 'Dahab'
  country TEXT NOT NULL DEFAULT 'Egypt',
  
  -- Duration
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  
  -- Schedule (fixed departure dates)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  
  -- Inventory (group tour capacity)
  group_size_max INTEGER NOT NULL CHECK (group_size_max > 0),
  spots_available INTEGER NOT NULL CHECK (spots_available >= 0 AND spots_available <= group_size_max),
  
  -- Itinerary (day-by-day JSONB)
  itinerary JSONB NOT NULL DEFAULT '[]',
  -- Example: [
  --   {"day": 1, "title": "Arrival & Beach Relaxation", "description": "...", "activities": ["airport_pickup", "hotel_checkin", "beach_time"]},
  --   {"day": 2, "title": "Diving at Elphinstone Reef", "description": "...", "activities": ["breakfast", "morning_dive", "lunch", "afternoon_dive"]},
  --   ...
  -- ]
  
  -- What's included/excluded
  includes TEXT[] DEFAULT '{}',
  -- Example: ['Accommodation (4 nights)', 'Daily breakfast', 'Airport transfers', 'Professional dive guide', 'Equipment rental']
  
  excludes TEXT[] DEFAULT '{}',
  -- Example: ['International flights', 'Travel insurance', 'Personal expenses', 'Alcoholic beverages']
  
  -- Pricing (per person)
  price_per_person NUMERIC(12,2) NOT NULL CHECK (price_per_person > 0),
  currency TEXT NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  
  -- Media
  cover_image TEXT,
  gallery TEXT[] DEFAULT '{}',
  
  -- Difficulty level
  difficulty TEXT CHECK (difficulty IN ('easy', 'moderate', 'challenging')),
  
  -- Meeting point
  meeting_point TEXT,
  meeting_time TIME,
  
  -- Cancellation policy
  cancellation_days INTEGER DEFAULT 14,     -- Free cancellation before X days
  
  -- Visibility
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_trip_dates CHECK (end_date > start_date),
  CONSTRAINT valid_duration CHECK (duration_days = (end_date - start_date))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_trips_destination ON public.trips(destination);
CREATE INDEX IF NOT EXISTS idx_trips_start_date ON public.trips(start_date);
CREATE INDEX IF NOT EXISTS idx_trips_difficulty ON public.trips(difficulty);
CREATE INDEX IF NOT EXISTS idx_trips_featured ON public.trips(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_trips_public_enabled ON public.trips(is_public, enabled) WHERE is_public AND enabled;
CREATE INDEX IF NOT EXISTS idx_trips_availability ON public.trips(spots_available) WHERE spots_available > 0;

COMMENT ON TABLE public.trips IS 
  'Trip packages (tours/special offers) — staff manual entry, fixed departure dates, group capacity';

COMMENT ON COLUMN public.trips.itinerary IS 
  'Day-by-day itinerary as JSONB array — [{day, title, description, activities}]';

COMMENT ON COLUMN public.trips.spots_available IS 
  'Decremented atomically on booking via RPC functions';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. HELPER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function: Search available trips (public-facing)
CREATE OR REPLACE FUNCTION public.search_trips(
  p_destination TEXT DEFAULT NULL,
  p_start_date_from DATE DEFAULT NULL,
  p_start_date_to DATE DEFAULT NULL,
  p_min_duration INTEGER DEFAULT NULL,
  p_max_duration INTEGER DEFAULT NULL,
  p_difficulty TEXT DEFAULT NULL,
  p_min_spots INTEGER DEFAULT 1
)
RETURNS TABLE (
  id UUID,
  title_ar TEXT,
  title_en TEXT,
  slug TEXT,
  destination TEXT,
  duration_days INTEGER,
  start_date DATE,
  end_date DATE,
  spots_available INTEGER,
  group_size_max INTEGER,
  price_per_person NUMERIC,
  currency TEXT,
  cover_image TEXT,
  difficulty TEXT,
  includes TEXT[],
  excludes TEXT[],
  is_featured BOOLEAN
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    t.id,
    t.title_ar,
    t.title_en,
    t.slug,
    t.destination,
    t.duration_days,
    t.start_date,
    t.end_date,
    t.spots_available,
    t.group_size_max,
    t.price_per_person,
    t.currency,
    t.cover_image,
    t.difficulty,
    t.includes,
    t.excludes,
    t.is_featured
  FROM public.trips t
  WHERE t.is_public = true
    AND t.enabled = true
    AND t.spots_available >= p_min_spots
    AND t.start_date >= CURRENT_DATE  -- Only upcoming trips
    AND (p_destination IS NULL OR t.destination ILIKE '%' || p_destination || '%')
    AND (p_start_date_from IS NULL OR t.start_date >= p_start_date_from)
    AND (p_start_date_to IS NULL OR t.start_date <= p_start_date_to)
    AND (p_min_duration IS NULL OR t.duration_days >= p_min_duration)
    AND (p_max_duration IS NULL OR t.duration_days <= p_max_duration)
    AND (p_difficulty IS NULL OR t.difficulty = p_difficulty)
  ORDER BY t.is_featured DESC, t.start_date ASC, t.price_per_person ASC;
$$;

COMMENT ON FUNCTION public.search_trips IS 
  'Public trip search — returns upcoming trips with available spots, sorted by featured + start date + price';

-- Function: Get trip details by ID or slug
CREATE OR REPLACE FUNCTION public.get_trip_details(p_identifier TEXT)
RETURNS TABLE (
  id UUID,
  title_ar TEXT,
  title_en TEXT,
  slug TEXT,
  destination TEXT,
  country TEXT,
  duration_days INTEGER,
  start_date DATE,
  end_date DATE,
  group_size_max INTEGER,
  spots_available INTEGER,
  itinerary JSONB,
  includes TEXT[],
  excludes TEXT[],
  price_per_person NUMERIC,
  currency TEXT,
  cover_image TEXT,
  gallery TEXT[],
  difficulty TEXT,
  meeting_point TEXT,
  meeting_time TIME,
  cancellation_days INTEGER,
  is_featured BOOLEAN
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    t.id,
    t.title_ar,
    t.title_en,
    t.slug,
    t.destination,
    t.country,
    t.duration_days,
    t.start_date,
    t.end_date,
    t.group_size_max,
    t.spots_available,
    t.itinerary,
    t.includes,
    t.excludes,
    t.price_per_person,
    t.currency,
    t.cover_image,
    t.gallery,
    t.difficulty,
    t.meeting_point,
    t.meeting_time,
    t.cancellation_days,
    t.is_featured
  FROM public.trips t
  WHERE t.is_public = true
    AND t.enabled = true
    AND (
      t.id::text = p_identifier
      OR t.slug = p_identifier
    );
$$;

COMMENT ON FUNCTION public.get_trip_details IS 
  'Fetch single trip by ID or slug — used on detail/booking pages';

-- Function: Get trip itinerary (separate endpoint for detailed view)
CREATE OR REPLACE FUNCTION public.get_trip_itinerary(p_trip_id UUID)
RETURNS JSONB
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT itinerary
  FROM public.trips
  WHERE id = p_trip_id
    AND is_public = true
    AND enabled = true;
$$;

COMMENT ON FUNCTION public.get_trip_itinerary IS 
  'Fetch full itinerary JSONB for a trip — used for itinerary timeline component';

-- Function: Check spot availability (used before booking)
CREATE OR REPLACE FUNCTION public.check_trip_availability(
  p_trip_id UUID,
  p_travelers INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  v_spots_available INTEGER;
  v_start_date DATE;
BEGIN
  SELECT spots_available, start_date
  INTO v_spots_available, v_start_date
  FROM public.trips
  WHERE id = p_trip_id
    AND is_public = true
    AND enabled = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'Trip not found or not available'
    );
  END IF;

  IF v_start_date < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'Trip has already departed'
    );
  END IF;

  IF v_spots_available < p_travelers THEN
    RETURN jsonb_build_object(
      'available', false,
      'spots_available', v_spots_available,
      'requested', p_travelers,
      'error', 'Insufficient spots available'
    );
  END IF;

  RETURN jsonb_build_object(
    'available', true,
    'spots_available', v_spots_available
  );
END;
$$;

COMMENT ON FUNCTION public.check_trip_availability IS 
  'Validates trip availability before booking — checks spots + departure date';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trigger function: Update timestamps
CREATE OR REPLACE FUNCTION public.update_trips_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_trips_updated ON public.trips;
CREATE TRIGGER on_trips_updated
  BEFORE UPDATE ON public.trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_trips_timestamp();

-- =====================================================================
-- MIGRATION 024 COMPLETE ✅
-- =====================================================================
-- Tables: trips
-- Functions: search_trips(), get_trip_details(), get_trip_itinerary(), check_trip_availability()
-- Itinerary stored as JSONB for flexible day-by-day structure
-- Spots-based inventory with atomic decrement on booking
-- Indexes: destination, start_date, difficulty, featured, availability
-- =====================================================================
