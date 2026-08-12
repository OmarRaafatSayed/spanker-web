-- =====================================================================
-- CRM Data Pipeline: Unified State Machine & Event-Driven Architecture
-- Complete schema with Foreign Keys, State Machines, and Event Triggers
-- =====================================================================

-- 1. USERS TABLE (قاعدة العملاء الأساسية)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auth Link
  auth_user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Info
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  passport_number TEXT,
  
  -- Status Lifecycle
  status TEXT NOT NULL DEFAULT 'LEAD' CHECK (status IN (
    'LEAD',                -- عميل جديد
    'ACTIVE_CLIENT',       -- عميل نشط
    'INACTIVE',            -- عميل معطّل
    'ARCHIVED'             -- عميل مؤرشف
  )),
  
  -- CRM Reference
  crm_lead_id TEXT,
  crm_synced_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);
CREATE INDEX idx_users_created_at ON public.users(created_at DESC);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own" ON public.users FOR SELECT
  TO authenticated USING (auth_user_id = auth.uid());

CREATE POLICY "service_role_all" ON public.users FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.users IS 'Base customer/lead table for Portal and CRM';

-- 2. VISA_APPLICATIONS TABLE (التأشيرات والمستندات)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.visa_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Visa Details
  country_code TEXT NOT NULL CHECK (country_code IN ('AE', 'DE', 'TR', 'EG', 'KSA')),
  visa_type TEXT,
  
  -- Status State Machine
  status TEXT NOT NULL DEFAULT 'DOCS_PENDING' CHECK (status IN (
    'DOCS_PENDING',           -- في انتظار الوثائق
    'UNDER_REVIEW',           -- قيد المراجعة
    'SUBMITTED_TO_EMBASSY',   -- مرسل للسفارة
    'APPROVED',               -- موافق عليه
    'REJECTED',               -- مرفوض
    'CANCELLED'               -- ملغي
  )),
  
  -- Documents (JSONB Array)
  documents JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  last_status_change_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visa_apps_user_id ON public.visa_applications(user_id);
CREATE INDEX idx_visa_apps_status ON public.visa_applications(status);
CREATE INDEX idx_visa_apps_country ON public.visa_applications(country_code);
CREATE INDEX idx_visa_apps_created_at ON public.visa_applications(created_at DESC);

ALTER TABLE public.visa_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_visas" ON public.visa_applications FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "service_role_visa" ON public.visa_applications FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.visa_applications IS 'Visa applications with document tracking and state machine';

-- 3. QUOTATIONS TABLE (عروض الأسعار)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  visa_application_id UUID REFERENCES public.visa_applications(id) ON DELETE SET NULL,
  
  -- Quote Details (JSONB for flexibility)
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- Example: [
  --   { "type": "FLIGHT", "description": "Cairo-Dubai Return", "amount": 500 },
  --   { "type": "VISA_FEE", "description": "UAE Visa", "amount": 200 },
  --   { "type": "SERVICE_FEE", "description": "Service Charge", "amount": 50 }
  -- ]
  
  -- Pricing
  total_amount NUMERIC(12, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EGP',
  
  -- Status State Machine
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
    'DRAFT',        -- مسودة
    'SENT',         -- مُرسل للعميل
    'ACCEPTED',     -- مقبول من العميل
    'EXPIRED',      -- انتهت صلاحيته
    'REJECTED',     -- مرفوض
    'CONVERTED'     -- تم تحويله لحجز
  )),
  
  -- Validity
  sent_at TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_quotations_user_id ON public.quotations(user_id);
CREATE INDEX idx_quotations_status ON public.quotations(status);
CREATE INDEX idx_quotations_visa_app_id ON public.quotations(visa_application_id);
CREATE INDEX idx_quotations_created_at ON public.quotations(created_at DESC);

ALTER TABLE public.quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_quotes" ON public.quotations FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "service_role_quotes" ON public.quotations FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.quotations IS 'Price quotations with state machine (Draft -> Sent -> Accepted)';

