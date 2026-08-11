-- =====================================================================
-- Enhanced Customer Portal Migration - "Preliminary Booking First" Workflow
-- Run this in Supabase Dashboard → SQL Editor
-- =====================================================================

-- 1. Add client_user_id to visa_applications
--    (nullable — null means manual entry by staff with no linked account)
ALTER TABLE public.visa_applications
ADD COLUMN IF NOT EXISTS client_user_id UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_visa_client_user
  ON public.visa_applications(client_user_id);

COMMENT ON COLUMN public.visa_applications.client_user_id IS
  'The portal customer who owns this application. NULL = manual staff entry.';

-- 2. Add client_user_id to payment_records
ALTER TABLE public.payment_records
ADD COLUMN IF NOT EXISTS client_user_id UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_payment_client_user
  ON public.payment_records(client_user_id);

COMMENT ON COLUMN public.payment_records.client_user_id IS
  'The portal customer who owns this payment record. NULL = manual staff entry.';

-- 3. Ensure profiles.role column exists with correct values
--    (existing CRM staff keep their current role; new portal users get "customer")
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

-- Update existing staff rows if role was previously stored differently
-- Adjust the condition below to match your current data if needed:
-- UPDATE public.profiles SET role = 'staff' WHERE role = 'user';

-- 4. NEW: Create travel_requests table for preliminary bookings
CREATE TABLE IF NOT EXISTS public.travel_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Basic trip info (minimal required for initial booking)
  destination_country TEXT NOT NULL,
  travel_type TEXT NOT NULL CHECK (travel_type IN ('visa_only', 'visa_flight', 'visa_hotel', 'full_package')),
  departure_date DATE,
  return_date DATE,
  traveler_count INTEGER DEFAULT 1,
  
  -- Request status tracking
  status TEXT NOT NULL DEFAULT 'pending_documents' CHECK (status IN (
    'pending_documents',     -- Just submitted, waiting for docs
    'documents_review',      -- Staff reviewing submitted docs
    'docs_approved',         -- Docs OK, processing can start
    'in_progress',          -- Visa/booking in progress
    'completed',            -- All done
    'cancelled'             -- Cancelled by customer or staff
  )),
  
  -- Document checklist status (JSON for flexibility)
  document_checklist JSONB DEFAULT '{}',
  documents_completion_percent INTEGER DEFAULT 0,
  
  -- Communication & follow-up
  customer_notes TEXT,
  staff_notes TEXT,
  next_action_required TEXT, -- "Upload passport copy", "Provide bank statement"
  next_follow_up_date DATE,
  
  -- Integration with existing CRM
  linked_visa_application_id UUID REFERENCES public.visa_applications(id) ON DELETE SET NULL,
  linked_payment_id UUID REFERENCES public.payment_records(id) ON DELETE SET NULL,
  
  -- CRM assignment
  assigned_staff_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_travel_requests_client ON public.travel_requests(client_user_id);
CREATE INDEX idx_travel_requests_status ON public.travel_requests(status);
CREATE INDEX idx_travel_requests_assigned_staff ON public.travel_requests(assigned_staff_id);

COMMENT ON TABLE public.travel_requests IS 
'Preliminary travel booking requests - customers can submit immediately without complete docs';

-- 5. NEW: Document requirements configuration table
CREATE TABLE IF NOT EXISTS public.document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_country TEXT NOT NULL,
  travel_type TEXT NOT NULL,
  required_documents JSONB NOT NULL, -- Array of document types
  optional_documents JSONB DEFAULT '[]',
  special_instructions TEXT,
  processing_time_days INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_doc_requirements_unique 
  ON public.document_requirements(destination_country, travel_type);

-- 6. NEW: Customer document uploads tracking
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  document_type TEXT NOT NULL, -- 'passport', 'photo', 'bank_statement', etc.
  file_path TEXT, -- Supabase storage path
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN (
    'uploaded',     -- Customer uploaded
    'under_review', -- Staff is checking
    'approved',     -- Staff approved
    'rejected',     -- Staff rejected (needs re-upload)
    'expired'       -- Document expired
  )),
  
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_customer_docs_request ON public.customer_documents(travel_request_id);
CREATE INDEX idx_customer_docs_client ON public.customer_documents(client_user_id);
CREATE INDEX idx_customer_docs_status ON public.customer_documents(status);

