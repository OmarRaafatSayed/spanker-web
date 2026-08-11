-- =============================================================================
-- Migration: 000_complete_schema
-- =============================================================================
-- Complete database schema for the spanker travel platform
-- Based on: src/types/database.ts
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profiles Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'staff', 'customer')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF NOT EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF NOT EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF NOT EXISTS "Staff can view customer profiles" ON profiles;

-- Create policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Staff can view customer profiles" ON profiles
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- -----------------------------------------------------------------------------
-- 2. Travel Requests Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS travel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  destination_country TEXT NOT NULL,
  travel_type TEXT NOT NULL CHECK (travel_type IN ('visa_only', 'visa_flight', 'visa_hotel', 'full_package')),
  departure_date TIMESTAMPTZ,
  return_date TIMESTAMPTZ,
  traveler_count INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending_documents', 'documents_review', 'docs_approved', 'in_progress', 'completed', 'cancelled')),
  document_checklist JSONB NOT NULL DEFAULT '{}',
  documents_completion_percent INTEGER NOT NULL DEFAULT 0,
  customer_notes TEXT,
  staff_notes TEXT,
  next_action_required TEXT,
  next_follow_up_date TIMESTAMPTZ,
  linked_visa_application_id UUID,
  linked_payment_id UUID,
  assigned_staff_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_travel_requests_client_user_id ON travel_requests(client_user_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_status ON travel_requests(status);
CREATE INDEX IF NOT EXISTS idx_travel_requests_assigned_staff_id ON travel_requests(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_destination_country ON travel_requests(destination_country);
CREATE INDEX IF NOT EXISTS idx_travel_requests_travel_type ON travel_requests(travel_type);

-- Enable RLS
ALTER TABLE travel_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own travel requests" ON travel_requests;
DROP POLICY IF NOT EXISTS "Users can insert own travel requests" ON travel_requests;
DROP POLICY IF NOT EXISTS "Staff can view all travel requests" ON travel_requests;
DROP POLICY IF NOT EXISTS "Staff can update travel requests" ON travel_requests;

-- Create policies
CREATE POLICY "Users can view own travel requests" ON travel_requests
  FOR SELECT USING (auth.uid() = client_user_id);

CREATE POLICY "Users can insert own travel requests" ON travel_requests
  FOR INSERT WITH CHECK (auth.uid() = client_user_id);

CREATE POLICY "Staff can view all travel requests" ON travel_requests
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "Staff can update travel requests" ON travel_requests
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- -----------------------------------------------------------------------------
-- 3. Document Requirements Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_country TEXT NOT NULL,
  travel_type TEXT NOT NULL CHECK (travel_type IN ('visa_only', 'visa_flight', 'visa_hotel', 'full_package')),
  required_documents JSONB NOT NULL,
  optional_documents JSONB DEFAULT '{}',
  special_instructions TEXT,
  processing_time_days INTEGER NOT NULL DEFAULT 14,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_requirements_destination_country ON document_requirements(destination_country);
CREATE INDEX IF NOT EXISTS idx_document_requirements_travel_type ON document_requirements(travel_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_document_requirements_unique ON document_requirements(destination_country, travel_type);

-- Enable RLS (read-only for all authenticated users)
ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view document requirements" ON document_requirements;

CREATE POLICY "Authenticated users can view document requirements" ON document_requirements
  FOR SELECT USING (auth.role() IN ('authenticated', 'service_role'));

-- -----------------------------------------------------------------------------
-- 4. Customer Documents Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id UUID NOT NULL REFERENCES travel_requests(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  mime_type TEXT,
  status TEXT NOT NULL CHECK (status IN ('uploaded', 'under_review', 'approved', 'rejected', 'expired')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_documents_travel_request_id ON customer_documents(travel_request_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_client_user_id ON customer_documents(client_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_documents_status ON customer_documents(status);
CREATE INDEX IF NOT EXISTS idx_customer_documents_document_type ON customer_documents(document_type);

-- Enable RLS
ALTER TABLE customer_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own documents" ON customer_documents;
DROP POLICY IF NOT EXISTS "Users can insert own documents" ON customer_documents;
DROP POLICY IF NOT EXISTS "Staff can view all documents" ON customer_documents;
DROP POLICY IF NOT EXISTS "Staff can update documents" ON customer_documents;

-- Create policies
CREATE POLICY "Users can view own documents" ON customer_documents
  FOR SELECT USING (auth.uid() = client_user_id);

CREATE POLICY "Users can insert own documents" ON customer_documents
  FOR INSERT WITH CHECK (auth.uid() = client_user_id);

CREATE POLICY "Staff can view all documents" ON customer_documents
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

CREATE POLICY "Staff can update documents" ON customer_documents
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- -----------------------------------------------------------------------------
-- 5. Customer Communications Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS customer_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id UUID NOT NULL REFERENCES travel_requests(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_user_id UUID REFERENCES auth.users(id),
  communication_type TEXT NOT NULL CHECK (communication_type IN ('email', 'whatsapp', 'sms', 'phone_call', 'system_notification')),
  subject TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  whatsapp_message_id TEXT,
  email_message_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_communications_travel_request_id ON customer_communications(travel_request_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_client_user_id ON customer_communications(client_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_staff_user_id ON customer_communications(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_customer_communications_sent_at ON customer_communications(sent_at);

-- Enable RLS
ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own communications" ON customer_communications;
DROP POLICY IF NOT EXISTS "Staff can view all communications" ON customer_communications;

-- Create policies
CREATE POLICY "Users can view own communications" ON customer_communications
  FOR SELECT USING (auth.uid() = client_user_id);

CREATE POLICY "Staff can view all communications" ON customer_communications
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
  ));

-- -----------------------------------------------------------------------------
-- 6. Webhook Processing Log Table
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS webhook_processing_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_request_id ON webhook_processing_log(request_id);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_processed_at ON webhook_processing_log(processed_at);
CREATE INDEX IF NOT EXISTS idx_webhook_processing_log_status ON webhook_processing_log(status);

-- Enable RLS
ALTER TABLE webhook_processing_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow service_role to read webhook_processing_log" ON webhook_processing_log;
DROP POLICY IF NOT EXISTS "Allow service_role to insert webhook_processing_log" ON webhook_processing_log;
DROP POLICY IF NOT EXISTS "Allow service_role to update webhook_processing_log" ON webhook_processing_log;

-- Create policies
CREATE POLICY "Allow service_role to read webhook_processing_log" ON webhook_processing_log
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Allow service_role to insert webhook_processing_log" ON webhook_processing_log
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Allow service_role to update webhook_processing_log" ON webhook_processing_log
  FOR UPDATE USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- 7. System Logs Table (if used)
-- -----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS system_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('info', 'success', 'warning', 'error')),
  event TEXT NOT NULL,
  details TEXT,
  source TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_logs_level ON system_logs(level);
CREATE INDEX IF NOT EXISTS idx_system_logs_event ON system_logs(event);
CREATE INDEX IF NOT EXISTS idx_system_logs_source ON system_logs(source);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Enable RLS
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can read system logs" ON system_logs;
DROP POLICY IF NOT EXISTS "Service role can insert system logs" ON system_logs;

CREATE POLICY "Service role can read system logs" ON system_logs
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert system logs" ON system_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- Triggers for updated_at auto-update
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_update_profiles ON profiles;
DROP TRIGGER IF NOT EXISTS trigger_update_travel_requests ON travel_requests;
DROP TRIGGER IF NOT EXISTS trigger_update_document_requirements ON document_requirements;
DROP TRIGGER IF NOT EXISTS trigger_update_customer_documents ON customer_documents;
DROP TRIGGER IF NOT EXISTS trigger_update_webhook_processing_log ON webhook_processing_log;

-- Create triggers
CREATE TRIGGER trigger_update_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_travel_requests
  BEFORE UPDATE ON travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_document_requirements
  BEFORE UPDATE ON document_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_customer_documents
  BEFORE UPDATE ON customer_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_webhook_processing_log
  BEFORE UPDATE ON webhook_processing_log
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Functions
-- =============================================================================

-- Update document completion percentage
CREATE OR REPLACE FUNCTION update_document_completion(request_id UUID)
RETURNS INTEGER AS $$
DECLARE
  total_docs INTEGER;
  completed_docs INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_docs
  FROM customer_documents
  WHERE travel_request_id = request_id;

  SELECT COUNT(*) INTO completed_docs
  FROM customer_documents
  WHERE travel_request_id = request_id
  AND status IN ('approved', 'rejected', 'expired');

  IF total_docs = 0 THEN
    RETURN 0;
  END IF;

  UPDATE travel_requests
  SET documents_completion_percent = (completed_docs * 100 / total_docs)
  WHERE id = request_id;

  RETURN completed_docs;
END;
$$ LANGUAGE plpgsql;

-- Get document requirements by destination and travel type
CREATE OR REPLACE FUNCTION get_document_requirements(
  dest_country TEXT,
  trip_type TEXT
)
RETURNS TABLE (
  required_docs JSONB,
  optional_docs JSONB,
  instructions TEXT,
  processing_days INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    dr.required_documents AS required_docs,
    dr.optional_documents AS optional_docs,
    dr.special_instructions AS instructions,
    dr.processing_time_days AS processing_days
  FROM document_requirements dr
  WHERE dr.destination_country = get_document_requirements.dest_country
    AND dr.travel_type = get_document_requirements.trip_type;
END;
$$ LANGUAGE plpgsql;

-- Get travel requests for the current user
CREATE OR REPLACE FUNCTION get_my_travel_requests()
RETURNS TABLE (
  id UUID,
  client_user_id UUID,
  destination_country TEXT,
  travel_type TEXT,
  departure_date TIMESTAMPTZ,
  return_date TIMESTAMPTZ,
  traveler_count INTEGER,
  status TEXT,
  document_checklist JSONB,
  documents_completion_percent INTEGER,
  customer_notes TEXT,
  staff_notes TEXT,
  next_action_required TEXT,
  next_follow_up_date TIMESTAMPTZ,
  linked_visa_application_id UUID,
  linked_payment_id UUID,
  assigned_staff_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tr.id,
    tr.client_user_id,
    tr.destination_country,
    tr.travel_type,
    tr.departure_date,
    tr.return_date,
    tr.traveler_count,
    tr.status,
    tr.document_checklist,
    tr.documents_completion_percent,
    tr.customer_notes,
    tr.staff_notes,
    tr.next_action_required,
    tr.next_follow_up_date,
    tr.linked_visa_application_id,
    tr.linked_payment_id,
    tr.assigned_staff_id,
    tr.created_at,
    tr.updated_at,
    tr.completed_at
  FROM travel_requests tr
  WHERE tr.client_user_id = auth.uid();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Summary
-- =============================================================================
-- Tables created:
--   1. profiles - User profiles
--   2. travel_requests - Main travel application records
--   3. document_requirements - Configuration for required documents
--   4. customer_documents - Uploaded documents
--   5. customer_communications - Communication log
--   6. webhook_processing_log - Request deduplication for webhooks
--   7. system_logs - System event logging
--
-- All tables have:
--   - Row Level Security (RLS) enabled
--   - Appropriate indexes for performance
--   - Triggers for updated_at auto-update
--   - Policies for service_role and authenticated users
-- =============================================================================