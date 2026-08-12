-- =====================================================================
-- Event System & Synchronization Migration
-- Adds event tracking and sync fields for Portal ↔ CRM data flow
-- =====================================================================

-- 1. ADD SYNC FIELDS TO CORE ENTITIES
-- =====================================================================

-- Add event tracking to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS sync_id UUID,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced' 
    CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_sync_status 
  ON public.profiles(sync_status) WHERE sync_status != 'synced';

COMMENT ON COLUMN public.profiles.sync_id IS
  'External sync ID for CRM reference — set when synced to CRM';

COMMENT ON COLUMN public.profiles.last_sync_at IS
  'Timestamp of last successful sync to CRM';

-- Add event tracking to travel_requests
ALTER TABLE public.travel_requests
  ADD COLUMN IF NOT EXISTS sync_id UUID,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' 
    CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_travel_requests_sync_status 
  ON public.travel_requests(sync_status) WHERE sync_status != 'synced';

COMMENT ON COLUMN public.travel_requests.sync_id IS
  'CRM booking ID — set when synced';

-- Add event tracking to visa_applications
ALTER TABLE public.visa_applications
  ADD COLUMN IF NOT EXISTS sync_id UUID,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' 
    CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_visa_applications_sync_status 
  ON public.visa_applications(sync_status);

-- Add event tracking to payment_records
ALTER TABLE public.payment_records
  ADD COLUMN IF NOT EXISTS sync_id UUID,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' 
    CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_records_sync_status 
  ON public.payment_records(sync_status);

-- Add event tracking to customer_documents
ALTER TABLE public.customer_documents
  ADD COLUMN IF NOT EXISTS sync_id UUID,
  ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending' 
    CHECK (sync_status IN ('pending', 'synced', 'failed')),
  ADD COLUMN IF NOT EXISTS sync_error TEXT;

CREATE INDEX IF NOT EXISTS idx_customer_documents_sync_status 
  ON public.customer_documents(sync_status);

-- 2. CREATE EVENT LOG TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.event_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event metadata
  event_type TEXT NOT NULL 
    CHECK (event_type IN (
      'UserRegistered',           -- User signed up
      'BookingCreated',           -- Travel request submitted
      'DocumentSubmitted',        -- Customer uploaded document
      'StatusChanged',            -- Request status changed
      'ProfileUpdated',           -- User profile changed
      'PaymentCreated',           -- Payment recorded
      'SyncCompleted',            -- Sync operation finished
      'SyncFailed'                -- Sync operation failed
    )),
  
  -- Relationship
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  travel_request_id UUID REFERENCES public.travel_requests(id) ON DELETE SET NULL,
  document_id UUID REFERENCES public.customer_documents(id) ON DELETE SET NULL,
  
  -- Event data (JSON)
  data JSONB NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' 
    CHECK (status IN ('pending', 'processed', 'failed')),
  error_message TEXT,
  
  -- Processing
  processed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_log_event_type 
  ON public.event_log(event_type);

CREATE INDEX IF NOT EXISTS idx_event_log_user_id 
  ON public.event_log(user_id);

CREATE INDEX IF NOT EXISTS idx_event_log_status 
  ON public.event_log(status) WHERE status != 'processed';

CREATE INDEX IF NOT EXISTS idx_event_log_created_at 
  ON public.event_log(created_at DESC);

COMMENT ON TABLE public.event_log IS
  'All registration and sync events — used for audit trail and event processing';

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_event_log_updated_at ON public.event_log;
CREATE TRIGGER trg_event_log_updated_at
  BEFORE UPDATE ON public.event_log
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS (staff can view events)
ALTER TABLE public.event_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_read_event_log" ON public.event_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() AND role IN ('staff', 'admin'))
  );

-- 3. CREATE SYNC QUEUE TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What to sync
  entity_type TEXT NOT NULL 
    CHECK (entity_type IN ('profile', 'travel_request', 'visa_application', 'payment', 'document')),
  entity_id UUID NOT NULL,
  
  -- Sync direction
  direction TEXT NOT NULL DEFAULT 'portal_to_crm'
    CHECK (direction IN ('portal_to_crm', 'crm_to_portal')),
  
  -- Sync status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  
  -- Payload (what changed)
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Error tracking
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '5 minutes'
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status 
  ON public.sync_queue(status) WHERE status != 'completed';

