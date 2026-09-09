-- =====================================================================
-- Migration 025: Unified Bookings System
-- =====================================================================
-- Single bookings table for all 4 verticals (flight/hotel/visa/trip)
-- Vertical-specific details in separate tables
-- Reference code generation, status history, policies
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. BOOKINGS TABLE (Unified)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Reference code (customer-facing ID)
  reference TEXT UNIQUE NOT NULL,           -- SPK-FL-2026-A7X9K2
  
  -- Vertical discriminator
  vertical TEXT NOT NULL CHECK (vertical IN ('flight', 'hotel', 'visa', 'trip')),
  
  -- Customer
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'draft',        -- Created but not submitted
    'pending',      -- Submitted, awaiting payment/confirmation
    'confirmed',    -- Payment received / manually confirmed by staff
    'cancelled',    -- Cancelled by customer or staff
    'expired',      -- Expired (pending > 15min without confirmation)
    'refunded',     -- Refund processed
    'completed'     -- Service delivered (post-travel)
  )),
  
  -- Pricing
  total_amount NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  
  -- Contact info (captured at booking time, may differ from profile)
  contact JSONB NOT NULL,
  -- Example: {"email": "user@example.com", "phone": "+201234567890", "whatsapp": "+201234567890"}
  
  -- Optional notes
  notes TEXT,
  customer_notes TEXT,
  staff_notes TEXT,
  
  -- Payment linkage (null until payment created)
  payment_id UUID,  -- Will be set by payment creation, FK added in 026_payments.sql
  
  -- Expiry for pending bookings (15 min hold time as per requirements)
  expires_at TIMESTAMPTZ,
  
  -- Status transition timestamps
  confirmed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_vertical ON public.bookings(vertical);
CREATE INDEX IF NOT EXISTS idx_bookings_reference ON public.bookings(reference);
CREATE INDEX IF NOT EXISTS idx_bookings_expires_at ON public.bookings(expires_at) WHERE status = 'pending' AND expires_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);

-- Composite index for customer's booking list
CREATE INDEX IF NOT EXISTS idx_bookings_customer_created 
  ON public.bookings(customer_id, created_at DESC);

COMMENT ON TABLE public.bookings IS 
  'Unified bookings table — single source of truth for all 4 verticals';

COMMENT ON COLUMN public.bookings.reference IS 
  'Customer-facing booking reference code — generated via generate_reference() function';

