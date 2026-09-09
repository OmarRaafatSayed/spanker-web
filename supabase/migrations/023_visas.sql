-- =====================================================================
-- Migration 023: Visas & Document Management
-- =====================================================================
-- Creates visa programs table with eligibility rules
-- Document upload tracking with review workflow
-- No inventory — pure application processing
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. VISAS TABLE (Programs)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.visas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Destination
  destination_country TEXT NOT NULL,        -- e.g., 'Egypt', 'UAE', 'Saudi Arabia'
  country_code TEXT NOT NULL,               -- ISO 3166-1 alpha-2, e.g., 'EG', 'AE', 'SA'
  
  -- Visa type
  visa_type TEXT NOT NULL CHECK (visa_type IN (
    'tourist', 'business', 'student', 'transit', 'work', 'family', 'medical'
  )),
  
  -- Processing
  processing_days INTEGER NOT NULL CHECK (processing_days > 0),
  
  -- Pricing (service fee only — consular fees handled separately)
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  service_fee NUMERIC(12,2) DEFAULT 0 CHECK (service_fee >= 0),
  currency TEXT NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  
  -- Document requirements (JSONB array)
  required_documents JSONB NOT NULL DEFAULT '[]',
  -- Example: ["passport", "photo", "bank_statement", "hotel_booking", "flight_ticket", "employment_letter"]
  
  optional_documents JSONB DEFAULT '[]',
  -- Example: ["travel_insurance", "invitation_letter"]
  
  -- Visa validity
  validity_months INTEGER CHECK (validity_months > 0),
  max_stay_days INTEGER CHECK (max_stay_days > 0),
  
  -- Passport validity requirement
  min_passport_validity_months INTEGER DEFAULT 6 CHECK (min_passport_validity_months >= 0),
  
  -- Eligible nationalities (NULL = all nationalities eligible)
  eligible_nationalities TEXT[],
  -- Example: ['EG', 'SA', 'AE', 'KW', 'QA', 'BH', 'OM']
  
  -- Notes (bilingual)
  notes_ar TEXT,
  notes_en TEXT,
  
  -- Visibility
  is_public BOOLEAN DEFAULT true,
  enabled BOOLEAN DEFAULT true,
  
  -- Audit
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_visas_country ON public.visas(destination_country);
CREATE INDEX IF NOT EXISTS idx_visas_type ON public.visas(visa_type);
CREATE INDEX IF NOT EXISTS idx_visas_public_enabled ON public.visas(is_public, enabled) WHERE is_public AND enabled;

-- Unique constraint: one program per country + visa_type
CREATE UNIQUE INDEX IF NOT EXISTS idx_visas_unique_program 
  ON public.visas(destination_country, visa_type);

COMMENT ON TABLE public.visas IS 
  'Visa programs — no inventory, pure application processing';

COMMENT ON COLUMN public.visas.required_documents IS 
  'JSONB array of required document types — checked during application submission';

COMMENT ON COLUMN public.visas.eligible_nationalities IS 
  'Array of ISO country codes — NULL means all nationalities eligible';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. VISA DOCUMENT UPLOADS (linked to booking via visa_booking_details)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Note: The actual visa_booking_details table will be created in 025_bookings_unified.sql
-- This table stores uploaded documents referenced by visa_booking_details.documents jsonb

CREATE TABLE IF NOT EXISTS public.visa_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Owner
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Document metadata
  document_type TEXT NOT NULL,              -- 'passport', 'photo', 'bank_statement', etc.
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,                  -- Supabase Storage path
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  
  -- Review status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Uploaded, awaiting review
    'approved',     -- Staff approved
    'rejected',     -- Staff rejected — needs re-upload
    'expired'       -- Document expired (passport expiry, bank statement > 3 months old)
  )),
  
  -- Review details
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Metadata (parsed data for validation)
  metadata JSONB DEFAULT '{}',
  -- Example for passport: {"passport_number": "A12345678", "expiry_date": "2028-06-15", "nationality": "EG"}
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_visa_docs_customer ON public.visa_documents(customer_id);
CREATE INDEX IF NOT EXISTS idx_visa_docs_status ON public.visa_documents(status);
CREATE INDEX IF NOT EXISTS idx_visa_docs_type ON public.visa_documents(document_type);

COMMENT ON TABLE public.visa_documents IS 
  'Customer-uploaded visa documents — stored in Supabase Storage, reviewed by staff';

COMMENT ON COLUMN public.visa_documents.file_path IS 
  'Supabase Storage path: visa-documents/{userId}/{docId}/{filename}';

COMMENT ON COLUMN public.visa_documents.metadata IS 
  'Parsed document data for validation (passport expiry, etc.)';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. HELPER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function: Search available visa programs (public-facing)
