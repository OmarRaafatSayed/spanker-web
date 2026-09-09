-- =====================================================================
-- Migration 029: Performance Indexes & Optimizations
-- =====================================================================
-- Additional composite indexes for common query patterns
-- Covering indexes for frequently accessed columns
-- Partial indexes for filtered queries
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. BOOKINGS PERFORMANCE INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Customer's booking list with status filter (most common query)
CREATE INDEX IF NOT EXISTS idx_bookings_customer_status_created
  ON public.bookings(customer_id, status, created_at DESC);

-- Staff dashboard: pending bookings by vertical
CREATE INDEX IF NOT EXISTS idx_bookings_status_vertical_created
  ON public.bookings(status, vertical, created_at DESC)
  WHERE status = 'pending';

-- Expiry job: pending bookings with expiry time
CREATE INDEX IF NOT EXISTS idx_bookings_expiry_lookup
  ON public.bookings(expires_at, status)
  WHERE status = 'pending' AND expires_at IS NOT NULL;

COMMENT ON INDEX idx_bookings_customer_status_created IS 
  'Optimizes "My Bookings" page with status filter';

COMMENT ON INDEX idx_bookings_status_vertical_created IS 
  'Optimizes staff dashboard filtered by vertical';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. FLIGHTS PERFORMANCE INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Flight search: route + date + class (most common search pattern)
CREATE INDEX IF NOT EXISTS idx_flights_search_route_date_class
  ON public.flights(origin_iata, destination_iata, departure_at, class)
  WHERE is_public = true AND enabled = true AND seats_available > 0;

-- Future flights only (exclude past departures)
CREATE INDEX IF NOT EXISTS idx_flights_future_departures
  ON public.flights(departure_at)
  WHERE is_public = true AND enabled = true AND departure_at > now();

-- Price sorting
CREATE INDEX IF NOT EXISTS idx_flights_price
  ON public.flights(base_price)
  WHERE is_public = true AND enabled = true;

COMMENT ON INDEX idx_flights_search_route_date_class IS 
  'Optimizes flight search with route, date, and class filters';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. HOTELS PERFORMANCE INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Hotel search: city + stars + price
CREATE INDEX IF NOT EXISTS idx_hotels_search_city_stars_price
  ON public.hotels(city, star_rating, price_per_night)
  WHERE is_public = true AND enabled = true;

-- Featured hotels
CREATE INDEX IF NOT EXISTS idx_hotels_featured_price
  ON public.hotels(is_featured, price_per_night)
  WHERE is_public = true AND enabled = true AND is_featured = true;

-- Hotel room availability: date range lookups
CREATE INDEX IF NOT EXISTS idx_hotel_availability_date_range
  ON public.hotel_room_availability(hotel_id, room_type, date)
  WHERE rooms_left > 0;

COMMENT ON INDEX idx_hotels_search_city_stars_price IS 
  'Optimizes hotel search with city, star rating, and price filters';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. VISAS PERFORMANCE INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Visa search: destination + type
CREATE INDEX IF NOT EXISTS idx_visas_search_destination_type
  ON public.visas(destination_country, visa_type)
  WHERE is_public = true AND enabled = true;

-- Visa documents: customer's documents by status
CREATE INDEX IF NOT EXISTS idx_visa_docs_customer_status
  ON public.visa_documents(customer_id, status, created_at DESC);

-- Staff review queue: pending applications
CREATE INDEX IF NOT EXISTS idx_visa_details_review_queue
  ON public.visa_booking_details(review_status, submitted_at)
  WHERE review_status IN ('submitted', 'under_review');

COMMENT ON INDEX idx_visa_details_review_queue IS 
  'Optimizes staff visa review queue';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. TRIPS PERFORMANCE INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Trip search: destination + date range + availability
CREATE INDEX IF NOT EXISTS idx_trips_search_destination_date
  ON public.trips(destination, start_date, spots_available)
  WHERE is_public = true AND enabled = true AND start_date >= CURRENT_DATE;

-- Featured trips with availability
CREATE INDEX IF NOT EXISTS idx_trips_featured_upcoming
  ON public.trips(is_featured, start_date, price_per_person)
  WHERE is_public = true AND enabled = true AND is_featured = true AND spots_available > 0;

-- Difficulty filter
CREATE INDEX IF NOT EXISTS idx_trips_difficulty_date
  ON public.trips(difficulty, start_date)
  WHERE is_public = true AND enabled = true AND spots_available > 0;

COMMENT ON INDEX idx_trips_search_destination_date IS 
  'Optimizes trip search with destination and date filters';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. PAYMENTS PERFORMANCE INDEXES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Staff payment confirmation queue: pending payments
CREATE INDEX IF NOT EXISTS idx_payments_pending_created
  ON public.payments(status, created_at DESC)
  WHERE status = 'pending';

-- Payment events: audit log lookups
CREATE INDEX IF NOT EXISTS idx_payment_events_payment_created
  ON public.payment_events(payment_id, created_at DESC);

COMMENT ON INDEX idx_payments_pending_created IS 
  'Optimizes staff payment confirmation queue';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. FULL-TEXT SEARCH INDEXES (Optional — for future search enhancement)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Hotel name/city search (Arabic + English)
CREATE INDEX IF NOT EXISTS idx_hotels_fulltext_search
  ON public.hotels USING gin(
    to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(city, ''))
  );

-- Trip title search (Arabic + English)
CREATE INDEX IF NOT EXISTS idx_trips_fulltext_search
  ON public.trips USING gin(
    to_tsvector('simple', COALESCE(title_ar, '') || ' ' || COALESCE(title_en, '') || ' ' || COALESCE(destination, ''))
  );

COMMENT ON INDEX idx_hotels_fulltext_search IS 
  'Enables full-text search on hotel names and cities';

COMMENT ON INDEX idx_trips_fulltext_search IS 
  'Enables full-text search on trip titles and destinations';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. ANALYZE TABLES (Update statistics for query planner)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ANALYZE public.profiles;
ANALYZE public.staff;
ANALYZE public.flights;
ANALYZE public.hotels;
ANALYZE public.hotel_room_availability;
ANALYZE public.visas;
ANALYZE public.trips;
ANALYZE public.bookings;
ANALYZE public.payments;

-- =====================================================================
-- MIGRATION 029 COMPLETE ✅
-- =====================================================================
-- Performance indexes created for common query patterns:
--   - Composite indexes for multi-column filters
--   - Partial indexes for filtered queries (WHERE clauses)
--   - Covering indexes for frequently accessed columns
--   - Full-text search indexes for hotel/trip search
-- Table statistics updated via ANALYZE
-- Query performance optimized for customer + staff dashboards
-- =====================================================================
