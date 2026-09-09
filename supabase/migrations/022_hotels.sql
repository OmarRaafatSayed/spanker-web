-- =====================================================================
-- Migration 022: Hotels Inventory
-- =====================================================================
-- Creates hotels table with per-date room availability tracking
-- Supports staff manual entry (dashboard) + Excel/Word import helper
-- Date-based inventory prevents double-booking conflicts
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. HOTELS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,                -- URL-friendly: 'marsa-alam-royal-beach'
  
  -- Location
  city TEXT NOT NULL,                       -- e.g., 'Marsa Alam', 'Sharm El Sheikh'
  country TEXT NOT NULL DEFAULT 'Egypt',
  address TEXT,
  latitude NUMERIC(10, 7),                  -- For map integration
  longitude NUMERIC(10, 7),
  
  -- Classification
  star_rating INTEGER CHECK (star_rating BETWEEN 1 AND 5),
  
  -- Media
  images TEXT[] DEFAULT '{}',               -- Array of image URLs
  cover_image TEXT,                         -- Primary hero image
  
  -- Amenities & features
  amenities TEXT[] DEFAULT '{}',            -- ['pool', 'wifi', 'spa', 'gym', 'restaurant', 'beach_access']
  
  -- Descriptions (bilingual)
  description_ar TEXT,
  description_en TEXT,
  
  -- Check-in/out times
  check_in_time TIME DEFAULT '14:00',
  check_out_time TIME DEFAULT '12:00',
  
  -- Default inventory (total rooms — actual availability tracked per-date)
  rooms_total INTEGER NOT NULL CHECK (rooms_total > 0),
  rooms_available INTEGER NOT NULL CHECK (rooms_available >= 0 AND rooms_available <= rooms_total),
  
  -- Default pricing (base rate — can be overridden per date)
  price_per_night NUMERIC(12,2) NOT NULL CHECK (price_per_night > 0),
  taxes_percent NUMERIC(5,2) DEFAULT 14 CHECK (taxes_percent >= 0 AND taxes_percent <= 100),
  currency TEXT NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  
  -- Cancellation policy
  cancellation_hours INTEGER DEFAULT 72,    -- Free cancellation before X hours
  
  -- Visibility
  is_featured BOOLEAN DEFAULT false,        -- Show in featured section
  is_public BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hotels_city ON public.hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_star_rating ON public.hotels(star_rating);
CREATE INDEX IF NOT EXISTS idx_hotels_featured ON public.hotels(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_hotels_public_enabled ON public.hotels(is_public, enabled) WHERE is_public AND enabled;

COMMENT ON TABLE public.hotels IS 
  'Hotel inventory — staff manual entry via dashboard';

COMMENT ON COLUMN public.hotels.slug IS 
  'URL-safe unique identifier for SEO-friendly URLs';

COMMENT ON COLUMN public.hotels.rooms_available IS 
  'Global room count — actual per-date availability tracked in hotel_room_availability';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. HOTEL ROOM AVAILABILITY (per-date inventory)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.hotel_room_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  
  -- Date-specific inventory
  date DATE NOT NULL,
  room_type TEXT NOT NULL,                  -- 'standard', 'deluxe', 'suite', 'family'
  rooms_left INTEGER NOT NULL CHECK (rooms_left >= 0),
  
  -- Optional per-date price override
  price_override NUMERIC(12,2) CHECK (price_override > 0),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate entries per hotel/date/room_type
  CONSTRAINT unique_hotel_date_room UNIQUE (hotel_id, date, room_type)
);

-- Composite index for fast availability lookup
CREATE INDEX IF NOT EXISTS idx_room_avail_hotel_date 
  ON public.hotel_room_availability(hotel_id, date)
  WHERE rooms_left > 0;

CREATE INDEX IF NOT EXISTS idx_room_avail_date_range 
  ON public.hotel_room_availability(date)
  WHERE rooms_left > 0;

COMMENT ON TABLE public.hotel_room_availability IS 
  'Per-date room inventory — prevents double-booking conflicts';

COMMENT ON COLUMN public.hotel_room_availability.rooms_left IS 
  'Decremented atomically on booking via RPC function';

COMMENT ON COLUMN public.hotel_room_availability.price_override IS 
  'Overrides hotel.price_per_night for this specific date (peak season pricing)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. HELPER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function: Search available hotels (public-facing)