CREATE OR REPLACE FUNCTION public.search_visas(
  p_destination_country TEXT DEFAULT NULL,
  p_visa_type TEXT DEFAULT NULL,
  p_nationality TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  destination_country TEXT,
  country_code TEXT,
  visa_type TEXT,
  processing_days INTEGER,
  price NUMERIC,
  service_fee NUMERIC,
  total_price NUMERIC,
  currency TEXT,
  required_documents JSONB,
  optional_documents JSONB,
  validity_months INTEGER,
  max_stay_days INTEGER,
  min_passport_validity_months INTEGER,
  notes_ar TEXT,
  notes_en TEXT
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    v.id,
    v.destination_country,
    v.country_code,
    v.visa_type,
    v.processing_days,
    v.price,
    v.service_fee,
    (v.price + v.service_fee) AS total_price,
    v.currency,
    v.required_documents,
    v.optional_documents,
    v.validity_months,
    v.max_stay_days,
    v.min_passport_validity_months,
    v.notes_ar,
    v.notes_en
  FROM public.visas v
  WHERE v.is_public = true
    AND v.enabled = true
    AND (p_destination_country IS NULL OR v.destination_country ILIKE '%' || p_destination_country || '%')
    AND (p_visa_type IS NULL OR v.visa_type = p_visa_type)
    AND (
      p_nationality IS NULL 
      OR v.eligible_nationalities IS NULL 
      OR p_nationality = ANY(v.eligible_nationalities)
    )
  ORDER BY v.destination_country, v.visa_type;
$$;

COMMENT ON FUNCTION public.search_visas IS 
  'Public visa search — filters by destination, type, and applicant nationality';

-- Function: Get visa program details by ID
CREATE OR REPLACE FUNCTION public.get_visa_details(p_visa_id UUID)
RETURNS TABLE (
  id UUID,
  destination_country TEXT,
  country_code TEXT,
  visa_type TEXT,
  processing_days INTEGER,
  price NUMERIC,
  service_fee NUMERIC,
  currency TEXT,
  required_documents JSONB,
  optional_documents JSONB,
  validity_months INTEGER,
  max_stay_days INTEGER,
  min_passport_validity_months INTEGER,
  eligible_nationalities TEXT[],
  notes_ar TEXT,
  notes_en TEXT
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    v.id,
    v.destination_country,
    v.country_code,
    v.visa_type,
    v.processing_days,
    v.price,
    v.service_fee,
    v.currency,
    v.required_documents,
    v.optional_documents,
    v.validity_months,
    v.max_stay_days,
    v.min_passport_validity_months,
    v.eligible_nationalities,
    v.notes_ar,
    v.notes_en
  FROM public.visas v
  WHERE v.id = p_visa_id
    AND v.is_public = true
    AND v.enabled = true;
$$;

COMMENT ON FUNCTION public.get_visa_details IS 
  'Fetch single visa program by ID — used on detail/application pages';

-- Function: Validate passport expiry for visa application
CREATE OR REPLACE FUNCTION public.validate_passport_expiry(
  p_visa_id UUID,
  p_passport_expiry_date DATE,
  p_intended_travel_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY INVOKER
STABLE
AS $$
DECLARE
  v_min_validity INTEGER;
  v_required_expiry DATE;
  v_months_remaining INTEGER;
BEGIN
  -- Get visa's minimum passport validity requirement
  SELECT min_passport_validity_months INTO v_min_validity
  FROM public.visas
  WHERE id = p_visa_id;

  IF v_min_validity IS NULL THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Visa program not found'
    );
  END IF;

  -- Calculate required expiry date
  v_required_expiry := p_intended_travel_date + (v_min_validity || ' months')::interval;
  
  -- Calculate months remaining
  v_months_remaining := EXTRACT(YEAR FROM AGE(p_passport_expiry_date, p_intended_travel_date)) * 12 
                      + EXTRACT(MONTH FROM AGE(p_passport_expiry_date, p_intended_travel_date));

  IF p_passport_expiry_date < v_required_expiry THEN
    RETURN jsonb_build_object(
      'valid', false,
      'required_validity_months', v_min_validity,
      'months_remaining', v_months_remaining,
      'required_expiry_date', v_required_expiry,
      'message', 'Passport must be valid for at least ' || v_min_validity || ' months beyond travel date'
    );
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'months_remaining', v_months_remaining
  );
END;
$$;

COMMENT ON FUNCTION public.validate_passport_expiry IS 
  'Validates passport expiry against visa requirements — returns validation result';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trigger function: Update timestamps
CREATE OR REPLACE FUNCTION public.update_visas_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_visas_updated ON public.visas;
CREATE TRIGGER on_visas_updated
  BEFORE UPDATE ON public.visas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_visas_timestamp();

DROP TRIGGER IF EXISTS on_visa_docs_updated ON public.visa_documents;
CREATE TRIGGER on_visa_docs_updated
  BEFORE UPDATE ON public.visa_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_visas_timestamp();

-- =====================================================================
-- MIGRATION 023 COMPLETE ✅
-- =====================================================================
-- Tables: visas (programs), visa_documents (uploads)
-- Functions: search_visas(), get_visa_details(), validate_passport_expiry()
-- No inventory — pure application processing with document review workflow
-- Indexes: country, type, public/enabled, customer, status
-- =====================================================================
