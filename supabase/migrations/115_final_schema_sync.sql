-- Migration 115: Final Schema Sync - Fix all missing tables, columns, and RPCs

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. CREATE MISSING TABLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Content Banners Table
CREATE TABLE IF NOT EXISTS public.content_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  position TEXT NOT NULL CHECK (position IN ('hero', 'secondary', 'sidebar', 'footer')),
  display_order INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  link_url TEXT,
  link_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_audience TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_banners_position ON public.content_banners(position);
CREATE INDEX IF NOT EXISTS idx_content_banners_active ON public.content_banners(is_active);

-- State Machine Events Table
CREATE TABLE IF NOT EXISTS public.state_machine_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  previous_state TEXT,
  new_state TEXT NOT NULL,
  event_type TEXT NOT NULL,
  triggered_by TEXT,
  payload JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_state_machine_events_entity ON public.state_machine_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_state_machine_events_created ON public.state_machine_events(created_at);

-- Hotel Room Availability Table
CREATE TABLE IF NOT EXISTS public.hotel_room_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id UUID NOT NULL REFERENCES public.hotel_offers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  room_type TEXT NOT NULL,
  rooms_left INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(hotel_id, date, room_type)
);

CREATE INDEX IF NOT EXISTS idx_hotel_room_availability_hotel ON public.hotel_room_availability(hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_room_availability_date ON public.hotel_room_availability(date);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. ADD MISSING COLUMNS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Add user_id alias to travel_requests (for compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'travel_requests' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.travel_requests ADD COLUMN user_id UUID;
    -- Populate with client_user_id values
    UPDATE public.travel_requests SET user_id = client_user_id WHERE user_id IS NULL;
    -- Create trigger to keep them in sync
    CREATE OR REPLACE FUNCTION sync_travel_requests_user_id()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        NEW.user_id := NEW.client_user_id;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS trg_sync_travel_requests_user_id ON public.travel_requests;
    CREATE TRIGGER trg_sync_travel_requests_user_id
      BEFORE INSERT OR UPDATE ON public.travel_requests
      FOR EACH ROW EXECUTE FUNCTION sync_travel_requests_user_id();
  END IF;
END $$;

-- Add status alias (booking_status is already there)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'travel_requests' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.travel_requests ADD COLUMN status TEXT;
    UPDATE public.travel_requests SET status = booking_status WHERE status IS NULL;
    
    CREATE OR REPLACE FUNCTION sync_travel_requests_status()
    RETURNS TRIGGER AS $func$
    BEGIN
      IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        NEW.status := NEW.booking_status;
      END IF;
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
    
    DROP TRIGGER IF EXISTS trg_sync_travel_requests_status ON public.travel_requests;
    CREATE TRIGGER trg_sync_travel_requests_status
      BEFORE INSERT OR UPDATE ON public.travel_requests
      FOR EACH ROW EXECUTE FUNCTION sync_travel_requests_status();
  END IF;
END $$;

-- Add booking_id and remaining_balance to payment_records
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS booking_id UUID;
ALTER TABLE public.payment_records ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC(10,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_payment_records_booking ON public.payment_records(booking_id);

-- Add review_status to visa_applications
ALTER TABLE public.visa_applications ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'pending';

-- Add enabled to hotel_offers
ALTER TABLE public.hotel_offers ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_hotel_offers_enabled ON public.hotel_offers(enabled);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. CREATE MISSING RPC: record_payment_and_generate_voucher
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION record_payment_and_generate_voucher(
  p_transaction_id UUID,
  p_amount_paid NUMERIC,
  p_payment_method TEXT,
  p_receipt_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_record RECORD;
  v_new_balance NUMERIC;
  v_booking_id UUID;
  v_booking_ref TEXT;
BEGIN
  -- Get payment record
  SELECT * INTO v_record
  FROM payment_records
  WHERE id = p_transaction_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PAYMENT_NOT_FOUND');
  END IF;
  
  -- Calculate new balance
  v_new_balance := COALESCE(v_record.remaining_balance, v_record.amount) - p_amount_paid;
  
  IF v_new_balance < 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'OVERPAYMENT', 'remaining', v_record.remaining_balance);
  END IF;
  
  -- Update payment record
  UPDATE payment_records
  SET 
    remaining_balance = v_new_balance,
    status = CASE WHEN v_new_balance = 0 THEN 'completed' ELSE 'partial' END,
    payment_date = CASE WHEN v_new_balance = 0 THEN now() ELSE payment_date END,
    updated_at = now()
  WHERE id = p_transaction_id;
  
  -- If booking_reference exists, update travel_request
  IF v_record.booking_reference IS NOT NULL THEN
    UPDATE travel_requests
    SET 
      booking_status = CASE WHEN v_new_balance = 0 THEN 'confirmed' ELSE booking_status END,
      updated_at = now()
    WHERE booking_reference = v_record.booking_reference
    RETURNING id INTO v_booking_id;
    
    -- Generate voucher URL if fully paid
    IF v_new_balance = 0 AND v_booking_id IS NOT NULL THEN
      -- Placeholder: In production, this would generate actual voucher
      UPDATE travel_requests
      SET voucher_url = '/vouchers/' || id || '.pdf'
      WHERE id = v_booking_id;
    END IF;
  END IF;
  
  RETURN jsonb_build_object(
    'ok', true,
    'payment_id', p_transaction_id,
    'remaining_balance', v_new_balance,
    'fully_paid', v_new_balance = 0
  );
END;
$$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. RLS POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Enable RLS
ALTER TABLE public.content_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_machine_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_room_availability ENABLE ROW LEVEL SECURITY;

-- Content Banners: Public read, staff write
CREATE POLICY "content_banners_public_read" ON public.content_banners
  FOR SELECT USING (is_active = true);

CREATE POLICY "content_banners_staff_all" ON public.content_banners
  FOR ALL USING (is_staff(auth.uid()));

-- State Machine Events: Staff read-only
CREATE POLICY "state_machine_events_staff_read" ON public.state_machine_events
  FOR SELECT USING (is_staff(auth.uid()));

-- Hotel Room Availability: Public read, staff write
CREATE POLICY "hotel_room_availability_public_read" ON public.hotel_room_availability
  FOR SELECT USING (true);

CREATE POLICY "hotel_room_availability_staff_all" ON public.hotel_room_availability
  FOR ALL USING (is_staff(auth.uid()));

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. GRANTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GRANT SELECT ON public.content_banners TO anon, authenticated;
GRANT ALL ON public.content_banners TO service_role;

GRANT SELECT ON public.state_machine_events TO authenticated;
GRANT ALL ON public.state_machine_events TO service_role;

GRANT SELECT ON public.hotel_room_availability TO anon, authenticated;
GRANT ALL ON public.hotel_room_availability TO service_role;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. COMMENTS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMMENT ON TABLE public.content_banners IS 'Website banners and promotional content';
COMMENT ON TABLE public.state_machine_events IS 'State transition event log for bookings and requests';
COMMENT ON TABLE public.hotel_room_availability IS 'Daily room availability tracking per hotel';
COMMENT ON FUNCTION record_payment_and_generate_voucher IS 'Records payment and generates voucher when fully paid';