COMMENT ON COLUMN public.bookings.expires_at IS 
  'Pending bookings expire after 15 minutes — cron job runs expire_pending_bookings()';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. FLIGHT BOOKING DETAILS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.flight_booking_details (
  booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  flight_id UUID NOT NULL REFERENCES public.flights(id) ON DELETE RESTRICT,
  
  -- Passenger details (JSONB array)
  passengers JSONB NOT NULL,
  -- Example: [
  --   {"type": "adult", "title": "Mr", "first_name": "Ahmed", "last_name": "Hassan", "date_of_birth": "1985-03-15", "passport_number": "A12345678"},
  --   {"type": "child", "title": "Miss", "first_name": "Layla", "last_name": "Hassan", "date_of_birth": "2015-08-20", "passport_number": "C87654321"}
  -- ]
  
  -- PNR code (set after confirmation)
  pnr_code TEXT,
  
  -- Seat preferences
  seat_preferences TEXT[],                  -- ['window', 'aisle'] or seat numbers ['12A', '12B']
  
  -- Extra baggage
  baggage_extra JSONB DEFAULT '{}',
  -- Example: {"adult_1": {"extra_kg": 10, "price": 150}, "adult_2": {"extra_kg": 0, "price": 0}}
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flight_details_flight ON public.flight_booking_details(flight_id);

COMMENT ON TABLE public.flight_booking_details IS 
  'Flight-specific booking details — passengers, PNR, seats, baggage';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. HOTEL BOOKING DETAILS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.hotel_booking_details (
  booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  hotel_id UUID NOT NULL REFERENCES public.hotels(id) ON DELETE RESTRICT,
  
  -- Room details
  room_type TEXT NOT NULL,                  -- 'standard', 'deluxe', 'suite'
  
  -- Dates
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  nights INTEGER GENERATED ALWAYS AS (check_out - check_in) STORED,
  
  -- Guests & rooms
  guests INTEGER NOT NULL CHECK (guests > 0),
  rooms INTEGER NOT NULL CHECK (rooms > 0),
  
  -- Guest names (lead guest + additional guests)
  lead_guest JSONB NOT NULL,
  -- Example: {"title": "Mr", "first_name": "Ahmed", "last_name": "Hassan", "phone": "+201234567890"}
  
  additional_guests JSONB DEFAULT '[]',
  -- Example: [{"title": "Mrs", "first_name": "Fatima", "last_name": "Hassan"}]
  
  -- Special requests
  special_requests TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Constraints
  CONSTRAINT valid_hotel_dates CHECK (check_out > check_in)
);

CREATE INDEX IF NOT EXISTS idx_hotel_details_hotel ON public.hotel_booking_details(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_details_check_in ON public.hotel_booking_details(check_in);

COMMENT ON TABLE public.hotel_booking_details IS 
  'Hotel-specific booking details — room type, dates, guests, special requests';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. VISA BOOKING DETAILS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.visa_booking_details (
  booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  visa_id UUID NOT NULL REFERENCES public.visas(id) ON DELETE RESTRICT,
  
  -- Applicant details
  applicant JSONB NOT NULL,
  -- Example: {"title": "Mr", "first_name": "Ahmed", "last_name": "Hassan", "date_of_birth": "1985-03-15", "nationality": "EG", "occupation": "Engineer"}
  
  -- Passport details
  passport JSONB NOT NULL,
  -- Example: {"passport_number": "A12345678", "issue_date": "2020-01-15", "expiry_date": "2030-01-15", "place_of_issue": "Cairo"}
  
  -- Uploaded documents (references visa_documents table)
  documents JSONB DEFAULT '[]',
  -- Example: [
  --   {"type": "passport", "doc_id": "uuid-1", "status": "approved"},
  --   {"type": "photo", "doc_id": "uuid-2", "status": "pending"},
  --   {"type": "bank_statement", "doc_id": "uuid-3", "status": "approved"}
  -- ]
  
  -- Travel details
  purpose_of_travel TEXT,
  intended_travel_date DATE,
  
  -- Review workflow
  review_status TEXT NOT NULL DEFAULT 'submitted' CHECK (review_status IN (
    'draft',            -- Application incomplete
    'submitted',        -- Submitted by customer
    'under_review',     -- Staff reviewing
    'approved',         -- Approved by staff
    'rejected',         -- Rejected by staff
    'needs_more_info'   -- More documents/info requested
  )),
  
  reviewer_id UUID REFERENCES public.profiles(id),
  review_notes TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  decided_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_visa_details_visa ON public.visa_booking_details(visa_id);
CREATE INDEX IF NOT EXISTS idx_visa_details_review_status ON public.visa_booking_details(review_status);
CREATE INDEX IF NOT EXISTS idx_visa_details_reviewer ON public.visa_booking_details(reviewer_id);

COMMENT ON TABLE public.visa_booking_details IS 
  'Visa application details — applicant, passport, documents, review workflow';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. TRIP BOOKING DETAILS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.trip_booking_details (
  booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
  trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE RESTRICT,
  
  -- Number of travelers
  travelers INTEGER NOT NULL CHECK (travelers > 0),
  
  -- Lead traveler details
  lead_traveler JSONB NOT NULL,
  -- Example: {"title": "Mr", "first_name": "Ahmed", "last_name": "Hassan", "phone": "+201234567890", "email": "ahmed@example.com"}
  
  -- Additional travelers
  additional_travelers JSONB DEFAULT '[]',
  -- Example: [{"title": "Mrs", "first_name": "Fatima", "last_name": "Hassan", "date_of_birth": "1987-05-20"}]
  
  -- Special requests
  special_requests TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trip_details_trip ON public.trip_booking_details(trip_id);

COMMENT ON TABLE public.trip_booking_details IS 
  'Trip-specific booking details — travelers, lead contact, special requests';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. BOOKING POLICIES (per vertical)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.booking_policies (
  vertical TEXT PRIMARY KEY CHECK (vertical IN ('flight', 'hotel', 'visa', 'trip')),
  
  -- Free cancellation window (hours before service)
  free_cancel_window INTEGER NOT NULL DEFAULT 48,
  
  -- Penalty percentage (if cancelled within penalty window)
  penalty_percent NUMERIC(5,2) DEFAULT 25 CHECK (penalty_percent >= 0 AND penalty_percent <= 100),
  
  -- Penalty window (hours before service)
  penalty_window INTEGER NOT NULL DEFAULT 24,
  
  -- Non-refundable after (hours before service)
  non_refundable_after INTEGER NOT NULL DEFAULT 6,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default policies
INSERT INTO public.booking_policies (vertical, free_cancel_window, penalty_percent, penalty_window, non_refundable_after, notes)
VALUES 
  ('flight', 48, 25, 24, 6, 'Free cancellation before 48h, 25% penalty 24-48h, non-refundable <24h'),
  ('hotel', 72, 0, 24, 0, 'Free cancellation before 72h, 1 night charge 24-72h, full charge <24h'),
  ('visa', 168, 0, 0, 0, 'Free cancellation before submission to authorities, service fee retained after submission'),
  ('trip', 336, 30, 168, 7, 'Free cancellation before 14 days, 30% penalty 7-14 days, non-refundable <7 days')
ON CONFLICT (vertical) DO NOTHING;

COMMENT ON TABLE public.booking_policies IS 
  'Cancellation & refund policies per vertical — used by cancel_booking() RPC';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. BOOKING STATUS HISTORY
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  
  -- Status transition
  from_status TEXT,
  to_status TEXT NOT NULL,
  
  -- Who made the change
  changed_by UUID REFERENCES public.profiles(id),
  
  -- Why
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_history_booking ON public.booking_status_history(booking_id, created_at DESC);

COMMENT ON TABLE public.booking_status_history IS 
  'Audit log of booking status changes — who, when, why';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. REFERENCE CODE GENERATION FUNCTION
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function: Generate unique booking reference code
CREATE OR REPLACE FUNCTION public.generate_reference(p_prefix TEXT)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  v_year TEXT;
  v_random TEXT;
  v_reference TEXT;
  v_attempts INTEGER := 0;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
  
  LOOP
    -- Generate 6 random alphanumeric characters (uppercase)
    v_random := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6)
    );
    
    -- Format: SPK-{prefix}-{YYYY}-{6 chars}
    v_reference := 'SPK-' || p_prefix || '-' || v_year || '-' || v_random;
    
    -- Check uniqueness
    IF NOT EXISTS (SELECT 1 FROM public.bookings WHERE reference = v_reference) THEN
      RETURN v_reference;
    END IF;
    
    v_attempts := v_attempts + 1;
    
    -- Safety: max 10 attempts
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Failed to generate unique reference after 10 attempts';
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.generate_reference IS 
  'Generates unique booking reference: SPK-{prefix}-{YYYY}-{6 random chars}';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 9. TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trigger function: Log status changes to history
CREATE OR REPLACE FUNCTION public.log_booking_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.booking_status_history (booking_id, from_status, to_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_booking_status_changed ON public.bookings;
CREATE TRIGGER on_booking_status_changed
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_status_change();

COMMENT ON FUNCTION public.log_booking_status_change IS 
  'Auto-logs booking status changes to audit history table';

-- =====================================================================
-- MIGRATION 025 COMPLETE ✅
-- =====================================================================
-- Tables: bookings (unified), flight/hotel/visa/trip_booking_details,
--         booking_policies, booking_status_history
-- Functions: generate_reference()
-- Triggers: auto-log status changes
-- Reference format: SPK-FL-2026-A7X9K2
-- Expires pending bookings after 15 minutes
-- =====================================================================
