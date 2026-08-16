-- =====================================================================
-- Phase 1: Visa Types, Hotels, Hotel Rooms, Offers, Visa Document Requirements
-- New tables for the admin content management system
-- =====================================================================

-- 1. visa_types — Visa product catalog per country
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.visa_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,              -- 'AE', 'TR', 'HU', etc.
  country_name TEXT NOT NULL,
  visa_name TEXT NOT NULL,                 -- 'تأشيرة شهر VIP'
  duration_days INTEGER NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'vip', 'standard', 'urgent', 'multi_entry', 'extension'
  )),
  profession_tier TEXT CHECK (profession_tier IN (
    'high', 'medium', 'weak', 'none'
  )),
  price NUMERIC(12,2) NOT NULL,
  deposit_amount NUMERIC(12,2) DEFAULT 0,  -- مبلغ التأمين المسترد
  child_price NUMERIC(12,2),
  processing_days INTEGER NOT NULL DEFAULT 3,
  is_urgent_available BOOLEAN DEFAULT FALSE,
  urgent_price NUMERIC(12,2),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visa_types_country_code ON public.visa_types(country_code);
CREATE INDEX IF NOT EXISTS idx_visa_types_active ON public.visa_types(is_active);
CREATE INDEX IF NOT EXISTS idx_visa_types_category ON public.visa_types(category);

ALTER TABLE public.visa_types ENABLE ROW LEVEL SECURITY;

-- Public can read active visa types
CREATE POLICY "public_read_active_visa_types"
  ON public.visa_types FOR SELECT
  USING (is_active = true);

-- Admin/staff can do everything
CREATE POLICY "admin_manage_visa_types"
  ON public.visa_types FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

COMMENT ON TABLE public.visa_types IS
  'Visa product catalog per country — manages pricing tiers, categories, and processing info';

-- 2. hotels — Hotel catalog with full metadata
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.hotels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stars INTEGER CHECK (stars BETWEEN 1 AND 5),
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  google_maps_url TEXT,
  amenities JSONB DEFAULT '[]',
  check_in_time TEXT,
  check_out_time TEXT,
  cancellation_policy TEXT,
  booking_conditions TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  cover_image TEXT,
  images JSONB DEFAULT '[]',
  description TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotels_country ON public.hotels(country);
CREATE INDEX IF NOT EXISTS idx_hotels_city ON public.hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_active ON public.hotels(is_active);
CREATE INDEX IF NOT EXISTS idx_hotels_stars ON public.hotels(stars);

ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_hotels"
  ON public.hotels FOR SELECT
  USING (is_active = true);

CREATE POLICY "admin_manage_hotels"
  ON public.hotels FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

COMMENT ON TABLE public.hotels IS
  'Hotel catalog — managed by admin, publicly readable when active';

-- 3. hotel_rooms — Room types per hotel
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE CASCADE,
  room_type TEXT NOT NULL,
  board_type TEXT NOT NULL CHECK (board_type IN (
    'room_only', 'bed_breakfast', 'half_board', 'full_board'
  )),
  price_per_night NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP',
  max_occupancy INTEGER DEFAULT 2,
  description TEXT,
  images JSONB DEFAULT '[]',
  is_available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hotel_rooms_hotel_id ON public.hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_rooms_available ON public.hotel_rooms(is_available);

ALTER TABLE public.hotel_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_hotel_rooms"
  ON public.hotel_rooms FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.hotels WHERE id = hotel_id AND is_active = true
    )
  );

CREATE POLICY "admin_manage_hotel_rooms"
  ON public.hotel_rooms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

COMMENT ON TABLE public.hotel_rooms IS
  'Room types per hotel — pricing and availability managed by admin';

-- 4. offers — Special offers / promotional listings
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  offer_type TEXT NOT NULL CHECK (offer_type IN (
    'flight', 'hotel', 'visa', 'package'
  )),
  destination TEXT NOT NULL,
  original_price NUMERIC(12,2),
  discounted_price NUMERIC(12,2) NOT NULL,
  discount_percent NUMERIC(5,2),
  currency TEXT DEFAULT 'EGP',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  description TEXT,
  terms_and_conditions TEXT,
  images JSONB DEFAULT '[]',
  available_slots INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offers_active ON public.offers(is_active);
CREATE INDEX IF NOT EXISTS idx_offers_type ON public.offers(offer_type);
CREATE INDEX IF NOT EXISTS idx_offers_end_date ON public.offers(end_date);
CREATE INDEX IF NOT EXISTS idx_offers_destination ON public.offers(destination);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_offers"
  ON public.offers FOR SELECT
  USING (
    is_active = true
    AND (start_date IS NULL OR start_date <= now())
    AND (end_date IS NULL OR end_date >= now())
  );

CREATE POLICY "admin_manage_offers"
  ON public.offers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

COMMENT ON TABLE public.offers IS
  'Promotional offers — flight, hotel, visa, package deals with expiry control';

-- 5. visa_document_requirements — Dynamic document checklist per visa type
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.visa_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  visa_type_id UUID REFERENCES public.visa_types(id) ON DELETE CASCADE,
  document_key TEXT NOT NULL,
  document_label TEXT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  conditions JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vdr_country_code ON public.visa_document_requirements(country_code);
CREATE INDEX IF NOT EXISTS idx_vdr_visa_type_id ON public.visa_document_requirements(visa_type_id);
CREATE INDEX IF NOT EXISTS idx_vdr_sort_order ON public.visa_document_requirements(sort_order);

ALTER TABLE public.visa_document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_visa_doc_requirements"
  ON public.visa_document_requirements FOR SELECT
  USING (true);

CREATE POLICY "admin_manage_visa_doc_requirements"
  ON public.visa_document_requirements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

COMMENT ON TABLE public.visa_document_requirements IS
  'Dynamic document checklist per country/visa type — replaces hardcoded lists';

-- 6. updated_at trigger function (shared)
-- =====================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_visa_types_updated_at
  BEFORE UPDATE ON public.visa_types
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_hotels_updated_at
  BEFORE UPDATE ON public.hotels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_offers_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. Audit log
-- =====================================================================
INSERT INTO public.system_logs (level, event, details, source)
VALUES (
  'success',
  'phase1_migration_deployed',
  'Phase 1 tables created: visa_types, hotels, hotel_rooms, offers, visa_document_requirements',
  'system'
);

-- =====================================================================
-- PHASE 1 MIGRATION COMPLETE ✅
-- Tables: visa_types, hotels, hotel_rooms, offers, visa_document_requirements
-- RLS: Public read for active records, admin/staff full access
-- Triggers: updated_at auto-maintenance on visa_types, hotels, offers
-- =====================================================================
