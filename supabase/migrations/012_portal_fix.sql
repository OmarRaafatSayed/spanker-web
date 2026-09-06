-- =====================================================================
-- Migration 012 FIX: Patch existing portal tables to match portal code
-- =====================================================================
-- Tables already exist but are missing columns / have wrong names.
-- This migration is purely ADDITIVE — no drops, no data loss.
-- SAFE TO RE-RUN.
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- 1. portal_notifications — add missing travel_request_id column
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.portal_notifications
  ADD COLUMN IF NOT EXISTS travel_request_id UUID
    REFERENCES public.travel_requests(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pnotif_customer_id
  ON public.portal_notifications (customer_id);

CREATE INDEX IF NOT EXISTS idx_pnotif_unread
  ON public.portal_notifications (customer_id, is_read)
  WHERE is_read = FALSE;

CREATE INDEX IF NOT EXISTS idx_pnotif_travel_request
  ON public.portal_notifications (travel_request_id);

CREATE INDEX IF NOT EXISTS idx_pnotif_created_at
  ON public.portal_notifications (created_at DESC);

-- RLS (drop+recreate so it's idempotent)
ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pnotif_service_all"     ON public.portal_notifications;
CREATE POLICY "pnotif_service_all"
  ON public.portal_notifications FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "pnotif_customer_select" ON public.portal_notifications;
CREATE POLICY "pnotif_customer_select"
  ON public.portal_notifications FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "pnotif_customer_update" ON public.portal_notifications;
CREATE POLICY "pnotif_customer_update"
  ON public.portal_notifications FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "pnotif_staff_select"    ON public.portal_notifications;
CREATE POLICY "pnotif_staff_select"
  ON public.portal_notifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'staff')
    )
  );


-- ─────────────────────────────────────────────────────────────────────
-- 2. portal_status_log — add travel_request_id as alias for request_id
--    (keep request_id for CRM compatibility, add travel_request_id
--     so the portal code can use the standard name)
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.portal_status_log
  ADD COLUMN IF NOT EXISTS travel_request_id UUID
    REFERENCES public.travel_requests(id) ON DELETE CASCADE;

-- Add changed_by_label if missing
ALTER TABLE public.portal_status_log
  ADD COLUMN IF NOT EXISTS changed_by_label TEXT;

-- Backfill travel_request_id from request_id for existing rows
UPDATE public.portal_status_log
SET travel_request_id = request_id
WHERE travel_request_id IS NULL
  AND request_id IS NOT NULL;

-- Keep them in sync going forward via trigger
CREATE OR REPLACE FUNCTION public.sync_portal_status_log_request_id()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- If travel_request_id provided but not request_id → sync
  IF NEW.travel_request_id IS NOT NULL AND NEW.request_id IS NULL THEN
    NEW.request_id = NEW.travel_request_id;
  END IF;
  -- If request_id provided but not travel_request_id → sync
  IF NEW.request_id IS NOT NULL AND NEW.travel_request_id IS NULL THEN
    NEW.travel_request_id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_portal_status_log ON public.portal_status_log;
CREATE TRIGGER trg_sync_portal_status_log
  BEFORE INSERT OR UPDATE ON public.portal_status_log
  FOR EACH ROW EXECUTE FUNCTION public.sync_portal_status_log_request_id();

CREATE INDEX IF NOT EXISTS idx_plog_travel_request
  ON public.portal_status_log (travel_request_id);

CREATE INDEX IF NOT EXISTS idx_plog_customer_id
  ON public.portal_status_log (customer_id);

CREATE INDEX IF NOT EXISTS idx_plog_created_at
  ON public.portal_status_log (created_at ASC);

-- RLS
ALTER TABLE public.portal_status_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plog_service_all"     ON public.portal_status_log;
CREATE POLICY "plog_service_all"
  ON public.portal_status_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "plog_customer_select" ON public.portal_status_log;
CREATE POLICY "plog_customer_select"
  ON public.portal_status_log FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

DROP POLICY IF EXISTS "plog_staff_select"    ON public.portal_status_log;
CREATE POLICY "plog_staff_select"
  ON public.portal_status_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin', 'staff')
    )
  );


-- ─────────────────────────────────────────────────────────────────────
-- 3. webhook_processing_log (create if missing)
-- ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhook_processing_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   TEXT        NOT NULL UNIQUE,
  status       TEXT        NOT NULL CHECK (status IN ('success', 'failed')),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.webhook_processing_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wpl_service_all" ON public.webhook_processing_log;
CREATE POLICY "wpl_service_all"
  ON public.webhook_processing_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- ─────────────────────────────────────────────────────────────────────
-- 4. Supabase Realtime — add tables to publication
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'portal_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'portal_status_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_status_log;
  END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────
-- 5. Helper view — portal summary per request
-- ─────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.travel_request_portal_summary AS
SELECT
  tr.id                 AS request_id,
  tr.client_user_id     AS customer_id,
  tr.destination_country,
  tr.travel_type,
  tr.status,
  tr.departure_date,
  tr.traveler_count,
  tr.staff_notes,
  tr.next_action_required,
  tr.created_at,
  tr.updated_at,

  (SELECT COUNT(*)
     FROM public.portal_notifications pn
    WHERE pn.travel_request_id = tr.id
      AND pn.customer_id       = tr.client_user_id
      AND pn.is_read           = FALSE)   AS unread_notifications,

  (SELECT psl.note
     FROM public.portal_status_log psl
    WHERE psl.travel_request_id = tr.id
    ORDER BY psl.created_at DESC
    LIMIT 1)                              AS latest_note

FROM public.travel_requests tr;


-- =====================================================================
-- DONE ✅
-- portal_notifications  → added travel_request_id column + RLS + indexes
-- portal_status_log     → added travel_request_id alias + sync trigger + RLS
-- webhook_processing_log → created if missing
-- Realtime              → both tables added to publication
-- =====================================================================
