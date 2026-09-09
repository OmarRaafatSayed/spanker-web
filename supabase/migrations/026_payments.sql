-- =====================================================================
-- Migration 026: Payments (Cash & Bank Transfer Only)
-- =====================================================================
-- No payment gateway integration as per requirements
-- Manual confirmation by staff
-- Payment audit log (payment_events)
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. PAYMENTS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Linked booking
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  
  -- Payment method (cash/bank_transfer only as per requirements)
  method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer')),
  
  -- Amount
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency TEXT NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP'),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',      -- Awaiting payment
    'paid',         -- Payment received & confirmed by staff
    'failed',       -- Payment failed / rejected
    'refunded'      -- Refund processed
  )),
  
  -- Bank transfer details (optional, set by customer or staff)
  bank_transfer_details JSONB,
  -- Example: {
  --   "bank_name": "National Bank of Egypt",
  --   "account_number": "1234567890",
  --   "transfer_reference": "TRX123456",
  --   "transfer_date": "2026-09-07",
  --   "receipt_image_url": "https://..."
  -- }
  
  -- Payment reference (internal tracking)
  provider_ref TEXT,                        -- For future gateway integration
  
  -- Status transition timestamps
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Staff confirmation (who confirmed payment)
  confirmed_by UUID REFERENCES public.profiles(id),
  
  -- Notes
  notes TEXT,
  staff_notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(method);