-- 7. NEW: Communication log for customer follow-up
CREATE TABLE IF NOT EXISTS public.customer_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id UUID NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  client_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  staff_user_id UUID REFERENCES auth.users(id),
  
  communication_type TEXT NOT NULL CHECK (communication_type IN (
    'email', 'whatsapp', 'sms', 'phone_call', 'system_notification'
  )),
  
  subject TEXT,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT now(),
  
  -- External message IDs for tracking
  whatsapp_message_id TEXT,
  email_message_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_communications_request ON public.customer_communications(travel_request_id);
CREATE INDEX idx_communications_client ON public.customer_communications(client_user_id);

-- 8. RLS Policies for new tables

-- travel_requests: customers see their own, staff see assigned ones
DROP POLICY IF EXISTS "customers_read_own_requests" ON public.travel_requests;
CREATE POLICY "customers_read_own_requests"
  ON public.travel_requests
  FOR SELECT
  TO authenticated
  USING (client_user_id = auth.uid() OR assigned_staff_id = auth.uid());

DROP POLICY IF EXISTS "customers_create_own_requests" ON public.travel_requests;
CREATE POLICY "customers_create_own_requests"
  ON public.travel_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (client_user_id = auth.uid());

DROP POLICY IF EXISTS "customers_update_own_requests" ON public.travel_requests;
CREATE POLICY "customers_update_own_requests"
  ON public.travel_requests
  FOR UPDATE
  TO authenticated
  USING (client_user_id = auth.uid() OR assigned_staff_id = auth.uid());

-- customer_documents: customers manage their own, staff can view assigned requests
DROP POLICY IF EXISTS "customers_manage_own_documents" ON public.customer_documents;
CREATE POLICY "customers_manage_own_documents"
  ON public.customer_documents
  FOR ALL
  TO authenticated
  USING (
    client_user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM travel_requests tr 
      WHERE tr.id = travel_request_id AND tr.assigned_staff_id = auth.uid()
    )
  );

-- customer_communications: customers see their own, staff see assigned requests
DROP POLICY IF EXISTS "customers_read_own_communications" ON public.customer_communications;
CREATE POLICY "customers_read_own_communications"
  ON public.customer_communications
  FOR SELECT
  TO authenticated
  USING (
    client_user_id = auth.uid() OR 
    staff_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM travel_requests tr 
      WHERE tr.id = travel_request_id AND tr.assigned_staff_id = auth.uid()
    )
  );

-- 9. Original RLS policies for visa_applications and payment_records
DROP POLICY IF EXISTS "customers_read_own_visa" ON public.visa_applications;
CREATE POLICY "customers_read_own_visa"
  ON public.visa_applications
  FOR SELECT
  TO authenticated
  USING (client_user_id = auth.uid());

DROP POLICY IF EXISTS "customers_read_own_payments" ON public.payment_records;
CREATE POLICY "customers_read_own_payments"
  ON public.payment_records
  FOR SELECT
  TO authenticated
  USING (client_user_id = auth.uid());

-- 10. Helper functions for the new workflow

-- Get customer's travel requests
CREATE OR REPLACE FUNCTION get_my_travel_requests()
RETURNS SETOF public.travel_requests
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT * FROM public.travel_requests
  WHERE client_user_id = auth.uid()
  ORDER BY created_at DESC;
$$;