-- 4. BOOKINGS TABLE (الحجوزات المؤكدة)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  quotation_id UUID NOT NULL REFERENCES public.quotations(id) ON DELETE RESTRICT,
  
  -- Booking Details
  booking_reference TEXT UNIQUE,
  pnr TEXT,  -- Airline PNR if applicable
  
  -- Status State Machine
  status TEXT NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN (
    'PENDING_PAYMENT',    -- في انتظار الدفع
    'CONFIRMED',          -- مؤكد
    'COMPLETED',          -- مكتمل
    'CANCELLED'           -- ملغي
  )),
  
  -- Voucher
  voucher_url TEXT,
  voucher_generated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_quotation_id ON public.bookings(quotation_id);
CREATE INDEX idx_bookings_booking_ref ON public.bookings(booking_reference);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_bookings" ON public.bookings FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "service_role_bookings" ON public.bookings FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.bookings IS 'Confirmed bookings with payment and voucher tracking';

-- 5. FINANCIAL_TRANSACTIONS TABLE (العمليات المالية)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Payment Details
  amount_paid NUMERIC(12, 2) NOT NULL DEFAULT 0,
  remaining_balance NUMERIC(12, 2) NOT NULL,
  
  -- Payment Method
  payment_method TEXT NOT NULL CHECK (payment_method IN (
    'CASH',
    'BANK_TRANSFER',
    'POS',
    'CREDIT_CARD',
    'CHEQUE'
  )),
  
  -- Receipt
  receipt_url TEXT,
  receipt_number TEXT,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_financial_trans_booking_id ON public.financial_transactions(booking_id);
CREATE INDEX idx_financial_trans_user_id ON public.financial_transactions(user_id);
CREATE INDEX idx_financial_trans_created_at ON public.financial_transactions(created_at DESC);

ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_transactions" ON public.financial_transactions FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "service_role_transactions" ON public.financial_transactions FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.financial_transactions IS 'Payment records with balance tracking';

-- 6. STATE MACHINE EVENT LOG (سجل أحداث State Machine)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.state_machine_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity Reference
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'USER', 'VISA_APPLICATION', 'QUOTATION', 'BOOKING', 'FINANCIAL_TRANSACTION'
  )),
  entity_id UUID NOT NULL,
  
  -- State Transition
  previous_state TEXT,
  new_state TEXT NOT NULL,
  
  -- Event Details
  event_type TEXT NOT NULL,
  triggered_by TEXT,  -- 'SYSTEM', 'USER', 'CRM_STAFF'
  payload JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_state_events_entity ON public.state_machine_events(entity_type, entity_id);
CREATE INDEX idx_state_events_created_at ON public.state_machine_events(created_at DESC);

ALTER TABLE public.state_machine_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_state_events" ON public.state_machine_events FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.state_machine_events IS 'Complete audit trail of all state machine transitions';

-- 7. CRM NOTIFICATIONS TABLE (الإشعارات)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.crm_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Recipient
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Notification Details
  type TEXT NOT NULL CHECK (type IN (
    'VISA_STATUS_CHANGED',
    'QUOTATION_SENT',
    'QUOTATION_ACCEPTED',
    'BOOKING_CONFIRMED',
    'PAYMENT_RECEIVED',
    'VOUCHER_READY',
    'DOCUMENT_REQUEST',
    'STATUS_UPDATE'
  )),
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  
  -- Delivery
  delivery_methods JSONB DEFAULT '["PORTAL", "EMAIL"]'::jsonb,
  email_sent_at TIMESTAMPTZ,
  sms_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON public.crm_notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.crm_notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.crm_notifications(created_at DESC);

ALTER TABLE public.crm_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_view_own_notifications" ON public.crm_notifications FOR SELECT
  TO authenticated
  USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "service_role_notifications" ON public.crm_notifications FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.crm_notifications IS 'Real-time notifications for Portal and CRM';

-- 8. HELPER FUNCTIONS
-- =====================================================================

