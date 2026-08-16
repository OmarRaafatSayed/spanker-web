-- =====================================================================
-- Phase 2: Leads/Travel Requests admin support
-- Extends state_machine_events + admin RLS for travel_requests
-- =====================================================================

-- 1. Allow 'TRAVEL_REQUEST' as entity_type in state_machine_events
-- (original CHECK only allows USER, VISA_APPLICATION, QUOTATION, BOOKING, FINANCIAL_TRANSACTION)
ALTER TABLE public.state_machine_events
  DROP CONSTRAINT IF EXISTS state_machine_events_entity_type_check;

ALTER TABLE public.state_machine_events
  ADD CONSTRAINT state_machine_events_entity_type_check
  CHECK (entity_type IN (
    'USER', 'VISA_APPLICATION', 'QUOTATION', 'BOOKING',
    'FINANCIAL_TRANSACTION', 'TRAVEL_REQUEST'
  ));

-- 2. Admin/staff full-access policy for travel_requests
DROP POLICY IF EXISTS "admin_manage_travel_requests" ON public.travel_requests;
CREATE POLICY "admin_manage_travel_requests"
  ON public.travel_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 3. Admin/staff full-access policy for customer_documents
DROP POLICY IF EXISTS "admin_manage_customer_documents" ON public.customer_documents;
CREATE POLICY "admin_manage_customer_documents"
  ON public.customer_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 4. Admin/staff full-access policy for customer_communications
DROP POLICY IF EXISTS "admin_manage_customer_communications" ON public.customer_communications;
CREATE POLICY "admin_manage_customer_communications"
  ON public.customer_communications
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 5. Admin/staff can read state_machine_events
DROP POLICY IF EXISTS "admin_read_state_events" ON public.state_machine_events;
CREATE POLICY "admin_read_state_events"
  ON public.state_machine_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- Admin can insert state events (for status transitions)
DROP POLICY IF EXISTS "admin_insert_state_events" ON public.state_machine_events;
CREATE POLICY "admin_insert_state_events"
  ON public.state_machine_events
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid() AND role IN ('admin', 'staff')
    )
  );

-- 6. Audit log
INSERT INTO public.system_logs (level, event, details, source)
VALUES (
  'success',
  'phase2_migration_deployed',
  'Phase 2: state_machine_events extended, admin RLS policies added for leads/travel_requests',
  'system'
);

-- =====================================================================
-- PHASE 2 MIGRATION COMPLETE ✅
-- =====================================================================
