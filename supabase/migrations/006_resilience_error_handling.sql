-- =====================================================================
-- TASK 8: Background Job & Webhook Reliability (Resilience)
-- Error handling, transactional rollbacks, and dead letter queues
-- =====================================================================

-- 1. CREATE DEAD LETTER QUEUE TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Failed entity reference
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'customer_profile', 'travel_request', 'visa_application', 
    'payment_record', 'document', 'webhook', 'crm_sync'
  )),
  entity_id UUID NOT NULL,
  
  -- Operation that failed
  operation_type TEXT NOT NULL,
  
  -- Error details
  error_message TEXT NOT NULL,
  error_severity TEXT NOT NULL CHECK (error_severity IN ('transient', 'permanent', 'unknown')),
  
  -- Full payload for recovery
  payload JSONB NOT NULL DEFAULT '{}',
  
  -- DLQ status
  status TEXT NOT NULL DEFAULT 'pending_manual_review' CHECK (status IN (
    'pending_manual_review',
    'in_progress',
    'recovered',
    'discarded'
  )),
  
  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  retry_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  discarded_at TIMESTAMPTZ,
  
  -- Notes from staff
  staff_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dlq_entity ON public.dead_letter_queue(entity_type, entity_id);
CREATE INDEX idx_dlq_status ON public.dead_letter_queue(status) WHERE status != 'recovered';
CREATE INDEX idx_dlq_created_at ON public.dead_letter_queue(created_at DESC);
CREATE INDEX idx_dlq_error_severity ON public.dead_letter_queue(error_severity);

ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_dlq" ON public.dead_letter_queue FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "staff_view_dlq" ON public.dead_letter_queue FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND role IN ('staff', 'admin')
  ));

COMMENT ON TABLE public.dead_letter_queue IS
  'Failed operations awaiting manual review. Prevents silent data loss.';

-- 2. CREATE ERROR LOG TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.error_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Error classification
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  
  -- Context (user, operation, etc.)
  context JSONB DEFAULT '{}',
  
  -- Severity
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN (
    'debug', 'info', 'warning', 'error', 'critical'
  )),
  
  -- Stack trace for debugging
  stack_trace TEXT,
  
  -- Related records
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  operation_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_error_log_created_at ON public.error_log(created_at DESC);
CREATE INDEX idx_error_log_error_type ON public.error_log(error_type);
CREATE INDEX idx_error_log_severity ON public.error_log(severity);
CREATE INDEX idx_error_log_user_id ON public.error_log(user_id);

ALTER TABLE public.error_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_error_log" ON public.error_log FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.error_log IS
  'Comprehensive error tracking for observability and debugging';

-- 3. CREATE OPERATION AUDIT TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.operation_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Operation identification
  operation_id TEXT NOT NULL UNIQUE,
  operation_type TEXT NOT NULL,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'in_progress', 'completed', 'failed', 'rolled_back'
  )),
  
  -- Execution details
  steps_total INTEGER DEFAULT 0,
  steps_completed INTEGER DEFAULT 0,
  steps_failed INTEGER DEFAULT 0,
  
  -- Error tracking
  error_message TEXT,
  error_severity TEXT CHECK (error_severity IN ('transient', 'permanent', 'unknown')),
  
  -- Rollback info
  rolled_back_steps INTEGER DEFAULT 0,
  rollback_successful BOOLEAN,
  
  -- Full audit trail
  execution_log JSONB DEFAULT '{}',
  
  -- Performance
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_seconds NUMERIC(10,2) GENERATED ALWAYS AS (
    EXTRACT(EPOCH FROM (completed_at - started_at))
  ) STORED,
  
  -- Retry info
  retry_count INTEGER DEFAULT 0,
  retry_at TIMESTAMPTZ
);

CREATE INDEX idx_operation_audit_operation_id ON public.operation_audit(operation_id);
CREATE INDEX idx_operation_audit_status ON public.operation_audit(status);
CREATE INDEX idx_operation_audit_started_at ON public.operation_audit(started_at DESC);
CREATE INDEX idx_operation_audit_error ON public.operation_audit(error_severity) 
  WHERE error_message IS NOT NULL;

ALTER TABLE public.operation_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_operation_audit" ON public.operation_audit FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.operation_audit IS
  'Complete audit trail of transactional operations for recovery and debugging';

-- 4. CREATE CIRCUIT BREAKER STATE TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.circuit_breaker_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Service identification
  service_name TEXT NOT NULL UNIQUE,
  
  -- Circuit state
  state TEXT NOT NULL DEFAULT 'closed' CHECK (state IN ('closed', 'open', 'half_open')),
  
  -- Failure tracking
  failure_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_threshold INTEGER DEFAULT 5,
  
  -- Recovery
  last_failure_at TIMESTAMPTZ,
  recovery_timeout_seconds INTEGER DEFAULT 60,
  will_retry_at TIMESTAMPTZ,
  
  -- Statistics
  total_failures INTEGER DEFAULT 0,
  total_successes INTEGER DEFAULT 0,
  consecutive_failures INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_circuit_breaker_service ON public.circuit_breaker_state(service_name);
CREATE INDEX idx_circuit_breaker_state ON public.circuit_breaker_state(state);

