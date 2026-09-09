-- Migration 102: Create inventory tables (flights, trips)

-- Flights inventory
CREATE TABLE flights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  carrier text NOT NULL,
  flight_number text NOT NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  departure_date date NOT NULL,
  departure_time time NOT NULL,
  arrival_date date NOT NULL,
  arrival_time time NOT NULL,
  cabin_class text CHECK (cabin_class IN ('economy','premium_economy','business','first')),
  available_seats integer NOT NULL DEFAULT 0 CHECK (available_seats >= 0),
  seats_total integer NOT NULL DEFAULT 0 CHECK (seats_total >= 0),
  price_per_seat numeric(12,2) CHECK (price_per_seat >= 0),
  currency text DEFAULT 'EGP',
  is_active boolean DEFAULT true NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(carrier, flight_number, departure_date, cabin_class)
);

COMMENT ON TABLE flights IS 'Flight inventory for self-service booking';
COMMENT ON COLUMN flights.available_seats IS 'Current available seats (decremented on booking, restored on cancellation)';
COMMENT ON COLUMN flights.seats_total IS 'Total capacity (used to validate restorations)';
COMMENT ON COLUMN flights.is_public IS 'Visible to customers (false = staff-only)';
COMMENT ON COLUMN flights.organization_id IS 'Multi-tenancy: which org manages this flight';

-- Trips/tours inventory
CREATE TABLE trips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  destination text NOT NULL,
  duration_days integer NOT NULL CHECK (duration_days > 0),
  start_date date NOT NULL,
  end_date date NOT NULL,
  max_travelers integer CHECK (max_travelers > 0),
  available_spots integer NOT NULL DEFAULT 0 CHECK (available_spots >= 0),
  price_per_person numeric(12,2) CHECK (price_per_person >= 0),
  currency text DEFAULT 'EGP',
  description text,
  itinerary jsonb,
  inclusions jsonb,
  exclusions jsonb,
  is_active boolean DEFAULT true NOT NULL,
  is_public boolean DEFAULT true NOT NULL,
  organization_id uuid REFERENCES organizations(id),
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (end_date >= start_date),
  CHECK (available_spots <= max_travelers)
);

COMMENT ON TABLE trips IS 'Trip/tour packages inventory';
COMMENT ON COLUMN trips.available_spots IS 'Current available spots (decremented on booking, restored on cancellation)';
COMMENT ON COLUMN trips.max_travelers IS 'Maximum group size';
COMMENT ON COLUMN trips.is_public IS 'Visible to customers (false = staff-only)';
COMMENT ON COLUMN trips.organization_id IS 'Multi-tenancy: which org manages this trip';

-- Add updated_at triggers
CREATE TRIGGER trg_flights_updated_at
  BEFORE UPDATE ON flights
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE trips ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "flights_public_read" ON flights
  FOR SELECT TO authenticated
  USING (is_active = true AND is_public = true);

CREATE POLICY "flights_service_all" ON flights 
  TO service_role 
  USING (true) WITH CHECK (true);

CREATE POLICY "trips_public_read" ON trips
  FOR SELECT TO authenticated
  USING (is_active = true AND is_public = true);

CREATE POLICY "trips_service_all" ON trips 
  TO service_role 
  USING (true) WITH CHECK (true);

-- Indexes
CREATE INDEX idx_flights_route_date ON flights(origin, destination, departure_date) WHERE is_active = true;
CREATE INDEX idx_flights_carrier ON flights(carrier, flight_number);
CREATE INDEX idx_flights_org ON flights(organization_id) WHERE organization_id IS NOT NULL;

CREATE INDEX idx_trips_destination ON trips(destination) WHERE is_active = true;
CREATE INDEX idx_trips_dates ON trips(start_date, end_date) WHERE is_active = true;
CREATE INDEX idx_trips_org ON trips(organization_id) WHERE organization_id IS NOT NULL;