CREATE INDEX IF NOT EXISTS idx_payments_confirmed_by ON public.payments(confirmed_by);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Unique constraint: one active payment per booking (prevent duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_booking
  ON public.payments(booking_id)
  WHERE status IN ('pending', 'paid');

COMMENT ON TABLE public.payments IS 
  'Payment records — cash/bank_transfer only, manually confirmed by staff';

COMMENT ON COLUMN public.payments.method IS 
  'Cash (office payment) or bank_transfer (customer uploads receipt)';

COMMENT ON COLUMN public.payments.bank_transfer_details IS 
  'Bank transfer metadata — account, reference, receipt image, etc.';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. PAYMENT EVENTS (Audit Log)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE TABLE IF NOT EXISTS public.payment_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  
  -- Event type
  event_type TEXT NOT NULL,
  -- Examples: 'payment_created', 'payment_confirmed', 'receipt_uploaded', 'refund_initiated', 'refund_completed'
  
  -- Event payload (flexible JSONB)
  payload JSONB DEFAULT '{}',
  
  -- Who triggered the event
  triggered_by UUID REFERENCES public.profiles(id),
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment ON public.payment_events(payment_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_events_type ON public.payment_events(event_type);

COMMENT ON TABLE public.payment_events IS 
  'Payment audit log — tracks all payment-related events for compliance';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. ADD FOREIGN KEY TO BOOKINGS TABLE
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Now we can add the FK from bookings.payment_id → payments.id
-- (circular reference resolved by deferring this constraint)

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'bookings_payment_id_fkey'
      AND table_name = 'bookings'
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_payment_id_fkey
      FOREIGN KEY (payment_id)
      REFERENCES public.payments(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. HELPER FUNCTIONS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Function: Create payment record (called by booking RPC functions)
CREATE OR REPLACE FUNCTION public.create_payment(
  p_booking_id UUID,
  p_amount NUMERIC,
  p_method TEXT DEFAULT 'cash'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment_id UUID;
BEGIN
  -- Validate method
  IF p_method NOT IN ('cash', 'bank_transfer') THEN
    RAISE EXCEPTION 'Invalid payment method: %. Must be cash or bank_transfer', p_method;
  END IF;

  -- Create payment record
  INSERT INTO public.payments (booking_id, method, amount, currency, status)
  VALUES (p_booking_id, p_method, p_amount, 'EGP', 'pending')
  RETURNING id INTO v_payment_id;

  -- Link payment to booking
  UPDATE public.bookings
  SET payment_id = v_payment_id
  WHERE id = p_booking_id;

  -- Log event
  INSERT INTO public.payment_events (payment_id, event_type, payload, triggered_by)
  VALUES (
    v_payment_id,
    'payment_created',
    jsonb_build_object('method', p_method, 'amount', p_amount, 'currency', 'EGP'),
    auth.uid()
  );

  RETURN v_payment_id;
END;
$$;

COMMENT ON FUNCTION public.create_payment IS 
  'Creates payment record and links to booking — called by booking RPC functions';

-- Function: Confirm payment (staff only)
CREATE OR REPLACE FUNCTION public.confirm_payment(
  p_payment_id UUID,
  p_staff_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_amount NUMERIC;
BEGIN
  -- Check caller is staff
  IF NOT public.is_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Access denied: staff only');
  END IF;

  -- Update payment status
  UPDATE public.payments
  SET 
    status = 'paid',
    paid_at = now(),
    confirmed_by = auth.uid(),
    staff_notes = COALESCE(p_staff_notes, staff_notes)
  WHERE id = p_payment_id
    AND status = 'pending'
  RETURNING booking_id, amount INTO v_booking_id, v_amount;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment not found or already processed');
  END IF;

  -- Update booking status to confirmed
  UPDATE public.bookings
  SET 
    status = 'confirmed',
    confirmed_at = now(),
    expires_at = NULL  -- Clear expiry
  WHERE id = v_booking_id;

  -- Log event
  INSERT INTO public.payment_events (payment_id, event_type, payload, triggered_by)
  VALUES (
    p_payment_id,
    'payment_confirmed',
    jsonb_build_object('confirmed_by', auth.uid(), 'amount', v_amount),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'payment_id', p_payment_id,
    'booking_id', v_booking_id,
    'message', 'Payment confirmed successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.confirm_payment IS 
  'Staff-only: confirms payment and updates booking status to confirmed';

-- Function: Process refund (staff only)
CREATE OR REPLACE FUNCTION public.process_refund(
  p_payment_id UUID,
  p_refund_amount NUMERIC,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_original_amount NUMERIC;
BEGIN
  -- Check caller is staff
  IF NOT public.is_staff() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Access denied: staff only');
  END IF;

  -- Get payment details
  SELECT booking_id, amount INTO v_booking_id, v_original_amount
  FROM public.payments
  WHERE id = p_payment_id
    AND status = 'paid';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Payment not found or not in paid status');
  END IF;

  -- Validate refund amount
  IF p_refund_amount > v_original_amount THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Refund amount exceeds original payment',
      'original_amount', v_original_amount,
      'refund_amount', p_refund_amount
    );
  END IF;

  -- Update payment status
  UPDATE public.payments
  SET 
    status = 'refunded',
    refunded_at = now(),
    staff_notes = COALESCE(p_reason, staff_notes)
  WHERE id = p_payment_id;

  -- Update booking status
  UPDATE public.bookings
  SET status = 'refunded'
  WHERE id = v_booking_id;

  -- Log event
  INSERT INTO public.payment_events (payment_id, event_type, payload, triggered_by)
  VALUES (
    p_payment_id,
    'refund_processed',
    jsonb_build_object(
      'refund_amount', p_refund_amount,
      'original_amount', v_original_amount,
      'reason', p_reason,
      'processed_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN jsonb_build_object(
    'ok', true,
    'payment_id', p_payment_id,
    'booking_id', v_booking_id,
    'refund_amount', p_refund_amount,
    'message', 'Refund processed successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.process_refund IS 
  'Staff-only: processes refund and updates booking status to refunded';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. TRIGGERS
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trigger function: Log payment status changes
CREATE OR REPLACE FUNCTION public.log_payment_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.payment_events (payment_id, event_type, payload, triggered_by)
    VALUES (
      NEW.id,
      'status_changed',
      jsonb_build_object(
        'from_status', OLD.status,
        'to_status', NEW.status
      ),
      auth.uid()
    );
  END IF;
  
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_payment_status_changed ON public.payments;
CREATE TRIGGER on_payment_status_changed
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_payment_status_change();

COMMENT ON FUNCTION public.log_payment_status_change IS 
  'Auto-logs payment status changes to audit log';

-- =====================================================================
-- MIGRATION 026 COMPLETE ✅
-- =====================================================================
-- Tables: payments, payment_events
-- Functions: create_payment(), confirm_payment(), process_refund()
-- Payment methods: cash, bank_transfer only (no gateway)
-- Manual staff confirmation required
-- Full audit trail via payment_events
-- Foreign key added: bookings.payment_id → payments.id
-- =====================================================================
