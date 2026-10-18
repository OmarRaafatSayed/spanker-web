-- Workflow / automation settings configurable per-deployment
CREATE TABLE IF NOT EXISTS workflow_settings (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key          TEXT UNIQUE NOT NULL,
  value        TEXT NOT NULL,
  description  TEXT,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Default values
INSERT INTO workflow_settings (key, value, description) VALUES
  ('booking_expiry_hours',  '24',  'Hours before a pending booking is auto-expired'),
  ('escalation_hours',      '2',   'Hours before an unassigned booking triggers admin alert'),
  ('reminder_hours',        '4',   'Hours before a pending-payment reminder is sent to customer'),
  ('auto_expire_enabled',   'true','Enable automatic booking expiry cron'),
  ('escalation_enabled',    'true','Enable escalation alerts for unassigned bookings'),
  ('reminders_enabled',     'true','Enable customer payment reminders')
ON CONFLICT (key) DO NOTHING;

-- RLS: only staff/admin can read; only admin can update
ALTER TABLE workflow_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff read workflow_settings"
  ON workflow_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role IN ('admin','staff')
    )
  );

CREATE POLICY "admin update workflow_settings"
  ON workflow_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );
