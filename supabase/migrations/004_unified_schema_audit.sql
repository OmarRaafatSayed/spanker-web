-- =====================================================================
-- TASK 2: Unified Data Schema & Entity Synchronization Audit
-- Core entities use single source with UUID foreign keys
-- =====================================================================

-- 1. AUDIT: Verify core entity relationships use UUIDs and consistent FKs
-- =====================================================================

-- Profiles: auth.users → profiles (portal user identity)
-- ✅ user_id UUID UNIQUE NOT NULL → auth.users(id)
-- ✅ id UUID PRIMARY KEY (matches visa_applications.created_by, payment_records.created_by)

-- Travel Requests: auth.users → travel_requests (portal customer booking)
-- ✅ client_user_id UUID → auth.users(id)
-- ✅ linked_visa_application_id UUID → visa_applications(id)
-- ✅ linked_payment_id UUID → payment_records(id)
-- ✅ assigned_staff_id UUID → auth.users(id)

-- Visa Applications: dual reference (staff creator + customer owner)
-- ✅ created_by UUID → profiles(id) [staff who entered the record]
-- ✅ client_user_id UUID → auth.users(id) [portal customer who owns it]

-- Payment Records: dual reference
-- ✅ created_by UUID → profiles(id) [staff who recorded payment]
-- ✅ client_user_id UUID → auth.users(id) [portal customer who made payment]

-- Customer Documents: Portal customer documents for travel requests
-- ✅ travel_request_id UUID → travel_requests(id)
-- ✅ client_user_id UUID → auth.users(id)

-- Hotel Offers: Staff-created inventory
-- ✅ created_by UUID → profiles(id) [staff who created offer]

-- 2. CREATE UNIFIED CUSTOMER PROFILE TABLE (core data source)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auth link (single source of truth for customer identity)
  auth_user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- CRM cross-reference (set when synced to external CRM)
  crm_customer_id UUID,
  crm_last_synced TIMESTAMPTZ,
  
  -- Customer info (denormalized from auth + profiles)
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  country TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Preferences
  preferred_communication TEXT DEFAULT 'email' CHECK (preferred_communication IN ('email', 'whatsapp', 'sms', 'phone')),
  language TEXT DEFAULT 'en',
  
  -- KYC / Profile Completion
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  profile_completion_percent INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customer_profiles_auth_user_id ON public.customer_profiles(auth_user_id);
CREATE INDEX idx_customer_profiles_crm_customer_id ON public.customer_profiles(crm_customer_id);
CREATE INDEX idx_customer_profiles_email ON public.customer_profiles(email);
CREATE INDEX idx_customer_profiles_status ON public.customer_profiles(status);

ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers_view_own_profile" ON public.customer_profiles FOR SELECT
  TO authenticated USING (auth_user_id = auth.uid());

CREATE POLICY "service_role_manage_all" ON public.customer_profiles FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.customer_profiles IS
  'Central customer profile — unified source for Portal customers with CRM sync tracking';

-- 3. CREATE BOOKING AGGREGATE TABLE (denormalized view)
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.booking_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Core booking reference
  travel_request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  
  -- Customer (denormalized for performance)
  customer_id UUID NOT NULL REFERENCES public.customer_profiles(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  
  -- Booking timeline
  status TEXT NOT NULL DEFAULT 'pending_documents' CHECK (status IN (
    'pending_documents', 'documents_review', 'docs_approved', 'in_progress', 'completed', 'cancelled'
  )),
  
  -- Cross-entity references (all linked via this one record)
  linked_visa_id UUID REFERENCES public.visa_applications(id) ON DELETE SET NULL,
  linked_payment_id UUID REFERENCES public.payment_records(id) ON DELETE SET NULL,
  
  -- CRM sync status
  crm_booking_id UUID,
  crm_sync_status TEXT DEFAULT 'pending' CHECK (crm_sync_status IN ('pending', 'synced', 'failed')),
  crm_last_sync TIMESTAMPTZ,
  crm_sync_error TEXT,
  
  -- Totals (denormalized from related records)
  total_amount NUMERIC(12,2) DEFAULT 0,
  amount_paid NUMERIC(12,2) DEFAULT 0,
  amount_due NUMERIC(12,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_booking_agg_customer ON public.booking_aggregates(customer_id);
CREATE INDEX idx_booking_agg_travel_request ON public.booking_aggregates(travel_request_id);
CREATE INDEX idx_booking_agg_crm_booking ON public.booking_aggregates(crm_booking_id);
CREATE INDEX idx_booking_agg_status ON public.booking_aggregates(status);
CREATE INDEX idx_booking_agg_crm_sync ON public.booking_aggregates(crm_sync_status) WHERE crm_sync_status != 'synced';

ALTER TABLE public.booking_aggregates ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE public.booking_aggregates IS
  'Denormalized booking view — aggregates travel_request + visa + payment for Portal ↔ CRM sync';

-- 4. UPDATE visa_applications: Add CRM sync fields if missing
-- =====================================================================

ALTER TABLE public.visa_applications
  ADD COLUMN IF NOT EXISTS sync_id UUID,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- 5. UPDATE payment_records: Add CRM sync fields if missing
-- =====================================================================

ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS sync_id UUID,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

-- 6. CREATE ENTITY SYNC STATE MACHINE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.entity_sync_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Entity identification
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'customer_profile', 'travel_request', 'visa_application', 'payment_record', 'document'
  )),
  entity_id UUID NOT NULL,
  
  -- Portal ↔ CRM sync direction
  direction TEXT NOT NULL DEFAULT 'portal_to_crm' CHECK (direction IN ('portal_to_crm', 'crm_to_portal')),
  
  -- State machine states
  state TEXT NOT NULL DEFAULT 'created' CHECK (state IN (
    'created',        -- Entity created in Portal
    'queued',         -- Queued for CRM sync
    'syncing',        -- In-flight to CRM
    'synced',         -- Successfully synced, CRM ID stored
    'sync_failed',    -- Sync attempt failed
    'conflict',       -- Data conflict between Portal & CRM
    'deleted'         -- Entity deleted
  )),
  
  -- CRM reference
  crm_id UUID,          -- External CRM entity ID
  crm_last_update TIMESTAMPTZ,
  
  -- Retry tracking
  sync_attempts INTEGER DEFAULT 0,
  max_retry_attempts INTEGER DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Payload for async processing
  payload JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_entity_sync_state_lookup ON public.entity_sync_state(entity_type, entity_id);
