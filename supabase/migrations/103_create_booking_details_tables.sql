-- Migration 103: Create booking detail tables (1:1 with travel_requests, keyed by vertical)

-- Flight booking details
CREATE TABLE flight_booking_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id uuid NOT NULL UNIQUE REFERENCES travel_requests(id) ON DELETE CASCADE,
  flight_id uuid REFERENCES flights(id) ON DELETE SET NULL,
  origin text NOT NULL,
  destination text NOT NULL,
  departure_date date NOT NULL,
  return_date date,
  adults integer DEFAULT 1 CHECK (adults >= 0),
  children integer DEFAULT 0 CHECK (children >= 0),
  infants integer DEFAULT 0 CHECK (infants >= 0),
  cabin_class text CHECK (cabin_class IN ('economy','premium_economy','business','first')),
  outbound_flight jsonb,
  return_flight jsonb,
  total_price numeric(12,2) CHECK (total_price >= 0),
  currency text DEFAULT 'EGP',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE flight_booking_details IS 'Flight-specific booking data (1:1 with travel_requests where vertical=flight)';
COMMENT ON COLUMN flight_booking_details.flight_id IS 'Reference to inventory flights table';
COMMENT ON COLUMN flight_booking_details.outbound_flight IS 'Outbound flight details JSON';
COMMENT ON COLUMN flight_booking_details.return_flight IS 'Return flight details JSON (NULL for one-way)';

-- Hotel booking details
CREATE TABLE hotel_booking_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id uuid NOT NULL UNIQUE REFERENCES travel_requests(id) ON DELETE CASCADE,
  hotel_offer_id uuid REFERENCES hotel_offers(id) ON DELETE SET NULL,
  hotel_name text NOT NULL,
  hotel_location text,
  city text NOT NULL,
  country text NOT NULL,
  check_in date NOT NULL,
  check_out date NOT NULL,
  room_type text,
  board_basis text,
  num_rooms integer DEFAULT 1 CHECK (num_rooms > 0),
  adults integer DEFAULT 1 CHECK (adults > 0),
  children integer DEFAULT 0 CHECK (children >= 0),
  total_price numeric(12,2) CHECK (total_price >= 0),
  currency text DEFAULT 'EGP',
  special_requests text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (check_out > check_in)
);

COMMENT ON TABLE hotel_booking_details IS 'Hotel-specific booking data (1:1 with travel_requests where vertical=hotel)';
COMMENT ON COLUMN hotel_booking_details.hotel_offer_id IS 'Reference to hotel_offers inventory table';

-- Visa booking details
CREATE TABLE visa_booking_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id uuid NOT NULL UNIQUE REFERENCES travel_requests(id) ON DELETE CASCADE,
  visa_application_id uuid REFERENCES visa_applications(id) ON DELETE SET NULL,
  destination_country text NOT NULL,
  visa_type text,
  processing_type text CHECK (processing_type IN ('standard','express','priority')),
  service_fee numeric(12,2) CHECK (service_fee >= 0),
  government_fee numeric(12,2) CHECK (government_fee >= 0),
  total_price numeric(12,2) CHECK (total_price >= 0),
  currency text DEFAULT 'EGP',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

COMMENT ON TABLE visa_booking_details IS 'Visa-specific booking data (1:1 with travel_requests where vertical=visa)';
COMMENT ON COLUMN visa_booking_details.visa_application_id IS 'Link to existing visa_applications table';

-- Trip booking details
CREATE TABLE trip_booking_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  travel_request_id uuid NOT NULL UNIQUE REFERENCES travel_requests(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE SET NULL,
  trip_name text NOT NULL,
  destination text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  num_travelers integer DEFAULT 1 CHECK (num_travelers > 0),
  itinerary jsonb,
  inclusions jsonb,
  exclusions jsonb,
  total_price numeric(12,2) CHECK (total_price >= 0),
  currency text DEFAULT 'EGP',
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (end_date >= start_date)
);

COMMENT ON TABLE trip_booking_details IS 'Trip/tour-specific booking data (1:1 with travel_requests where vertical=trip)';
COMMENT ON COLUMN trip_booking_details.trip_id IS 'Reference to trips inventory table';

-- Add updated_at triggers
CREATE TRIGGER trg_flight_details_updated_at
  BEFORE UPDATE ON flight_booking_details
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_hotel_details_updated_at
  BEFORE UPDATE ON hotel_booking_details
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_visa_details_updated_at
  BEFORE UPDATE ON visa_booking_details
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_trip_details_updated_at
  BEFORE UPDATE ON trip_booking_details
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Enable RLS
ALTER TABLE flight_booking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE hotel_booking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_booking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_booking_details ENABLE ROW LEVEL SECURITY;

-- RLS policies: customers read own, staff read assigned
CREATE POLICY "customers_read_own_flight_details" ON flight_booking_details
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM travel_requests tr 
    WHERE tr.id = travel_request_id 
      AND (tr.client_user_id = auth.uid() OR tr.assigned_staff_id = auth.uid())
  ));

CREATE POLICY "customers_read_own_hotel_details" ON hotel_booking_details
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM travel_requests tr 
    WHERE tr.id = travel_request_id 
      AND (tr.client_user_id = auth.uid() OR tr.assigned_staff_id = auth.uid())
  ));

CREATE POLICY "customers_read_own_visa_details" ON visa_booking_details
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM travel_requests tr 
    WHERE tr.id = travel_request_id 
      AND (tr.client_user_id = auth.uid() OR tr.assigned_staff_id = auth.uid())
  ));

CREATE POLICY "customers_read_own_trip_details" ON trip_booking_details
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM travel_requests tr 
    WHERE tr.id = travel_request_id 
      AND (tr.client_user_id = auth.uid() OR tr.assigned_staff_id = auth.uid())
  ));

-- Service role full access
CREATE POLICY "flight_details_service_all" ON flight_booking_details 
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "hotel_details_service_all" ON hotel_booking_details 
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "visa_details_service_all" ON visa_booking_details 
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "trip_details_service_all" ON trip_booking_details 
  TO service_role USING (true) WITH CHECK (true);

-- Indexes on FKs
CREATE INDEX idx_flight_details_request ON flight_booking_details(travel_request_id);
CREATE INDEX idx_flight_details_flight ON flight_booking_details(flight_id) WHERE flight_id IS NOT NULL;

CREATE INDEX idx_hotel_details_request ON hotel_booking_details(travel_request_id);
CREATE INDEX idx_hotel_details_offer ON hotel_booking_details(hotel_offer_id) WHERE hotel_offer_id IS NOT NULL;

CREATE INDEX idx_visa_details_request ON visa_booking_details(travel_request_id);
CREATE INDEX idx_visa_details_application ON visa_booking_details(visa_application_id) WHERE visa_application_id IS NOT NULL;

CREATE INDEX idx_trip_details_request ON trip_booking_details(travel_request_id);
CREATE INDEX idx_trip_details_trip ON trip_booking_details(trip_id) WHERE trip_id IS NOT NULL;