CREATE INDEX IF NOT EXISTS idx_sync_queue_entity 
  ON public.sync_queue(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_sync_queue_next_retry 
  ON public.sync_queue(next_retry_at) WHERE status = 'pending';

COMMENT ON TABLE public.sync_queue IS
  'Queue of entities waiting to be synced between Portal and CRM';

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_sync_queue_updated_at ON public.sync_queue;
CREATE TRIGGER trg_sync_queue_updated_at
  BEFORE UPDATE ON public.sync_queue
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Enable RLS
ALTER TABLE public.sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_sync_queue" ON public.sync_queue FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. HELPER FUNCTIONS FOR EVENT SYSTEM
-- =====================================================================

-- Log registration event
CREATE OR REPLACE FUNCTION log_registration_event(
  p_user_id UUID,
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_id UUID;
BEGIN
  INSERT INTO public.event_log (event_type, user_id, data)
  VALUES (
    'UserRegistered',
    p_user_id,
    jsonb_build_object(
      'email', p_email,
      'first_name', p_first_name,
      'last_name', p_last_name,
      'timestamp', NOW()
    )
  )
  RETURNING id INTO v_event_id;
  
  RETURN v_event_id;
END;
$$;

COMMENT ON FUNCTION log_registration_event IS
  'Log user registration event to event_log';

-- Queue entity for sync
CREATE OR REPLACE FUNCTION queue_for_sync(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_direction TEXT DEFAULT 'portal_to_crm',
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_queue_id UUID;
BEGIN
  INSERT INTO public.sync_queue (entity_type, entity_id, direction, payload, status)
  VALUES (p_entity_type, p_entity_id, p_direction, p_payload, 'pending')
  RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$;

COMMENT ON FUNCTION queue_for_sync IS
  'Add entity to sync queue for eventual sync to CRM';

-- Mark entity as synced
CREATE OR REPLACE FUNCTION mark_synced(
  p_table_name TEXT,
  p_id UUID,
  p_sync_id UUID DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CASE p_table_name
    WHEN 'profiles' THEN
      UPDATE public.profiles 
      SET 
        sync_status = CASE WHEN p_error_message IS NULL THEN 'synced' ELSE 'failed' END,
        sync_id = CASE WHEN p_sync_id IS NOT NULL THEN p_sync_id ELSE sync_id END,
        last_sync_at = NOW(),
        sync_error = p_error_message
      WHERE id = p_id;
    
    WHEN 'travel_requests' THEN
      UPDATE public.travel_requests 
      SET 
        sync_status = CASE WHEN p_error_message IS NULL THEN 'synced' ELSE 'failed' END,
        sync_id = CASE WHEN p_sync_id IS NOT NULL THEN p_sync_id ELSE sync_id END,
        last_sync_at = NOW(),
        sync_error = p_error_message
      WHERE id = p_id;
    
    WHEN 'visa_applications' THEN
      UPDATE public.visa_applications 
      SET 
        sync_status = CASE WHEN p_error_message IS NULL THEN 'synced' ELSE 'failed' END,
        sync_id = CASE WHEN p_sync_id IS NOT NULL THEN p_sync_id ELSE sync_id END,
        last_sync_at = NOW(),
        sync_error = p_error_message
      WHERE id = p_id;
    
    WHEN 'payment_records' THEN
      UPDATE public.payment_records 
      SET 
        sync_status = CASE WHEN p_error_message IS NULL THEN 'synced' ELSE 'failed' END,
        sync_id = CASE WHEN p_sync_id IS NOT NULL THEN p_sync_id ELSE sync_id END,
        last_sync_at = NOW(),
        sync_error = p_error_message
      WHERE id = p_id;
    
    WHEN 'customer_documents' THEN
      UPDATE public.customer_documents 
      SET 
        sync_status = CASE WHEN p_error_message IS NULL THEN 'synced' ELSE 'failed' END,
        sync_id = CASE WHEN p_sync_id IS NOT NULL THEN p_sync_id ELSE sync_id END,
        last_sync_at = NOW(),
        sync_error = p_error_message
      WHERE id = p_id;
  END CASE;
END;
$$;

COMMENT ON FUNCTION mark_synced IS
  'Mark entity as synced (or failed) after sync attempt';

-- Get pending sync items
CREATE OR REPLACE FUNCTION get_pending_syncs()
RETURNS TABLE (
  queue_id UUID,
  entity_type TEXT,
  entity_id UUID,
  direction TEXT,
  payload JSONB,
  retry_count INTEGER
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    id, 
    entity_type, 
    entity_id, 
    direction, 
    payload,
    retry_count
  FROM public.sync_queue
  WHERE status = 'pending' 
    AND (next_retry_at IS NULL OR next_retry_at <= NOW())
    AND retry_count < max_retries
  ORDER BY created_at ASC
  LIMIT 100;
$$;

COMMENT ON FUNCTION get_pending_syncs IS
  'Get next batch of items pending sync to CRM';

-- 5. TRIGGER: Auto-queue profile on creation
-- =====================================================================

DROP TRIGGER IF EXISTS trg_profile_queue_sync ON public.profiles;
CREATE TRIGGER trg_profile_queue_sync
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION queue_for_sync('profile', NEW.id, 'portal_to_crm');

COMMENT ON TRIGGER trg_profile_queue_sync ON public.profiles IS
  'Auto-queue new profiles for sync to CRM';

-- 6. TRIGGER: Auto-queue travel_request on creation
-- =====================================================================

DROP TRIGGER IF EXISTS trg_travel_request_queue_sync ON public.travel_requests;
CREATE TRIGGER trg_travel_request_queue_sync
  AFTER INSERT ON public.travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION queue_for_sync('travel_request', NEW.id, 'portal_to_crm');

COMMENT ON TRIGGER trg_travel_request_queue_sync ON public.travel_requests IS
  'Auto-queue new travel requests for sync to CRM';

-- 7. TRIGGER: Auto-queue document on creation
-- =====================================================================

DROP TRIGGER IF EXISTS trg_document_queue_sync ON public.customer_documents;
CREATE TRIGGER trg_document_queue_sync
  AFTER INSERT ON public.customer_documents
  FOR EACH ROW
  EXECUTE FUNCTION queue_for_sync('document', NEW.id, 'portal_to_crm');

COMMENT ON TRIGGER trg_document_queue_sync ON public.customer_documents IS
  'Auto-queue new documents for sync to CRM';

-- 8. DONE
-- =====================================================================

-- Log migration completion
INSERT INTO public.system_logs (level, event, details, source)
VALUES (
  'success',
  'migration_complete',
  'Event system and sync infrastructure deployed',
  'system'
);

SELECT 'Event System Migration Complete ✅' as status;