CREATE INDEX idx_entity_sync_state_crm_id ON public.entity_sync_state(crm_id) WHERE crm_id IS NOT NULL;
CREATE INDEX idx_entity_sync_state_state ON public.entity_sync_state(state) WHERE state != 'synced';
CREATE INDEX idx_entity_sync_state_retry ON public.entity_sync_state(next_retry_at) WHERE state = 'sync_failed';

ALTER TABLE public.entity_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage_sync_state" ON public.entity_sync_state FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.entity_sync_state IS
  'State machine for Portal ↔ CRM synchronization — tracks sync progress, CRM IDs, and retry attempts';

-- 7. HELPER FUNCTION: Get Customer Profile by Auth User
-- =====================================================================

CREATE OR REPLACE FUNCTION get_customer_profile(p_auth_user_id UUID)
RETURNS public.customer_profiles
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT * FROM public.customer_profiles WHERE auth_user_id = p_auth_user_id LIMIT 1;
$$;

-- 8. HELPER FUNCTION: Create or Update Customer Profile
-- =====================================================================

CREATE OR REPLACE FUNCTION upsert_customer_profile(
  p_auth_user_id UUID,
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL
)
RETURNS public.customer_profiles
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile public.customer_profiles;
BEGIN
  INSERT INTO public.customer_profiles (
    auth_user_id, email, first_name, last_name, phone, country
  ) VALUES (
    p_auth_user_id, p_email, p_first_name, p_last_name, p_phone, p_country
  )
  ON CONFLICT (auth_user_id) DO UPDATE SET
    email = COALESCE(p_email, customer_profiles.email),
    first_name = COALESCE(p_first_name, customer_profiles.first_name),
    last_name = COALESCE(p_last_name, customer_profiles.last_name),
    phone = COALESCE(p_phone, customer_profiles.phone),
    country = COALESCE(p_country, customer_profiles.country),
    updated_at = NOW()
  RETURNING * INTO v_profile;
  
  RETURN v_profile;
END;
$$;

-- 9. HELPER FUNCTION: Transition Entity Sync State
-- =====================================================================

