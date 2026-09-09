-- Migration 101: Extend travel_requests to support unified booking workflow
-- Adds booking-specific columns WITHOUT touching existing status column

-- Add booking columns
ALTER TABLE travel_requests
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'agent_quoted' CHECK (source IN ('self_service','agent_quoted')),
  ADD COLUMN IF NOT EXISTS vertical text CHECK (vertical IN ('flight','hotel','visa','trip')),
  ADD COLUMN IF NOT EXISTS booking_reference text UNIQUE,
  ADD COLUMN IF NOT EXISTS booking_status text CHECK (booking_status IN ('draft','quoted','pending_payment','confirmed','completed','cancelled')),
  ADD COLUMN IF NOT EXISTS expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS total_amount numeric(12,2) CHECK (total_amount >= 0),
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'EGP',
  ADD COLUMN IF NOT EXISTS contact jsonb,
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id);

COMMENT ON COLUMN travel_requests.source IS 'Booking origin: self_service (customer-initiated) or agent_quoted (staff-created)';
COMMENT ON COLUMN travel_requests.vertical IS 'Product vertical: flight, hotel, visa, or trip';
COMMENT ON COLUMN travel_requests.booking_reference IS 'Unique human-readable booking reference (e.g., SPK-FLT-2026-A3B5C7)';
COMMENT ON COLUMN travel_requests.booking_status IS 'Booking lifecycle status (separate from document status)';
COMMENT ON COLUMN travel_requests.expires_at IS 'Offer expiration timestamp (booking must be confirmed before this)';
COMMENT ON COLUMN travel_requests.confirmed_at IS 'Timestamp when booking was confirmed (payment received)';
COMMENT ON COLUMN travel_requests.cancelled_at IS 'Timestamp when booking was cancelled (NULL = not cancelled)';
COMMENT ON COLUMN travel_requests.total_amount IS 'Total booking price';
COMMENT ON COLUMN travel_requests.currency IS 'Price currency (default: EGP)';
COMMENT ON COLUMN travel_requests.contact IS 'Contact override for booking (JSON: {name, email, phone})';
COMMENT ON COLUMN travel_requests.organization_id IS 'Multi-tenancy: which organization owns this booking';
COMMENT ON COLUMN travel_requests.status IS 'Document workflow status (pending_documents → documents_review → docs_approved → in_progress → completed → cancelled)';

-- Add missing updated_at trigger
CREATE TRIGGER trg_travel_request_updated_at
  BEFORE UPDATE ON travel_requests
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Add index on booking_reference for fast lookup
CREATE INDEX idx_travel_requests_booking_ref ON travel_requests(booking_reference) WHERE booking_reference IS NOT NULL;

-- Add index on booking_status
CREATE INDEX idx_travel_requests_booking_status ON travel_requests(booking_status) WHERE booking_status IS NOT NULL;

-- Add index on expires_at for expiry cleanup job
CREATE INDEX idx_travel_requests_expires_at ON travel_requests(expires_at) WHERE expires_at IS NOT NULL AND booking_status IN ('draft','quoted','pending_payment');

-- Add index on organization_id for multi-tenancy
CREATE INDEX idx_travel_requests_organization ON travel_requests(organization_id) WHERE organization_id IS NOT NULL;
