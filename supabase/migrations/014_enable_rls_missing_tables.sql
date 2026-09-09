-- =============================================================================
-- Migration 014: Enable RLS on tables that were missing it
-- Tables: customer_communications, customer_documents, document_requirements
-- =============================================================================

-- customer_communications
ALTER TABLE public.customer_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own communications"
  ON public.customer_communications
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM public.travel_requests
      WHERE id = customer_communications.travel_request_id
    )
  );

CREATE POLICY "Staff can manage all communications"
  ON public.customer_communications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

-- customer_documents
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view their own documents"
  ON public.customer_documents
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM public.travel_requests
      WHERE id = customer_documents.travel_request_id
    )
  );

CREATE POLICY "Customers can insert their own documents"
  ON public.customer_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() = (
      SELECT user_id FROM public.travel_requests
      WHERE id = customer_documents.travel_request_id
    )
  );

CREATE POLICY "Staff can manage all documents"
  ON public.customer_documents
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );

-- document_requirements (read-only for all authenticated users)
ALTER TABLE public.document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document requirements"
  ON public.document_requirements
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Staff can manage document requirements"
  ON public.document_requirements
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.customer_profiles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'staff')
    )
  );