CREATE OR REPLACE FUNCTION transition_sync_state(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_new_state TEXT,
  p_crm_id UUID DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS public.entity_sync_state
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_state TEXT;
  v_sync_record public.entity_sync_state;
BEGIN
  -- Get current state
  SELECT state INTO v_current_state
  FROM public.entity_sync_state
  WHERE entity_type = p_entity_type AND entity_id = p_entity_id
  LIMIT 1;
  
  -- Validate state transition (simple state machine)
  IF v_current_state IS NOT NULL THEN
    IF (v_current_state = 'synced' AND p_new_state != 'deleted') THEN
      -- Can't revert from synced state unless deleting
      RAISE EXCEPTION 'Cannot transition from % to %', v_current_state, p_new_state;
    END IF;
  END IF;
  
  -- Update or insert
  INSERT INTO public.entity_sync_state (
    entity_type, entity_id, state, crm_id, last_error, sync_attempts
  ) VALUES (
    p_entity_type, p_entity_id, p_new_state, p_crm_id, p_error, 0
  )
  ON CONFLICT (entity_type, entity_id) DO UPDATE SET
    state = p_new_state,
    crm_id = COALESCE(p_crm_id, entity_sync_state.crm_id),
    last_error = COALESCE(p_error, entity_sync_state.last_error),
    sync_attempts = CASE WHEN p_new_state = 'sync_failed' 
                         THEN entity_sync_state.sync_attempts + 1
                         ELSE entity_sync_state.sync_attempts END,
    next_retry_at = CASE WHEN p_new_state = 'sync_failed'
                         THEN NOW() + INTERVAL '5 minutes'
                         ELSE entity_sync_state.next_retry_at END,
    updated_at = NOW()
  RETURNING * INTO v_sync_record;
  
  RETURN v_sync_record;
END;
$$;

-- 10. HELPER FUNCTION: Get Pending Syncs for CRM
-- =====================================================================

CREATE OR REPLACE FUNCTION get_pending_crm_syncs(p_limit INT DEFAULT 50)
RETURNS TABLE (
  sync_id UUID,
  entity_type TEXT,
  entity_id UUID,
  direction TEXT,
  state TEXT,
  payload JSONB,
  sync_attempts INTEGER,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    id, entity_type, entity_id, direction, state, payload, sync_attempts, created_at
  FROM public.entity_sync_state
  WHERE state IN ('queued', 'sync_failed')
    AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    AND sync_attempts < max_retry_attempts
  ORDER BY created_at ASC
  LIMIT p_limit;
$$;

-- 11. TRIGGER: Auto-create sync state for new travel requests
-- =====================================================================

CREATE OR REPLACE FUNCTION auto_queue_travel_request_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create sync state record for CRM
  PERFORM transition_sync_state(
    'travel_request',
    NEW.id,
    'queued'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_queue_travel_request ON public.travel_requests;
CREATE TRIGGER trg_auto_queue_travel_request
  AFTER INSERT ON public.travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION auto_queue_travel_request_sync();

-- 12. TRIGGER: Auto-create booking aggregate on travel request creation
-- =====================================================================

CREATE OR REPLACE FUNCTION create_booking_aggregate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer public.customer_profiles;
BEGIN
  -- Get or create customer profile
  SELECT * INTO v_customer
  FROM public.customer_profiles
  WHERE auth_user_id = NEW.client_user_id;
  
  IF v_customer IS NULL THEN
    -- Create customer profile if missing
    PERFORM upsert_customer_profile(NEW.client_user_id, (
      SELECT email FROM auth.users WHERE id = NEW.client_user_id
    ));
    SELECT * INTO v_customer
    FROM public.customer_profiles
    WHERE auth_user_id = NEW.client_user_id;
  END IF;
  
  -- Create booking aggregate
  INSERT INTO public.booking_aggregates (
    travel_request_id, customer_id, customer_email, status
  ) VALUES (
    NEW.id, v_customer.id, v_customer.email, NEW.status
  );
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_create_booking_aggregate ON public.travel_requests;
CREATE TRIGGER trg_create_booking_aggregate
  AFTER INSERT ON public.travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_aggregate();

-- 13. SUMMARY VIEWS FOR DASHBOARD
-- =====================================================================

-- View: All pending CRM syncs
CREATE OR REPLACE VIEW pending_crm_syncs AS
SELECT 
  ess.id,
  ess.entity_type,
  ess.entity_id,
  ess.state,
  ess.sync_attempts,
  ess.created_at,
  CASE ess.entity_type
    WHEN 'customer_profile' THEN (SELECT email FROM public.customer_profiles WHERE id = ess.entity_id)
    WHEN 'travel_request' THEN (SELECT customer_email FROM public.booking_aggregates WHERE travel_request_id = ess.entity_id)
    ELSE NULL
  END as related_email
FROM public.entity_sync_state ess
WHERE ess.state IN ('queued', 'sync_failed')
  AND (ess.next_retry_at IS NULL OR ess.next_retry_at <= NOW())
ORDER BY ess.created_at ASC;

-- View: Customer booking summary
CREATE OR REPLACE VIEW customer_booking_summary AS
SELECT 
  cp.id as customer_id,
  cp.email,
  cp.first_name,
  cp.last_name,
  COUNT(ba.id) as total_bookings,
  COUNT(CASE WHEN ba.status = 'completed' THEN 1 END) as completed_bookings,
  COALESCE(SUM(ba.total_amount), 0) as total_amount,
  COALESCE(SUM(ba.amount_paid), 0) as amount_paid,
  COALESCE(SUM(ba.amount_due), 0) as amount_due,
  MAX(ba.updated_at) as last_booking_update
FROM public.customer_profiles cp
LEFT JOIN public.booking_aggregates ba ON cp.id = ba.customer_id
GROUP BY cp.id, cp.email, cp.first_name, cp.last_name;

-- 14. AUDIT LOGGING
-- =====================================================================

INSERT INTO public.system_logs (level, event, details, source)
VALUES (
  'success',
  'unified_schema_deployed',
  'Unified data schema with entity sync state machine deployed successfully',
  'migration'
);

SELECT 'Unified Schema & Entity Sync State Machine Deployed ✅' as status;
