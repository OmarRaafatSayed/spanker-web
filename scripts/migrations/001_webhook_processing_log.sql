-- =============================================================================
-- Migration: 001_webhook_processing_log
-- =============================================================================
-- Creates the webhook_processing_log table for request deduplication
-- Used by: POST /api/webhooks/crm (route.ts)
-- =============================================================================

-- Create webhook_processing_log table
CREATE TABLE IF NOT EXISTS webhook_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on request_id for fast deduplication lookups
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_request_id 
  ON webhook_processing_log(request_id);

-- Create index on processed_at for cleanup/retention policies
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_processed_at 
  ON webhook_processing_log(processed_at);

-- Create index on status for reporting
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_status 
  ON webhook_processing_log(status);

-- Enable Row Level Security (RLS)
ALTER TABLE webhook_processing_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (for idempotent migration)
DROP POLICY IF EXISTS "Allow service_role to read webhook_processing_log" ON webhook_processing_log;
DROP POLICY IF NOT EXISTS "Allow service_role to insert webhook_processing_log" ON webhook_processing_log;
DROP POLICY IF NOT EXISTS "Allow service_role to update webhook_processing_log" ON webhook_processing_log;

-- Create policies for service_role access
CREATE POLICY "Allow service_role to read webhook_processing_log" ON webhook_processing_log
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Allow service_role to insert webhook_processing_log" ON webhook_processing_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role to update webhook_processing_log" ON webhook_processing_log
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Add trigger for updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_webhook_processing_log ON webhook_processing_log;
CREATE TRIGGER trigger_update_webhook_processing_log
  BEFORE UPDATE ON webhook_processing_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Notes:
-- =============================================================================
-- 1. The webhook_processing_log table stores processed request IDs for deduplication
-- 2. Row Level Security (RLS) is enabled to prevent unauthorized access
-- 3. service_role can access the table for webhook processing (server-to-server)
-- 4. Index on request_id ensures fast lookups during deduplication checks
-- 5. The processed_at index enables cleanup of old records (e.g., after 30 days)
-- 6. Use this migration if you only want the webhook_processing_log table
--    (if other tables already exist). Otherwise, use 000_complete_schema.sql
-- =============================================================================