-- Get document requirements for a destination/type
CREATE OR REPLACE FUNCTION get_document_requirements(dest_country TEXT, trip_type TEXT)
RETURNS TABLE (
  required_docs JSONB,
  optional_docs JSONB,
  instructions TEXT,
  processing_days INTEGER
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    required_documents,
    optional_documents,
    special_instructions,
    processing_time_days
  FROM public.document_requirements
  WHERE destination_country = dest_country AND travel_type = trip_type
  LIMIT 1;
$$;

-- Update document completion percentage
CREATE OR REPLACE FUNCTION update_document_completion(request_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  total_required INTEGER;
  uploaded_approved INTEGER;
  completion_percent INTEGER;
BEGIN
  -- Get required document count from checklist
  SELECT jsonb_array_length(document_checklist->'required')
  INTO total_required
  FROM travel_requests
  WHERE id = request_id;
  
  -- Count uploaded + approved documents
  SELECT COUNT(*)::INTEGER
  INTO uploaded_approved
  FROM customer_documents cd
  WHERE cd.travel_request_id = request_id
    AND cd.status IN ('approved', 'uploaded');
  
  -- Calculate percentage
  completion_percent := CASE 
    WHEN total_required = 0 THEN 100
    ELSE (uploaded_approved * 100 / total_required)
  END;
  
  -- Update the travel request
  UPDATE travel_requests
  SET 
    documents_completion_percent = completion_percent,
    updated_at = now()
  WHERE id = request_id;
  
  RETURN completion_percent;
END;
$$;

-- 11. Original helper functions
CREATE OR REPLACE FUNCTION get_my_visa_applications()
RETURNS SETOF public.visa_applications
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT * FROM public.visa_applications
  WHERE client_user_id = auth.uid()
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION get_my_payments()
RETURNS SETOF public.payment_records
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT * FROM public.payment_records
  WHERE client_user_id = auth.uid()
  ORDER BY created_at DESC;
$$;

-- =====================================================================
-- DONE ✅
-- Next steps:
--   1. In the CRM UI, add a "Link to customer" dropdown when creating
--      visa applications / payment records → saves client_user_id
--   2. Deploy the FastAPI endpoints /visa/my-applications and
--      /payments/my-payments that filter by client_user_id
--   3. Until step 2 is done, the Next.js adapter falls back to the
--      existing staff endpoints automatically
-- =====================================================================

-- 12. Insert sample document requirements for common destinations
INSERT INTO public.document_requirements (destination_country, travel_type, required_documents, optional_documents, special_instructions, processing_time_days)
VALUES 
  -- Egypt tourist visa
  ('egypt', 'visa_only', 
   '["passport", "photo", "bank_statement", "hotel_booking"]',
   '["travel_insurance", "flight_booking"]',
   'Passport must be valid for at least 6 months. Bank statement should show 3 months activity.',
   7),
   
  -- UAE tourist visa
  ('uae', 'visa_only',
   '["passport", "photo", "bank_statement", "salary_certificate"]',
   '["travel_insurance", "hotel_booking"]',
   'UAE visa requires salary certificate or bank statement showing regular income.',
   5),
   
  -- Turkey visa + flight package
  ('turkey', 'visa_flight',
   '["passport", "photo", "hotel_booking", "travel_insurance"]',
   '["bank_statement"]',
   'Turkey allows e-visa for most nationalities. Hotel booking required.',
   3),
   
  -- Full package to Hungary
  ('hungary', 'full_package',
   '["passport", "photo", "bank_statement", "travel_insurance", "hotel_booking", "flight_booking"]',
   '["employment_letter", "previous_visa_copies"]',
   'Schengen visa required. All documents must be translated to English or Hungarian.',
   14)

ON CONFLICT (destination_country, travel_type) DO UPDATE SET
  required_documents = EXCLUDED.required_documents,
  optional_documents = EXCLUDED.optional_documents,
  special_instructions = EXCLUDED.special_instructions,
  processing_time_days = EXCLUDED.processing_time_days,
  updated_at = now();

-- =====================================================================
-- WORKFLOW IMPLEMENTATION COMPLETE ✅
-- 
-- Key Features Added:
-- 1. 🎯 Preliminary Booking First:
--    - travel_requests table allows immediate booking with minimal info
--    - Status starts at 'pending_documents' (no blocking errors)
--    - Customer can submit without complete documentation
--
-- 2. 📋 Dynamic Stepper & Checklist:
--    - document_requirements table stores per-destination requirements
--    - document_checklist in travel_requests tracks completion
--    - Real-time completion percentage calculation
--    - next_action_required field guides customer next steps
--
-- 3. 🔗 Seamless CRM Integration:
--    - travel_requests linked to existing visa_applications & payment_records
--    - assigned_staff_id for immediate lead assignment
--    - customer_communications table for WhatsApp/Email tracking
--    - customer_documents table for real-time doc status
--
-- Next Steps for Frontend:
-- 1. Create travel request form (destination + travel type only)
-- 2. Build dynamic document checklist component
-- 3. Implement step-by-step guidance interface
-- 4. Add WhatsApp/Email communication tracking
-- 5. Create staff dashboard for lead management
-- =====================================================================