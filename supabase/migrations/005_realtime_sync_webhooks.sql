-- =====================================================================
-- TASK 4: Real-time Data Synchronization Strategy
-- PostgreSQL Triggers + Webhook Queue for instant Portal ↔ CRM sync
-- =====================================================================

-- 1. CREATE REALTIME WEBHOOK QUEUE TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.webhook_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event metadata
  event_type TEXT NOT NULL CHECK (event_type IN (
    'customer_profile.created',
    'customer_profile.updated',
    'travel_request.created',
    'travel_request.updated',
    'travel_request.status_changed',
    'visa_application.created',
    'visa_application.status_changed',
    'payment_record.created',
    'payment_record.updated',
    'customer_document.uploaded',
    'customer_document.status_changed',
    'booking_aggregate.updated'
  )),
  
  -- Entity reference
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Webhook payload
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'delivered', 'failed')),
  delivery_attempts INTEGER DEFAULT 0,
  max_delivery_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  
  -- Delivery tracking
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  next_delivery_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ
);

CREATE INDEX idx_webhook_queue_status ON public.webhook_queue(status) WHERE status != 'delivered';
CREATE INDEX idx_webhook_queue_next_delivery ON public.webhook_queue(next_delivery_at) WHERE status IN ('pending', 'failed');
CREATE INDEX idx_webhook_queue_event_type ON public.webhook_queue(event_type);
CREATE INDEX idx_webhook_queue_entity ON public.webhook_queue(entity_type, entity_id);

ALTER TABLE public.webhook_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_webhook_queue" ON public.webhook_queue FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.webhook_queue IS
  'Queue of webhook events waiting to be delivered to external systems';

-- 2. CREATE WEBHOOK SUBSCRIPTIONS TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.webhook_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Subscription metadata
  name TEXT NOT NULL,
  description TEXT,
  
  -- Target endpoint
  url TEXT NOT NULL,
  headers JSONB DEFAULT '{}', -- Custom headers including auth
  
  -- Event filtering
  event_types TEXT[] NOT NULL, -- ['customer_profile.created', 'travel_request.updated', etc.]
  
  -- Active/Inactive
  active BOOLEAN NOT NULL DEFAULT true,
  
  -- Statistics
  total_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,
  last_delivery_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  last_error TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_subscriptions_active ON public.webhook_subscriptions(active) WHERE active = true;

ALTER TABLE public.webhook_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_subscriptions" ON public.webhook_subscriptions FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.webhook_subscriptions IS
  'External webhook endpoints to notify on Portal entity changes';

-- 3. CREATE CHANGE LOG TABLE FOR AUDIT
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What changed
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Change details
  operation TEXT NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[], -- Array of column names that changed
  
  -- Who changed it
  changed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  change_source TEXT DEFAULT 'api', -- 'api', 'trigger', 'import', 'crm_sync'
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_change_log_entity ON public.change_log(entity_type, entity_id);
CREATE INDEX idx_change_log_created_at ON public.change_log(created_at DESC);
CREATE INDEX idx_change_log_operation ON public.change_log(operation);

ALTER TABLE public.change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_view_change_log" ON public.change_log FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('staff', 'admin')
  ));

COMMENT ON TABLE public.change_log IS
  'Audit log of all entity changes for Portal ↔ CRM sync tracking';

-- 4. HELPER FUNCTIONS FOR WEBHOOK QUEUE
-- =====================================================================