ALTER TABLE public.circuit_breaker_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_circuit_breaker" ON public.circuit_breaker_state FOR ALL
  TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.circuit_breaker_state IS
  'Circuit breaker state for external service calls (prevent cascading failures)';

-- 5. HELPER FUNCTION: Add to Dead Letter Queue
-- =====================================================================

CREATE OR REPLACE FUNCTION add_to_dlq(
  p_entity_type TEXT,
  p_entity_id UUID,
  p_operation_type TEXT,
  p_error_message TEXT,
  p_error_severity TEXT,
  p_payload JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_dlq_id UUID;
BEGIN
  INSERT INTO public.dead_letter_queue (
    entity_type, entity_id, operation_type, error_message, 
    error_severity, payload, status
  ) VALUES (
    p_entity_type, p_entity_id, p_operation_type, p_error_message,
    p_error_severity, p_payload, 'pending_manual_review'
  )
  RETURNING id INTO v_dlq_id;
  
  -- Also log the error
  INSERT INTO public.error_log (error_type, error_message, context, severity)
  VALUES (
    'dlq_item_added',
    p_error_message,
    jsonb_build_object(
      'entity_type', p_entity_type,
      'entity_id', p_entity_id,
      'operation_type', p_operation_type,
      'dlq_id', v_dlq_id
    ),
    'error'
  );
  
  RETURN v_dlq_id;
END;
$$;

-- 6. HELPER FUNCTION: Log Error
-- =====================================================================

CREATE OR REPLACE FUNCTION log_error(
  p_error_type TEXT,
  p_error_message TEXT,
  p_context JSONB DEFAULT NULL,
  p_severity TEXT DEFAULT 'warning',
  p_stack_trace TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL,
  p_operation_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_error_id UUID;
BEGIN
  INSERT INTO public.error_log (
    error_type, error_message, context, severity, stack_trace, user_id, operation_id
  ) VALUES (
    p_error_type, p_error_message, p_context, p_severity, p_stack_trace, p_user_id, p_operation_id
  )
  RETURNING id INTO v_error_id;
  
  RETURN v_error_id;
END;
$$;

-- 7. HELPER FUNCTION: Audit Operation
-- =====================================================================

CREATE OR REPLACE FUNCTION audit_operation(
  p_operation_id TEXT,
  p_operation_type TEXT,
  p_status TEXT,
  p_steps_total INT DEFAULT 0,
  p_steps_completed INT DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_error_severity TEXT DEFAULT NULL,
  p_execution_log JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO public.operation_audit (
    operation_id, operation_type, status, steps_total, steps_completed,
    error_message, error_severity, execution_log, completed_at
  ) VALUES (
    p_operation_id, p_operation_type, p_status, p_steps_total, p_steps_completed,
    p_error_message, p_error_severity, p_execution_log,
    CASE WHEN p_status IN ('completed', 'failed', 'rolled_back') THEN NOW() ELSE NULL END
  )
  ON CONFLICT (operation_id) DO UPDATE SET
    status = p_status,
    steps_completed = p_steps_completed,
    error_message = p_error_message,
    completed_at = CASE WHEN p_status IN ('completed', 'failed', 'rolled_back') THEN NOW() ELSE operation_audit.completed_at END
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$;

-- 8. VIEW: DLQ Summary for Staff Dashboard
-- =====================================================================

CREATE OR REPLACE VIEW dlq_summary AS
SELECT 
  COUNT(*) as total_items,
  COUNT(CASE WHEN status = 'pending_manual_review' THEN 1 END) as pending_review,
  COUNT(CASE WHEN status = 'in_progress' THEN 1 END) as in_progress,
  COUNT(CASE WHEN error_severity = 'permanent' THEN 1 END) as permanent_errors,
  COUNT(CASE WHEN error_severity = 'transient' THEN 1 END) as transient_errors,
  MAX(created_at) as most_recent_error
FROM public.dead_letter_queue
WHERE status IN ('pending_manual_review', 'in_progress');

-- 9. VIEW: Recent Errors
-- =====================================================================

CREATE OR REPLACE VIEW recent_errors AS
SELECT 
  el.id,
  el.error_type,
  el.error_message,
  el.severity,
  el.user_id,
  el.operation_id,
  el.created_at,
  COUNT(*) OVER (PARTITION BY el.error_type ORDER BY el.created_at DESC) as error_frequency
FROM public.error_log el
WHERE el.created_at > NOW() - INTERVAL '24 hours'
ORDER BY el.created_at DESC
LIMIT 100;

-- 10. VIEW: Operation Failures
-- =====================================================================

CREATE OR REPLACE VIEW operation_failures AS
SELECT 
  operation_id,
  operation_type,
  status,
  error_message,
  error_severity,
  duration_seconds,
  retry_count,
  started_at,
  completed_at
FROM public.operation_audit
WHERE status IN ('failed', 'rolled_back')
  AND started_at > NOW() - INTERVAL '7 days'
ORDER BY started_at DESC;

-- 11. AUDIT LOGGING
-- =====================================================================

INSERT INTO public.system_logs (level, event, details, source)
VALUES (
  'success',
  'resilience_infrastructure_deployed',
  'Error handling, dead letter queue, circuit breaker, and operation audit infrastructure deployed',
  'migration'
);

SELECT 'Resilience Infrastructure Deployed ✅' as status;
