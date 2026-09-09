-- =====================================================================
-- Migration 027: Row Level Security (RLS) Policies
-- =====================================================================
-- Enables RLS on all tables and creates comprehensive policies
-- Three-layer security model:
--   1. Public read for inventory (flights/hotels/visas/trips)
--   2. User owns bookings (customer_id = auth.uid())
--   3. Staff full access (is_staff() = true)
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. ENABLE RLS ON ALL TABLES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_room_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_booking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hotel_booking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visa_booking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_booking_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. PROFILES & STAFF POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Profiles: Users can read and update their own profile
DROP POLICY IF EXISTS "users_view_own_profile" ON public.profiles;
CREATE POLICY "users_view_own_profile" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_staff());

DROP POLICY IF EXISTS "users_update_own_profile" ON public.profiles;
CREATE POLICY "users_update_own_profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Staff: only staff can view staff table
DROP POLICY IF EXISTS "staff_view_staff_table" ON public.staff;
CREATE POLICY "staff_view_staff_table" ON public.staff
  FOR SELECT
  USING (public.is_staff());

-- Staff: only admins can manage staff
DROP POLICY IF EXISTS "admins_manage_staff" ON public.staff;
CREATE POLICY "admins_manage_staff" ON public.staff
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.staff
      WHERE user_id = auth.uid() AND role = 'admin' AND is_active = true
    )
  );

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. INVENTORY POLICIES (Public Read)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Flights: public read for enabled/public flights, staff full access
DROP POLICY IF EXISTS "public_view_available_flights" ON public.flights;
CREATE POLICY "public_view_available_flights" ON public.flights
  FOR SELECT
  USING (is_public = true AND enabled = true);

DROP POLICY IF EXISTS "staff_manage_flights" ON public.flights;
CREATE POLICY "staff_manage_flights" ON public.flights
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Flight search cache: public read (caching layer)
DROP POLICY IF EXISTS "public_read_flight_cache" ON public.flight_search_cache;
CREATE POLICY "public_read_flight_cache" ON public.flight_search_cache
  FOR SELECT
  USING (expires_at > now());

DROP POLICY IF EXISTS "staff_manage_flight_cache" ON public.flight_search_cache;
CREATE POLICY "staff_manage_flight_cache" ON public.flight_search_cache
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Hotels: public read for enabled/public hotels, staff full access
DROP POLICY IF EXISTS "public_view_available_hotels" ON public.hotels;
CREATE POLICY "public_view_available_hotels" ON public.hotels
  FOR SELECT
  USING (is_public = true AND enabled = true);

DROP POLICY IF EXISTS "staff_manage_hotels" ON public.hotels;
CREATE POLICY "staff_manage_hotels" ON public.hotels
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Hotel room availability: public read, staff write
DROP POLICY IF EXISTS "public_view_hotel_availability" ON public.hotel_room_availability;
CREATE POLICY "public_view_hotel_availability" ON public.hotel_room_availability
  FOR SELECT
  USING (rooms_left > 0);

DROP POLICY IF EXISTS "staff_manage_hotel_availability" ON public.hotel_room_availability;
CREATE POLICY "staff_manage_hotel_availability" ON public.hotel_room_availability
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Visas: public read for enabled/public programs, staff full access
DROP POLICY IF EXISTS "public_view_available_visas" ON public.visas;
CREATE POLICY "public_view_available_visas" ON public.visas
  FOR SELECT
  USING (is_public = true AND enabled = true);

DROP POLICY IF EXISTS "staff_manage_visas" ON public.visas;
CREATE POLICY "staff_manage_visas" ON public.visas
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Trips: public read for enabled/public trips, staff full access
DROP POLICY IF EXISTS "public_view_available_trips" ON public.trips;
CREATE POLICY "public_view_available_trips" ON public.trips
  FOR SELECT
  USING (is_public = true AND enabled = true);

DROP POLICY IF EXISTS "staff_manage_trips" ON public.trips;
CREATE POLICY "staff_manage_trips" ON public.trips
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. BOOKINGS POLICIES (User Owns Data + Profile Completeness)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Bookings: user can insert ONLY if profile is complete
DROP POLICY IF EXISTS "users_create_bookings_if_profile_complete" ON public.bookings;
CREATE POLICY "users_create_bookings_if_profile_complete" ON public.bookings
  FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id
    AND public.has_complete_profile(auth.uid())
  );

-- Bookings: user can view/update their own bookings
DROP POLICY IF EXISTS "users_view_own_bookings" ON public.bookings;
CREATE POLICY "users_view_own_bookings" ON public.bookings
  FOR SELECT
  USING (auth.uid() = customer_id OR public.is_staff());

DROP POLICY IF EXISTS "users_update_own_bookings" ON public.bookings;
CREATE POLICY "users_update_own_bookings" ON public.bookings
  FOR UPDATE
  USING (auth.uid() = customer_id OR public.is_staff())
  WITH CHECK (auth.uid() = customer_id OR public.is_staff());

-- Staff can manage all bookings
DROP POLICY IF EXISTS "staff_manage_all_bookings" ON public.bookings;
CREATE POLICY "staff_manage_all_bookings" ON public.bookings
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. BOOKING DETAILS POLICIES (Inherit from parent booking)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Flight booking details
DROP POLICY IF EXISTS "users_view_own_flight_details" ON public.flight_booking_details;
CREATE POLICY "users_view_own_flight_details" ON public.flight_booking_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = flight_booking_details.booking_id
        AND (bookings.customer_id = auth.uid() OR public.is_staff())
    )
  );