-- Queue webhook event
CREATE OR REPLACE FUNCTION queue_webhook_event(
  p_event_type TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_webhook_id UUID;
BEGIN
  INSERT INTO public.webhook_queue (event_type, entity_type, entity_id, payload, status)
  VALUES (p_event_type, p_entity_type, p_entity_id, p_payload, 'pending')
  RETURNING id INTO v_webhook_id;
  
  RETURN v_webhook_id;
END;
$$;

COMMENT ON FUNCTION queue_webhook_event IS
  'Queue webhook event for delivery to external systems';

-- Get pending webhooks
CREATE OR REPLACE FUNCTION get_pending_webhooks(p_limit INT DEFAULT 50)
RETURNS TABLE (
  webhook_id UUID,
  event_type TEXT,
  entity_type TEXT,
  entity_id UUID,
  payload JSONB,
  subscriptions JSONB
)
LANGUAGE sql
SECURITY INVOKER
STABLE
AS $$
  SELECT 
    wq.id,
    wq.event_type,
    wq.entity_type,
    wq.entity_id,
    wq.payload,
    jsonb_agg(jsonb_build_object(
      'id', ws.id,
      'url', ws.url,
      'headers', ws.headers
    )) as subscriptions
  FROM public.webhook_queue wq
  LEFT JOIN public.webhook_subscriptions ws ON ws.active AND wq.event_type = ANY(ws.event_types)
  WHERE wq.status IN ('pending', 'failed')
    AND (wq.next_delivery_at IS NULL OR wq.next_delivery_at <= NOW())
    AND wq.delivery_attempts < wq.max_delivery_attempts
  GROUP BY wq.id, wq.event_type, wq.entity_type, wq.entity_id, wq.payload
  ORDER BY wq.created_at ASC
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION get_pending_webhooks IS
  'Get next batch of webhook events ready for delivery';

-- Mark webhook as delivered
CREATE OR REPLACE FUNCTION mark_webhook_delivered(
  p_webhook_id UUID,
  p_success BOOLEAN,
  p_error TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.webhook_queue
  SET 
    status = CASE WHEN p_success THEN 'delivered' ELSE 'failed' END,
    delivery_attempts = delivery_attempts + 1,
    last_error = p_error,
    delivered_at = CASE WHEN p_success THEN NOW() ELSE delivered_at END,
    next_delivery_at = CASE 
      WHEN p_success THEN NULL
      WHEN delivery_attempts >= max_delivery_attempts THEN NULL
      ELSE NOW() + (INTERVAL '1 minute' * POWER(2, delivery_attempts)) -- exponential backoff
    END
  WHERE id = p_webhook_id;
END;
$$;

COMMENT ON FUNCTION mark_webhook_delivered IS
  'Mark webhook delivery attempt result (success or failure with backoff)';

-- 5. TRIGGER: Auto-queue webhook on customer profile update
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_customer_profile_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type TEXT;
  v_payload JSONB;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'customer_profile.created';
  ELSIF TG_OP = 'UPDATE' THEN
    v_event_type := 'customer_profile.updated';
  ELSIF TG_OP = 'DELETE' THEN
    v_event_type := 'customer_profile.updated';
  END IF;
  
  -- Build payload
  v_payload := jsonb_build_object(
    'id', NEW.id,
    'auth_user_id', NEW.auth_user_id,
    'email', NEW.email,
    'first_name', NEW.first_name,
    'last_name', NEW.last_name,
    'status', NEW.status,
    'kyc_status', NEW.kyc_status,
    'profile_completion_percent', NEW.profile_completion_percent
  );
  
  -- Queue webhook
  PERFORM queue_webhook_event(v_event_type, 'customer_profile', NEW.id, v_payload);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_profile_webhook ON public.customer_profiles;
CREATE TRIGGER trg_customer_profile_webhook
  AFTER INSERT OR UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_customer_profile_webhook();

-- 6. TRIGGER: Auto-queue webhook on travel request status change
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_travel_request_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type TEXT;
  v_payload JSONB;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'travel_request.created';
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    v_event_type := 'travel_request.status_changed';
  ELSIF TG_OP = 'UPDATE' THEN
    v_event_type := 'travel_request.updated';
  END IF;
  
  -- Build payload
  v_payload := jsonb_build_object(
    'id', NEW.id,
    'client_user_id', NEW.client_user_id,
    'destination_country', NEW.destination_country,
    'travel_type', NEW.travel_type,
    'status', NEW.status,
    'departure_date', NEW.departure_date,
    'return_date', NEW.return_date,
    'documents_completion_percent', NEW.documents_completion_percent,
    'previous_status', OLD.status
  );
  
  -- Queue webhook
  PERFORM queue_webhook_event(v_event_type, 'travel_request', NEW.id, v_payload);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_travel_request_webhook ON public.travel_requests;
CREATE TRIGGER trg_travel_request_webhook
  AFTER INSERT OR UPDATE ON public.travel_requests
  FOR EACH ROW
  EXECUTE FUNCTION trigger_travel_request_webhook();

-- 7. TRIGGER: Auto-queue webhook on payment status change
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_payment_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type TEXT;
  v_payload JSONB;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'payment_record.created';
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    v_event_type := 'payment_record.updated';
  ELSE
    v_event_type := 'payment_record.updated';
  END IF;
  
  -- Build payload
  v_payload := jsonb_build_object(
    'id', NEW.id,
    'client_user_id', NEW.client_user_id,
    'booking_reference', NEW.booking_reference,
    'amount', NEW.amount,
    'status', NEW.status,
    'payment_method', NEW.payment_method,
    'previous_status', OLD.status
  );
  
  -- Queue webhook
  PERFORM queue_webhook_event(v_event_type, 'payment_record', NEW.id, v_payload);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_webhook ON public.payment_records;
CREATE TRIGGER trg_payment_webhook
  AFTER INSERT OR UPDATE ON public.payment_records
  FOR EACH ROW
  EXECUTE FUNCTION trigger_payment_webhook();

-- 8. TRIGGER: Auto-queue webhook on document upload/status change
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_document_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event_type TEXT;
  v_payload JSONB;
BEGIN
  -- Determine event type
  IF TG_OP = 'INSERT' THEN
    v_event_type := 'customer_document.uploaded';
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    v_event_type := 'customer_document.status_changed';
  ELSE
    v_event_type := 'customer_document.uploaded';
  END IF;
  
  -- Build payload
  v_payload := jsonb_build_object(
    'id', NEW.id,
    'travel_request_id', NEW.travel_request_id,
    'client_user_id', NEW.client_user_id,
    'document_type', NEW.document_type,
    'file_name', NEW.file_name,
    'status', NEW.status,
    'previous_status', OLD.status
  );
  
  -- Queue webhook
  PERFORM queue_webhook_event(v_event_type, 'customer_document', NEW.id, v_payload);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_document_webhook ON public.customer_documents;
CREATE TRIGGER trg_document_webhook
  AFTER INSERT OR UPDATE ON public.customer_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_document_webhook();

-- 9. TRIGGER: Auto-queue webhook on booking aggregate update
-- =====================================================================

CREATE OR REPLACE FUNCTION trigger_booking_aggregate_webhook()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payload JSONB;
BEGIN
  -- Build payload
  v_payload := jsonb_build_object(
    'id', NEW.id,
    'travel_request_id', NEW.travel_request_id,
    'customer_id', NEW.customer_id,
    'status', NEW.status,
    'crm_sync_status', NEW.crm_sync_status,
    'total_amount', NEW.total_amount,
    'amount_paid', NEW.amount_paid,
    'amount_due', NEW.amount_due
  );
  
  -- Queue webhook
  PERFORM queue_webhook_event('booking_aggregate.updated', 'booking_aggregate', NEW.id, v_payload);
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_booking_aggregate_webhook ON public.booking_aggregates;
CREATE TRIGGER trg_booking_aggregate_webhook
  AFTER INSERT OR UPDATE ON public.booking_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION trigger_booking_aggregate_webhook();

-- 10. VIEW: Real-time sync metrics
-- =====================================================================

CREATE OR REPLACE VIEW realtime_sync_metrics AS
SELECT 
  'pending_webhooks' as metric_type,
  COUNT(*)::TEXT as value,
  NOW() as snapshot_time
FROM public.webhook_queue
WHERE status = 'pending'

UNION ALL

SELECT 
  'failed_webhooks',
  COUNT(*)::TEXT,
  NOW()
FROM public.webhook_queue
WHERE status = 'failed'

UNION ALL

SELECT 
  'pending_crm_syncs',
  COUNT(*)::TEXT,
  NOW()
FROM public.entity_sync_state
WHERE state IN ('queued', 'sync_failed')

UNION ALL

SELECT 
  'active_webhook_subscriptions',
  COUNT(*)::TEXT,
  NOW()
FROM public.webhook_subscriptions
WHERE active = true;

-- 11. AUDIT LOGGING
-- =====================================================================

INSERT INTO public.system_logs (level, event, details, source)
VALUES (
  'success',
  'realtime_sync_deployed',
  'Real-time webhook + PostgreSQL trigger synchronization infrastructure deployed',
  'migration'
);

SELECT 'Real-time Sync Strategy Deployed ✅' as status;
