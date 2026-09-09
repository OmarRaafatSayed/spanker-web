-- Migration 105: Create visa_status_mapping table (UNVERIFIED mapping)
-- Maps visa_applications.status (integer 1-7) to booking_status text values

CREATE TABLE visa_status_mapping (
  visa_status_code integer PRIMARY KEY CHECK (visa_status_code BETWEEN 1 AND 7),
  booking_status_equivalent text CHECK (booking_status_equivalent IN ('draft','quoted','pending_payment','confirmed','completed','cancelled')),
  label text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE visa_status_mapping IS 'UNVERIFIED MAPPING - Maps visa_applications.status (integer 1-7) to booking_status. Requires validation against actual visa workflow.';

-- Seed with BEST GUESS (requires user verification)
INSERT INTO visa_status_mapping (visa_status_code, booking_status_equivalent, label) VALUES
  (1, 'draft', 'Submitted'),
  (2, 'pending_payment', 'Documents Under Review'),
  (3, 'pending_payment', 'Approved - Awaiting Payment'),
  (4, 'confirmed', 'Processing'),
  (5, 'confirmed', 'At Embassy'),
  (6, 'completed', 'Visa Issued'),
  (7, 'cancelled', 'Rejected');

-- Enable RLS
ALTER TABLE visa_status_mapping ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "visa_mapping_authenticated_read" ON visa_status_mapping
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "visa_mapping_service_all" ON visa_status_mapping 
  TO service_role USING (true) WITH CHECK (true);