DROP POLICY IF EXISTS "staff_manage_flight_details" ON public.flight_booking_details;
CREATE POLICY "staff_manage_flight_details" ON public.flight_booking_details
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Hotel booking details
DROP POLICY IF EXISTS "users_view_own_hotel_details" ON public.hotel_booking_details;
CREATE POLICY "users_view_own_hotel_details" ON public.hotel_booking_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = hotel_booking_details.booking_id
        AND (bookings.customer_id = auth.uid() OR public.is_staff())
    )
  );

DROP POLICY IF EXISTS "staff_manage_hotel_details" ON public.hotel_booking_details;
CREATE POLICY "staff_manage_hotel_details" ON public.hotel_booking_details
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Visa booking details
DROP POLICY IF EXISTS "users_view_own_visa_details" ON public.visa_booking_details;
CREATE POLICY "users_view_own_visa_details" ON public.visa_booking_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = visa_booking_details.booking_id
        AND (bookings.customer_id = auth.uid() OR public.is_staff())
    )
  );

DROP POLICY IF EXISTS "staff_manage_visa_details" ON public.visa_booking_details;
CREATE POLICY "staff_manage_visa_details" ON public.visa_booking_details
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Trip booking details
DROP POLICY IF EXISTS "users_view_own_trip_details" ON public.trip_booking_details;
CREATE POLICY "users_view_own_trip_details" ON public.trip_booking_details
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = trip_booking_details.booking_id
        AND (bookings.customer_id = auth.uid() OR public.is_staff())
    )
  );

DROP POLICY IF EXISTS "staff_manage_trip_details" ON public.trip_booking_details;
CREATE POLICY "staff_manage_trip_details" ON public.trip_booking_details
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. VISA DOCUMENTS POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Users can upload/view their own documents
DROP POLICY IF EXISTS "users_manage_own_visa_docs" ON public.visa_documents;
CREATE POLICY "users_manage_own_visa_docs" ON public.visa_documents
  FOR ALL
  USING (auth.uid() = customer_id)
  WITH CHECK (auth.uid() = customer_id);

-- Staff can view/review all documents
DROP POLICY IF EXISTS "staff_review_visa_docs" ON public.visa_documents;
CREATE POLICY "staff_review_visa_docs" ON public.visa_documents
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. BOOKING POLICIES & HISTORY (Read-only for users)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Booking policies: public read, staff write
DROP POLICY IF EXISTS "public_read_booking_policies" ON public.booking_policies;
CREATE POLICY "public_read_booking_policies" ON public.booking_policies
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "staff_manage_booking_policies" ON public.booking_policies;
CREATE POLICY "staff_manage_booking_policies" ON public.booking_policies
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Booking status history: users can read own history, staff can read all
DROP POLICY IF EXISTS "users_view_own_booking_history" ON public.booking_status_history;
CREATE POLICY "users_view_own_booking_history" ON public.booking_status_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = booking_status_history.booking_id
        AND (bookings.customer_id = auth.uid() OR public.is_staff())
    )
  );

-- System can insert history (via trigger)
DROP POLICY IF EXISTS "system_insert_booking_history" ON public.booking_status_history;
CREATE POLICY "system_insert_booking_history" ON public.booking_status_history
  FOR INSERT
  WITH CHECK (true);

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. PAYMENTS POLICIES
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- Users can view their own payments (via booking ownership)
DROP POLICY IF EXISTS "users_view_own_payments" ON public.payments;
CREATE POLICY "users_view_own_payments" ON public.payments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = payments.booking_id
        AND (bookings.customer_id = auth.uid() OR public.is_staff())
    )
  );

-- NO client-side insert/update on payments (server/RPC only)
-- Staff can manage all payments
DROP POLICY IF EXISTS "staff_manage_payments" ON public.payments;
CREATE POLICY "staff_manage_payments" ON public.payments
  FOR ALL
  USING (public.is_staff())
  WITH CHECK (public.is_staff());

-- Payment events: users can read own events, staff can read all
DROP POLICY IF EXISTS "users_view_own_payment_events" ON public.payment_events;
CREATE POLICY "users_view_own_payment_events" ON public.payment_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.payments
      JOIN public.bookings ON bookings.id = payments.booking_id
      WHERE payments.id = payment_events.payment_id
        AND (bookings.customer_id = auth.uid() OR public.is_staff())
    )
  );

-- System can insert events (via trigger/function)
DROP POLICY IF EXISTS "system_insert_payment_events" ON public.payment_events;
CREATE POLICY "system_insert_payment_events" ON public.payment_events
  FOR INSERT
  WITH CHECK (true);

-- Staff can view all events
DROP POLICY IF EXISTS "staff_view_all_payment_events" ON public.payment_events;
CREATE POLICY "staff_view_all_payment_events" ON public.payment_events
  FOR SELECT
  USING (public.is_staff());

-- =====================================================================
-- MIGRATION 027 COMPLETE ✅
-- =====================================================================
-- RLS enabled on all 18 tables
-- Three-layer security:
--   1. Public read: inventory (flights/hotels/visas/trips)
--   2. User owns: bookings, payments, documents (customer_id = auth.uid())
--   3. Staff full access: is_staff() = true
-- Profile completeness enforced: has_complete_profile() for booking insert
-- No client-side insert/update on payments (server/RPC only)
-- =====================================================================
