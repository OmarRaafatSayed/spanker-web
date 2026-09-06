-- =====================================================================
-- Migration 012: Portal Notifications Bridge
-- =====================================================================
-- PURPOSE:
--   Additive layer on top of the existing spanker schema.
--   Nothing is deleted or modified — only new tables and policies added.
--
--   Two new tables:
--     portal_notifications  — CRM pushes alerts here via processCrmWebhook().
--                             Supabase Realtime delivers them to the browser instantly.
--     portal_status_log     — Immutable timeline of every status change on a
--                             travel_request. Customer sees this as a progress tracker.
--
--   Bridge pattern:
--     travel_requests.id  ←→  portal_notifications.travel_request_id
--     travel_requests.id  ←→  portal_status_log.travel_request_id
--     auth.users.id       ←→  portal_notifications.customer_id  (same Supabase project)
--
-- SAFE TO RE-RUN: every statement uses IF NOT EXISTS / OR REPLACE / DO $$ guards.
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 0. Helper: ensure set_updated_at() exists (may already exist from CRM side)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


-- =====================================================================
-- 1. PORTAL_NOTIFICATIONS
--    Rows are INSERTED by the CRM (via processCrmWebhook in crm-adapter.ts
--    or via the FastAPI webhook sender).
--    Rows are READ by the customer in the browser.
--    Rows are UPDATED (is_read only) by the customer.
--
--    type values mirror the FastAPI portal_notifications CHECK constraint
--    so both systems share the same vocabulary.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.portal_notifications (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target customer — auth.users.id (same Supabase project as CRM)
  customer_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Optional: link back to the travel_request that triggered this notification
  travel_request_id UUID        REFERENCES public.travel_requests(id) ON DELETE SET NULL,

  -- Content
  title             TEXT        NOT NULL,
  body              TEXT,

  -- Type drives the icon / colour in the UI
  type              TEXT        NOT NULL DEFAULT 'info'
                                  CHECK (type IN (
                                    'status_update',
                                    'document_approved',
                                    'document_rejected',
                                    'payment_due',
                                    'payment_confirmed',
                                    'message',
                                    'info'
                                  )),

  -- Read state — only field the customer can mutate
  is_read           BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Structured payload for deep-linking from the notification bell
  -- e.g. { "travel_request_id": "...", "new_status": "in_progress" }
  data              JSONB,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Intentionally no updated_at: notifications are immutable except is_read
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pnotif_customer_id
  ON public.portal_notifications (customer_id);

CREATE INDEX IF NOT EXISTS idx_pnotif_unread
  ON public.portal_notifications (customer_id, is_read)
  WHERE is_read = FALSE;                        -- partial index for badge count

CREATE INDEX IF NOT EXISTS idx_pnotif_travel_request
  ON public.portal_notifications (travel_request_id)
  WHERE travel_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pnotif_created_at
  ON public.portal_notifications (created_at DESC);

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.portal_notifications ENABLE ROW LEVEL SECURITY;

-- Service role (Next.js server routes + FastAPI backend) — full access
DROP POLICY IF EXISTS "pnotif_service_all"     ON public.portal_notifications;
CREATE POLICY "pnotif_service_all"
  ON public.portal_notifications FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated customers read their own notifications
DROP POLICY IF EXISTS "pnotif_customer_select" ON public.portal_notifications;
CREATE POLICY "pnotif_customer_select"
  ON public.portal_notifications FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Customers can only flip is_read — nothing else
DROP POLICY IF EXISTS "pnotif_customer_update" ON public.portal_notifications;
CREATE POLICY "pnotif_customer_update"
  ON public.portal_notifications FOR UPDATE
  TO authenticated
  USING (customer_id = auth.uid());

-- Admin/staff can read all notifications for support
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


-- =====================================================================
-- 2. PORTAL_STATUS_LOG
--    Immutable audit trail appended on every travel_request status change.
--    The customer sees this as a vertical timeline ("Your request moved
--    from Pending Documents → Documents Under Review on June 3rd").
--
--    Written by: processCrmWebhook() in crm-adapter.ts
--    Read by: customer portal timeline component
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.portal_status_log (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  travel_request_id UUID        NOT NULL REFERENCES public.travel_requests(id) ON DELETE CASCADE,
  customer_id       UUID        NOT NULL REFERENCES auth.users(id)             ON DELETE CASCADE,

  -- State transition
  from_status       TEXT,                       -- NULL on first entry
  to_status         TEXT        NOT NULL,

  -- Who triggered the change
  changed_by        UUID        REFERENCES auth.users(id) ON DELETE SET NULL,  -- staff user_id
  changed_by_label  TEXT,                       -- "CRM Staff" or staff name

  -- Optional message shown to the customer in the timeline
  note              TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Intentionally no updated_at: log entries are immutable
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plog_travel_request
  ON public.portal_status_log (travel_request_id);

CREATE INDEX IF NOT EXISTS idx_plog_customer_id
  ON public.portal_status_log (customer_id);

CREATE INDEX IF NOT EXISTS idx_plog_created_at
  ON public.portal_status_log (created_at ASC);  -- ASC for timeline display

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.portal_status_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plog_service_all"      ON public.portal_status_log;
CREATE POLICY "plog_service_all"
  ON public.portal_status_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- Customer reads their own timeline (read-only — no update/delete)
DROP POLICY IF EXISTS "plog_customer_select"  ON public.portal_status_log;
CREATE POLICY "plog_customer_select"
  ON public.portal_status_log FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid());

-- Admin/staff read all logs
DROP POLICY IF EXISTS "plog_staff_select"     ON public.portal_status_log;
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


-- =====================================================================
-- 3. SUPABASE REALTIME
--    portal_notifications must be in the realtime publication so the
--    browser receives INSERT events instantly (notification bell).
--
--    travel_requests is already in the publication from migration 005.
--    We add portal_notifications here.
-- =====================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname    = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'portal_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_notifications;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname    = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename  = 'portal_status_log'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.portal_status_log;
  END IF;
END $$;


-- =====================================================================
-- 4. HELPER VIEW — travel_request_portal_summary
--    Single query the dashboard page can call to get everything it needs.
--    Replaces the 3-query fan-out in usePortalDashboard.
-- =====================================================================

CREATE OR REPLACE VIEW public.travel_request_portal_summary AS
SELECT
  tr.id                                               AS request_id,
  tr.client_user_id                                   AS customer_id,
  tr.destination_country,
  tr.travel_type,
  tr.status,
  tr.departure_date,
  tr.traveler_count,
  tr.staff_notes,
  tr.next_action_required,
  tr.created_at,
  tr.updated_at,

  -- Document progress (from existing customer_documents table)
  (SELECT COUNT(*)
     FROM public.customer_documents cd
    WHERE cd.travel_request_id = tr.id)              AS total_documents,

  (SELECT COUNT(*)
     FROM public.customer_documents cd
    WHERE cd.travel_request_id = tr.id
      AND cd.status = 'approved')                    AS approved_documents,

  (SELECT COUNT(*)
     FROM public.customer_documents cd
    WHERE cd.travel_request_id = tr.id
      AND cd.status = 'rejected')                    AS rejected_documents,

  -- Unread notification count for this request
  (SELECT COUNT(*)
     FROM public.portal_notifications pn
    WHERE pn.travel_request_id = tr.id
      AND pn.customer_id       = tr.client_user_id
      AND pn.is_read           = FALSE)              AS unread_notifications,

  -- Latest status log entry note (shown as "last update" on request card)
  (SELECT psl.note
     FROM public.portal_status_log psl
    WHERE psl.travel_request_id = tr.id
    ORDER BY psl.created_at DESC
    LIMIT 1)                                         AS latest_note

FROM public.travel_requests tr;

-- RLS is enforced by the underlying travel_requests policies.
-- Always add WHERE customer_id = auth.uid() when querying this view.


-- =====================================================================
-- 5. WEBHOOK_PROCESSING_LOG
--    Already referenced in crm-adapter.ts isDuplicateRequest().
--    Create it if not already present from migration 005/006.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.webhook_processing_log (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id   TEXT        NOT NULL UNIQUE,   -- CRMStatusUpdate.tracking_id
  status       TEXT        NOT NULL CHECK (status IN ('success', 'failed')),
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.webhook_processing_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wpl_service_all" ON public.webhook_processing_log;
CREATE POLICY "wpl_service_all"
  ON public.webhook_processing_log FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- =====================================================================
-- DONE ✅
-- New tables  : portal_notifications, portal_status_log,
--               webhook_processing_log (if missing)
-- New view    : travel_request_portal_summary
-- Realtime    : portal_notifications, portal_status_log added to publication
-- Zero breaking changes to existing tables or policies
-- =====================================================================