CREATE OR REPLACE FUNCTION public.search_hotels(
  p_city TEXT DEFAULT NULL,
  p_check_in DATE DEFAULT NULL,
  p_check_out DATE DEFAULT NULL,
  p_guests INTEGER DEFAULT 2,
  p_rooms INTEGER DEFAULT 1,
  p_min_stars INTEGER DEFAULT 1,
  p_max_stars INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  city TEXT,
  address TEXT,
  star_rating INTEGER,
  cover_image TEXT,
  amenities TEXT[],
  description_ar TEXT,
  description_en TEXT,
  price_per_night NUMERIC,
  taxes_percent NUMERIC,
  total_price NUMERIC,
  rooms_available INTEGER,
  is_featured BOOLEAN
)
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  nights INTEGER;
BEGIN
  -- Calculate number of nights
  nights := CASE 
    WHEN p_check_in IS NOT NULL AND p_check_out IS NOT NULL 
    THEN (p_check_out - p_check_in)
    ELSE 1 
  END;

  -- If dates provided, check per-date availability
  IF p_check_in IS NOT NULL AND p_check_out IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      h.id,
      h.name,
      h.slug,
      h.city,
      h.address,
      h.star_rating,
      h.cover_image,
      h.amenities,
      h.description_ar,
      h.description_en,
      h.price_per_night,
      h.taxes_percent,
      -- Total = (price * nights * rooms) + taxes
      ROUND(
        (h.price_per_night * nights * p_rooms) * 
        (1 + h.taxes_percent / 100), 
        2
      ) AS total_price,
      h.rooms_available,
      h.is_featured
    FROM public.hotels h
    WHERE h.is_public = true
      AND h.enabled = true
      AND (p_city IS NULL OR h.city ILIKE '%' || p_city || '%')
      AND (h.star_rating >= p_min_stars AND h.star_rating <= p_max_stars)
      -- Check that ALL nights in range have sufficient availability
      AND NOT EXISTS (
        SELECT 1 FROM generate_series(p_check_in, p_check_out - 1, '1 day'::interval) AS night_date
        WHERE NOT EXISTS (
          SELECT 1 FROM public.hotel_room_availability avail
          WHERE avail.hotel_id = h.id
            AND avail.date = night_date::date
            AND avail.rooms_left >= p_rooms
        )
      )
    ORDER BY h.is_featured DESC, h.price_per_night ASC;
  ELSE
    -- No dates: just return hotels by price
    RETURN QUERY
    SELECT 
      h.id,
      h.name,
      h.slug,
      h.city,
      h.address,
      h.star_rating,
      h.cover_image,
      h.amenities,
      h.description_ar,
      h.description_en,
      h.price_per_night,
      h.taxes_percent,
      ROUND(
        (h.price_per_night * nights * p_rooms) * 
        (1 + h.taxes_percent / 100), 
        2
      ) AS total_price,
      h.rooms_available,
      h.is_featured
    FROM public.hotels h
    WHERE h.is_public = true
      AND h.enabled = true
      AND (p_city IS NULL OR h.city ILIKE '%' || p_city || '%')
      AND (h.star_rating >= p_min_stars AND h.star_rating <= p_max_stars)
    ORDER BY h.is_featured DESC, h.price_per_night ASC;
  END IF;
END;
$$;

COMMENT ON FUNCTION public.search_hotels IS 
  'Public hotel search — checks per-date availability if dates provided, returns sorted by featured + price';

-- Function: Get hotel details by ID or slug
CREATE OR REPLACE FUNCTION public.get_hotel_details(p_identifier TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  city TEXT,
  country TEXT,
  address TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  star_rating INTEGER,
  images TEXT[],
  cover_image TEXT,
  amenities TEXT[],
  description_ar TEXT,
  description_en TEXT,
  check_in_time TIME,
  check_out_time TIME,
  rooms_total INTEGER,
  rooms_available INTEGER,
  price_per_night NUMERIC,
  taxes_percent NUMERIC,
  currency TEXT,
  cancellation_hours INTEGER,
  is_featured BOOLEAN
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    h.id,
    h.name,
    h.slug,
    h.city,
    h.country,
    h.address,
    h.latitude,
    h.longitude,
    h.star_rating,
    h.images,
    h.cover_image,
    h.amenities,
    h.description_ar,
    h.description_en,
    h.check_in_time,
    h.check_out_time,
    h.rooms_total,
    h.rooms_available,
    h.price_per_night,
    h.taxes_percent,
    h.currency,
    h.cancellation_hours,
    h.is_featured
  FROM public.hotels h
  WHERE h.is_public = true
    AND h.enabled = true
    AND (
      h.id::text = p_identifier
      OR h.slug = p_identifier
    );
$$;

COMMENT ON FUNCTION public.get_hotel_details IS 
  'Fetch single hotel by ID or slug — used on detail/booking pages';

-- Function: Initialize availability for hotel (staff helper)
CREATE OR REPLACE FUNCTION public.init_hotel_availability(
  p_hotel_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_room_types TEXT[] DEFAULT ARRAY['standard', 'deluxe', 'suite'],
  p_rooms_per_type INTEGER DEFAULT 10
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  inserted_count INTEGER := 0;
  current_date DATE;
  room_type TEXT;
BEGIN
  -- Check caller is staff
  IF NOT public.is_staff() THEN
    RAISE EXCEPTION 'Access denied: staff only';
  END IF;

  -- Loop through date range
  FOR current_date IN SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date
  LOOP
    -- Loop through room types
    FOREACH room_type IN ARRAY p_room_types
    LOOP
      INSERT INTO public.hotel_room_availability (hotel_id, date, room_type, rooms_left)
      VALUES (p_hotel_id, current_date, room_type, p_rooms_per_type)
      ON CONFLICT (hotel_id, date, room_type) DO NOTHING;
      
      inserted_count := inserted_count + 1;
    END LOOP;
  END LOOP;

  RETURN inserted_count;
END;
$$;

COMMENT ON FUNCTION public.init_hotel_availability IS 
  'Staff-only: bulk insert availability records for a date range';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trigger function: Update timestamps
CREATE OR REPLACE FUNCTION public.update_hotels_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_hotels_updated ON public.hotels;
CREATE TRIGGER on_hotels_updated
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hotels_timestamp();

DROP TRIGGER IF EXISTS on_room_avail_updated ON public.hotel_room_availability;
CREATE TRIGGER on_room_avail_updated
  BEFORE UPDATE ON public.hotel_room_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_hotels_timestamp();

-- =====================================================================
-- MIGRATION 022 COMPLETE ✅
-- =====================================================================
-- Tables: hotels, hotel_room_availability
-- Functions: search_hotels(), get_hotel_details(), init_hotel_availability()
-- Date-based availability prevents double-booking conflicts
-- Indexes: city, star_rating, featured, per-date availability lookup
-- =====================================================================
