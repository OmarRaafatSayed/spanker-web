-- Migration 104: Create booking_policies table and seed with config

CREATE TABLE booking_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vertical text NOT NULL UNIQUE CHECK (vertical IN ('flight','hotel','visa','trip')),
  cancellation_window_hours integer CHECK (cancellation_window_hours >= 0),
  cancellation_fee_percent numeric(5,2) CHECK (cancellation_fee_percent >= 0 AND cancellation_fee_percent <= 100),
  modification_window_hours integer CHECK (modification_window_hours >= 0),
  modification_fee_amount numeric(12,2) CHECK (modification_fee_amount >= 0),
  payment_due_hours integer CHECK (payment_due_hours >= 0),
  terms_and_conditions text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE booking_policies IS 'Cancellation and payment policies per vertical';
COMMENT ON COLUMN booking_policies.cancellation_window_hours IS 'Hours before departure when free cancellation allowed';
COMMENT ON COLUMN booking_policies.cancellation_fee_percent IS 'Cancellation penalty as percentage of total';
COMMENT ON COLUMN booking_policies.payment_due_hours IS 'Hours after quote creation when payment is due (used to set expires_at)';

-- Add updated_at trigger
CREATE TRIGGER trg_booking_policies_updated_at
  BEFORE UPDATE ON booking_policies
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE booking_policies ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "policies_authenticated_read" ON booking_policies
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "policies_service_all" ON booking_policies 
  TO service_role USING (true) WITH CHECK (true);

-- Seed policies (approved config data)
INSERT INTO booking_policies (vertical, cancellation_window_hours, cancellation_fee_percent, payment_due_hours, terms_and_conditions) VALUES
  (
    'flight',
    48,
    25.0,
    24,
    'Free cancellation 48+ hours before departure. 25% penalty 24-48h before. Non-refundable <24h.'
  ),
  (
    'hotel',
    72,
    0.0,
    48,
    'Free cancellation 72+ hours before check-in. One night penalty 24-72h before. Non-refundable <24h.'
  ),
  (
    'visa',
    NULL,
    15.0,
    24,
    'Refundable minus 15% admin fee until application submitted to authorities. Non-refundable after submission.'
  ),
  (
    'trip',
    336,
    30.0,
    72,
    'Free cancellation 14+ days before departure. 30% penalty 7-14 days before. Non-refundable <7 days.'
  );

COMMENT ON TABLE booking_policies IS 'Cancellation and payment policies per vertical (seeded with default policies)';
