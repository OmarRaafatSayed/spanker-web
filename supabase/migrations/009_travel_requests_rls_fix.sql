-- =====================================================================
-- Migration 009: Fix travel_requests RLS + booking aggregate trigger guard
-- =====================================================================
-- Problems addressed:
--   1. travel_requests has no service_role bypass → server-side inserts fail
--   2. trg_create_booking_aggregate fails when customer_profiles row is
--      missing for the user, rolling back the travel_requests INSERT entirely
--   3. Ensure RLS is enabled and all three per-user policies exist
-- =====================================================================

-- 1. Enable RLS (idempotent)
ALTER TABLE public.travel_requests ENABLE ROW LEVEL SECURITY;

-- 2. Service-role full-access bypass (needed by Next.js API route and FastAPI)
DROP POLICY IF EXISTS "service_role_all_travel_requests" ON public.travel_requests;
CREATE POLICY "service_role_all_travel_requests"
  ON public.travel_requests
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 3. Authenticated users — SELECT own rows (or rows assigned to them as staff)
DROP POLICY IF EXISTS "customers_read_own_requests" ON public.travel_requests;
CREATE POLICY "customers_read_own_requests"
  ON public.travel_requests
  FOR SELECT
  TO authenticated
  USING (
    client_user_id = auth.uid()
    OR assigned_staff_id = auth.uid()
  );

-- 4. Authenticated users — INSERT their own rows
DROP POLICY IF EXISTS "customers_create_own_requests" ON public.travel_requests;
CREATE POLICY "customers_create_own_requests"
  ON public.travel_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (client_user_id = auth.uid());

-- 5. Authenticated users — UPDATE their own rows (or rows assigned to them)
DROP POLICY IF EXISTS "customers_update_own_requests" ON public.travel_requests;
CREATE POLICY "customers_update_own_requests"
  ON public.travel_requests
  FOR UPDATE
  TO authenticated
  USING (
    client_user_id = auth.uid()
    OR assigned_staff_id = auth.uid()
  );

-- =====================================================================
-- 6. Harden trg_create_booking_aggregate
--    The trigger function (created in migration 004) can roll back the
--    travel_requests INSERT when customer_profiles has no row for the user.
--    Replace it with a version that wraps the lookup/create in an
--    EXCEPTION block so a missing profile never kills the booking row.
-- =====================================================================

CREATE OR REPLACE FUNCTION create_booking_aggregate_safe()
RETURNS TRIGGER AS $$
DECLARE
  v_customer_id UUID;
  v_email       TEXT;
BEGIN
  BEGIN
    -- Try to get the customer_profiles row for this auth user
    SELECT id, email
      INTO v_customer_id, v_email
      FROM public.customer_profiles
     WHERE auth_user_id = NEW.client_user_id
     LIMIT 1;

    -- If no profile row exists yet, skip aggregate creation silently
    -- (the aggregate can be back-filled by the sync process)
    IF v_customer_id IS NULL THEN
      RETURN NEW;
    END IF;

    INSERT INTO public.booking_aggregates (
      travel_request_id,
      customer_id,
      customer_email,
      status,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      v_customer_id,
      v_email,
      NEW.status,
      NEW.created_at,
      NEW.updated_at
    )
    ON CONFLICT DO NOTHING;

  EXCEPTION WHEN OTHERS THEN
    -- Log but never block the parent INSERT
    RAISE WARNING 'create_booking_aggregate_safe: skipped for travel_request %, reason: %',
      NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the old trigger with the safe version
DROP TRIGGER IF EXISTS trg_create_booking_aggregate ON public.travel_requests;
CREATE TRIGGER trg_create_booking_aggregate
  AFTER INSERT ON public.travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION create_booking_aggregate_safe();

-- =====================================================================
-- 7. Ensure get_document_requirements RPC exists and is accessible
--    (already created in migration 001, this is a safety re-create)
-- =====================================================================

CREATE OR REPLACE FUNCTION get_document_requirements(dest_country TEXT, trip_type TEXT)
RETURNS TABLE (
  required_docs  JSONB,
  optional_docs  JSONB,
  instructions   TEXT,
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
  WHERE destination_country = dest_country
    AND travel_type          = trip_type
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION get_document_requirements(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_document_requirements(TEXT, TEXT) TO service_role;

-- Migration complete
COMMENT ON POLICY "service_role_all_travel_requests" ON public.travel_requests
  IS 'Allows Next.js API routes and FastAPI (using service_role key) to bypass RLS';