-- Function: Create lead from user registration
CREATE OR REPLACE FUNCTION create_lead_from_user(
  p_auth_user_id UUID,
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO public.users (
    auth_user_id, email, first_name, last_name, status
  ) VALUES (
    p_auth_user_id, p_email, p_first_name, p_last_name, 'LEAD'
  )
  RETURNING id INTO v_user_id;
  
  -- Log state change
  INSERT INTO public.state_machine_events (
    entity_type, entity_id, previous_state, new_state, event_type, triggered_by, payload
  ) VALUES (
    'USER', v_user_id, NULL, 'LEAD', 'USER_REGISTERED', 'SYSTEM',
    jsonb_build_object(
      'email', p_email,
      'first_name', p_first_name,
      'last_name', p_last_name
    )
  );
  
  -- Send notification
  INSERT INTO public.crm_notifications (
    user_id, type, title, message, delivery_methods
  ) VALUES (
    v_user_id, 'STATUS_UPDATE', 'Welcome!', 'Welcome to our travel service', '["PORTAL", "EMAIL"]'::jsonb
  );
  
  RETURN v_user_id;
END;
$$;

-- Function: Update visa application status
CREATE OR REPLACE FUNCTION update_visa_status(
  p_visa_id UUID,
  p_new_status TEXT,
  p_triggered_by TEXT DEFAULT 'SYSTEM'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_status TEXT;
  v_user_id UUID;
  v_notification_type TEXT;
BEGIN
  -- Get current status and user_id
  SELECT status, user_id INTO v_old_status, v_user_id
  FROM public.visa_applications
  WHERE id = p_visa_id;
  
  -- Update status
  UPDATE public.visa_applications
  SET status = p_new_status, last_status_change_at = NOW(), updated_at = NOW()
  WHERE id = p_visa_id;
  
  -- Log state change
  INSERT INTO public.state_machine_events (
    entity_type, entity_id, previous_state, new_state, event_type, triggered_by
  ) VALUES (
    'VISA_APPLICATION', p_visa_id, v_old_status, p_new_status, 'VISA_STATUS_CHANGED', p_triggered_by
  );
  
  -- Send notification based on new status
  v_notification_type := CASE p_new_status
    WHEN 'UNDER_REVIEW' THEN 'VISA_STATUS_CHANGED'
    WHEN 'SUBMITTED_TO_EMBASSY' THEN 'VISA_STATUS_CHANGED'
    WHEN 'APPROVED' THEN 'VISA_STATUS_CHANGED'
    WHEN 'REJECTED' THEN 'VISA_STATUS_CHANGED'
    ELSE 'STATUS_UPDATE'
  END;
  
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.crm_notifications (
      user_id, type, title, message, action_url
    ) VALUES (
      v_user_id, v_notification_type,
      'Visa Status Updated',
      'Your visa application status has been updated to: ' || p_new_status,
      '/visas/' || p_visa_id
    );
  END IF;
END;
$$;

-- Function: Create quotation and send to user
CREATE OR REPLACE FUNCTION create_quotation(
  p_user_id UUID,
  p_visa_app_id UUID,
  p_items JSONB,
  p_total_amount NUMERIC,
  p_currency TEXT DEFAULT 'EGP'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quote_id UUID;
BEGIN
  INSERT INTO public.quotations (
    user_id, visa_application_id, items, total_amount, currency, status, created_at
  ) VALUES (
    p_user_id, p_visa_app_id, p_items, p_total_amount, p_currency, 'DRAFT', NOW()
  )
  RETURNING id INTO v_quote_id;
  
  -- Log state change
  INSERT INTO public.state_machine_events (
    entity_type, entity_id, previous_state, new_state, event_type, triggered_by
  ) VALUES (
    'QUOTATION', v_quote_id, NULL, 'DRAFT', 'QUOTATION_CREATED', 'SYSTEM'
  );
  
  RETURN v_quote_id;
END;
$$;

-- Function: Send quotation to user
CREATE OR REPLACE FUNCTION send_quotation(p_quote_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_total_amount NUMERIC;
  v_currency TEXT;
BEGIN
  UPDATE public.quotations
  SET status = 'SENT', sent_at = NOW(), valid_until = NOW() + INTERVAL '7 days'
  WHERE id = p_quote_id;
  
  SELECT user_id, total_amount, currency INTO v_user_id, v_total_amount, v_currency
  FROM public.quotations WHERE id = p_quote_id;
  
  -- Log state change
  INSERT INTO public.state_machine_events (
    entity_type, entity_id, previous_state, new_state, event_type, triggered_by
  ) VALUES (
    'QUOTATION', p_quote_id, 'DRAFT', 'SENT', 'QUOTATION_SENT', 'CRM_STAFF'
  );
  
  -- Send notification
  IF v_user_id IS NOT NULL THEN
    INSERT INTO public.crm_notifications (
      user_id, type, title, message, action_url
    ) VALUES (
      v_user_id, 'QUOTATION_SENT',
      'New Quote Available',
      'A new quotation of ' || v_total_amount || ' ' || v_currency || ' is ready for you',
      '/quotations/' || p_quote_id
    );
  END IF;
END;
$$;

-- Function: Accept quotation and create booking
CREATE OR REPLACE FUNCTION accept_quotation_and_create_booking(p_quote_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_total_amount NUMERIC;
  v_booking_id UUID;
BEGIN
  -- Get quotation details
  SELECT user_id, total_amount INTO v_user_id, v_total_amount
  FROM public.quotations WHERE id = p_quote_id;
  
  -- Update quotation status
  UPDATE public.quotations
  SET status = 'ACCEPTED', accepted_at = NOW()
  WHERE id = p_quote_id;
  
  -- Create booking
  INSERT INTO public.bookings (
    user_id, quotation_id, booking_reference, status
  ) VALUES (
    v_user_id, p_quote_id,
    'BK' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || SUBSTRING(gen_random_uuid()::text, 1, 8),
    'PENDING_PAYMENT'
  )
  RETURNING id INTO v_booking_id;
  
  -- Create financial transaction
  INSERT INTO public.financial_transactions (
    booking_id, user_id, amount_paid, remaining_balance, payment_method, created_at
  ) VALUES (
    v_booking_id, v_user_id, 0, v_total_amount, 'PENDING', NOW()
  );
  
  -- Log state changes
  INSERT INTO public.state_machine_events (entity_type, entity_id, previous_state, new_state, event_type, triggered_by)
  VALUES ('QUOTATION', p_quote_id, 'SENT', 'ACCEPTED', 'QUOTE_ACCEPTED', 'USER'),
         ('BOOKING', v_booking_id, NULL, 'PENDING_PAYMENT', 'BOOKING_CREATED', 'SYSTEM');
  
  -- Send notification
  INSERT INTO public.crm_notifications (
    user_id, type, title, message, action_url
  ) VALUES (
    v_user_id, 'BOOKING_CONFIRMED',
    'Booking Created',
    'Your booking has been created. Please proceed with payment.',
    '/bookings/' || v_booking_id
  );
  
  RETURN v_booking_id;
END;
$$;

-- Function: Record payment and generate voucher
CREATE OR REPLACE FUNCTION record_payment_and_generate_voucher(
  p_transaction_id UUID,
  p_amount_paid NUMERIC,
  p_payment_method TEXT,
  p_receipt_url TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
  v_user_id UUID;
  v_remaining NUMERIC;
  v_voucher_url TEXT;
BEGIN
  -- Get transaction details
  SELECT booking_id, user_id, remaining_balance INTO v_booking_id, v_user_id, v_remaining
  FROM public.financial_transactions WHERE id = p_transaction_id;
  
  -- Update transaction
  UPDATE public.financial_transactions
  SET amount_paid = p_amount_paid,
      remaining_balance = GREATEST(0, v_remaining - p_amount_paid),
      payment_method = p_payment_method,
      receipt_url = p_receipt_url,
      paid_at = NOW(),
      updated_at = NOW()
  WHERE id = p_transaction_id;
  
  -- If fully paid, generate voucher
  IF (v_remaining - p_amount_paid) <= 0 THEN
    v_voucher_url := '/vouchers/' || p_transaction_id || '.pdf';
    
    UPDATE public.bookings
    SET status = 'CONFIRMED',
        voucher_url = v_voucher_url,
        voucher_generated_at = NOW(),
        updated_at = NOW()
    WHERE id = v_booking_id;
    
    -- Log state change
    INSERT INTO public.state_machine_events (
      entity_type, entity_id, previous_state, new_state, event_type, triggered_by
    ) VALUES (
      'BOOKING', v_booking_id, 'PENDING_PAYMENT', 'CONFIRMED', 'PAYMENT_RECEIVED', 'CRM_STAFF'
    );
    
    -- Send notification
    INSERT INTO public.crm_notifications (
      user_id, type, title, message, action_url
    ) VALUES (
      v_user_id, 'VOUCHER_READY',
      'Voucher Ready',
      'Your voucher is ready for download',
      '/vouchers/' || p_transaction_id
    );
  END IF;
END;
$$;

-- 9. AUTO-SYNC TRIGGERS (المزامنة التلقائية)
-- =====================================================================

-- Trigger: Update state_machine_events timestamp when user status changes
CREATE OR REPLACE FUNCTION log_user_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO public.state_machine_events (
      entity_type, entity_id, previous_state, new_state, event_type, triggered_by
    ) VALUES (
      'USER', NEW.id, OLD.status, NEW.status, 'USER_STATUS_CHANGED', 'SYSTEM'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_status_change ON public.users;
CREATE TRIGGER trg_user_status_change
AFTER UPDATE OF status ON public.users
FOR EACH ROW
EXECUTE FUNCTION log_user_status_change();

-- 10. VIEWS FOR CRM DASHBOARD
-- =====================================================================

-- View: Customer Journey Overview
CREATE OR REPLACE VIEW customer_journey_overview AS
SELECT 
  u.id,
  u.email,
  u.first_name,
  u.last_name,
  u.status as user_status,
  COUNT(DISTINCT va.id) as visa_applications_count,
  COUNT(DISTINCT q.id) as quotations_sent,
  COUNT(DISTINCT b.id) as bookings_created,
  SUM(ft.amount_paid) as total_paid,
  MAX(sme.created_at) as last_activity
FROM public.users u
LEFT JOIN public.visa_applications va ON u.id = va.user_id
LEFT JOIN public.quotations q ON u.id = q.user_id
LEFT JOIN public.bookings b ON u.id = b.user_id
LEFT JOIN public.financial_transactions ft ON b.id = ft.booking_id
LEFT JOIN public.state_machine_events sme ON u.id = sme.entity_id
GROUP BY u.id, u.email, u.first_name, u.last_name, u.status;

-- View: Pending Actions for Staff
CREATE OR REPLACE VIEW pending_crm_actions AS
SELECT 
  'VISA_REVIEW' as action_type,
  va.id as entity_id,
  u.id as user_id,
  u.email,
  u.first_name,
  va.status,
  va.created_at,
  COUNT(DISTINCT doc) as documents_uploaded
FROM public.visa_applications va
JOIN public.users u ON va.user_id = u.id
CROSS JOIN LATERAL jsonb_array_elements(va.documents) as doc
WHERE va.status IN ('DOCS_PENDING', 'UNDER_REVIEW')
GROUP BY va.id, u.id, u.email, u.first_name, va.status, va.created_at

UNION ALL

SELECT 
  'QUOTATION_WAITING' as action_type,
  q.id as entity_id,
  u.id as user_id,
  u.email,
  u.first_name,
  q.status,
  q.created_at,
  0
FROM public.quotations q
JOIN public.users u ON q.user_id = u.id
WHERE q.status = 'SENT' AND q.valid_until > NOW()

UNION ALL

SELECT 
  'PAYMENT_PENDING' as action_type,
  ft.id as entity_id,
  u.id as user_id,
  u.email,
  u.first_name,
  b.status,
  ft.created_at,
  0
FROM public.financial_transactions ft
JOIN public.bookings b ON ft.booking_id = b.id
JOIN public.users u ON ft.user_id = u.id
WHERE b.status = 'PENDING_PAYMENT';

-- 11. AUDIT LOGGING
-- =====================================================================

INSERT INTO public.system_logs (level, event, details, source)
VALUES (
  'success',
  'crm_data_pipeline_deployed',
  'Complete CRM Data Pipeline with State Machine, Foreign Keys, and Event Drivers deployed',
  'migration'
);

SELECT 'CRM Data Pipeline Deployed ✅' as status;
