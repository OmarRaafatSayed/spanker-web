-- =====================================================================
-- Migration 008: Profile Sync Trigger
-- Automatically queue new profiles for CRM sync
-- =====================================================================

-- Add sync_status column to profiles if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'sync_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed'));
    ALTER TABLE profiles ADD COLUMN last_sync_at TIMESTAMPTZ;
    ALTER TABLE profiles ADD COLUMN sync_error TEXT;
    CREATE INDEX idx_profiles_sync_status ON profiles(sync_status);
    RAISE NOTICE 'Added sync_status columns to profiles table';
  END IF;
END $$;

-- Ensure sync_queue table exists
CREATE TABLE IF NOT EXISTS sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('profile', 'travel_request', 'visa_application', 'payment', 'document')),
  entity_id TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT 'portal_to_crm' CHECK (direction IN ('portal_to_crm', 'crm_to_portal')),
  payload JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INT DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_next_retry ON sync_queue(next_retry_at) WHERE status = 'pending';

-- Create trigger function to queue new profiles for sync
CREATE OR REPLACE FUNCTION queue_profile_for_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new sync_queue entry for the new profile
  INSERT INTO sync_queue (
    entity_type,
    entity_id,
    direction,
    payload,
    status
  ) VALUES (
    'profile',
    NEW.id::TEXT,
    'portal_to_crm',
    jsonb_build_object(
      'full_name', NEW.full_name,
      'phone', NEW.phone,
      'user_id', NEW.user_id,
      'role', NEW.role
    ),
    'pending'
  );

  -- Update sync status
  NEW.sync_status := 'pending';
  
  RAISE LOG 'Profile % queued for CRM sync', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS profile_sync_trigger ON profiles;

-- Create trigger on profiles insert
CREATE TRIGGER profile_sync_trigger
AFTER INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION queue_profile_for_sync();

-- Trigger function to update sync status when documents are uploaded
CREATE OR REPLACE FUNCTION queue_document_for_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new sync_queue entry for the document
  INSERT INTO sync_queue (
    entity_type,
    entity_id,
    direction,
    payload,
    status
  ) VALUES (
    'document',
    NEW.id::TEXT,
    'portal_to_crm',
    jsonb_build_object(
      'travel_request_id', NEW.travel_request_id,
      'client_user_id', NEW.client_user_id,
      'document_type', NEW.document_type,
      'file_name', NEW.file_name,
      'status', NEW.status
    ),
    'pending'
  );

  RAISE LOG 'Document % queued for CRM sync', NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop old trigger if exists
DROP TRIGGER IF EXISTS document_sync_trigger ON customer_documents;

-- Create trigger on customer_documents insert
CREATE TRIGGER document_sync_trigger
AFTER INSERT ON customer_documents
FOR EACH ROW
EXECUTE FUNCTION queue_document_for_sync();

-- RPC function to get pending syncs
CREATE OR REPLACE FUNCTION get_pending_syncs()
RETURNS TABLE (
  queue_id UUID,
  entity_type TEXT,
  entity_id TEXT,
  direction TEXT,
  payload JSONB,
  retry_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sq.id,
    sq.entity_type,
    sq.entity_id,
    sq.direction,
    sq.payload,
    sq.retry_count
  FROM sync_queue sq
  WHERE sq.status = 'pending'
    AND (sq.next_retry_at IS NULL OR sq.next_retry_at <= NOW())
  ORDER BY sq.created_at ASC
  LIMIT 100;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION queue_profile_for_sync TO service_role;
GRANT EXECUTE ON FUNCTION queue_document_for_sync TO service_role;
GRANT EXECUTE ON FUNCTION get_pending_syncs TO service_role;

-- Add comment
COMMENT ON TABLE sync_queue IS 'Queue for syncing entities between Portal and CRM. Auto-populated by triggers on profile and document insertions.';
COMMENT ON FUNCTION queue_profile_for_sync IS 'Automatically queue new profiles for CRM sync';
COMMENT ON FUNCTION queue_document_for_sync IS 'Automatically queue new documents for CRM sync';
COMMENT ON FUNCTION get_pending_syncs IS 'Fetch pending sync items for background processor';

-- Ensure system_logs table exists (created in migration 002)
CREATE TABLE IF NOT EXISTS public.system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'success', 'warning', 'error')),
  event TEXT NOT NULL,
  details TEXT,
  source TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON public.system_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_logs_event ON public.system_logs(event);

-- Migration complete
-- Triggers and sync_queue are now fully configured
