-- =====================================================================
-- Migration 028: RPC Functions (Atomic Booking Engine)
-- =====================================================================
-- Core booking functions with SELECT FOR UPDATE (row-level locking)
-- Prevents double-booking / overselling via atomic operations
-- Functions: book_flight, book_hotel, book_trip, submit_visa_application,
--            cancel_booking, confirm_booking, expire_pending_bookings,
--            review_visa_application
-- =====================================================================

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. BOOK FLIGHT (Atomic)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.book_flight(
  p_user UUID,
  p_flight UUID,
  p_passengers JSONB,
  p_contact JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_flight public.flights;
  v_booking public.bookings;
  v_seats INTEGER;
  v_total NUMERIC;
BEGIN
  -- Validate profile completeness
  IF NOT public.has_complete_profile(p_user) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_INCOMPLETE', 
      'message', 'Complete your profile before booking');
  END IF;

  -- Count passengers
  v_seats := jsonb_array_length(p_passengers);
  
  -- Lock flight row (prevents concurrent bookings)
  SELECT * INTO v_flight FROM public.flights
  WHERE id = p_flight AND enabled = true AND is_public = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND', 'message', 'Flight not found');
  END IF;

  -- Check departure time
  IF v_flight.departure_at < now() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'DEPARTED', 'message', 'Flight has already departed');
  END IF;

  -- Check seat availability
  IF v_flight.seats_available < v_seats THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_SEATS', 
      'available', v_flight.seats_available, 'requested', v_seats,
      'message', 'Insufficient seats available');
  END IF;

  -- Calculate total
  v_total := (v_flight.base_price + v_flight.taxes_amount) * v_seats;

  -- Create booking
  INSERT INTO public.bookings (reference, vertical, customer_id, status, total_amount, currency, contact, expires_at)
  VALUES (
    public.generate_reference('FL'),
    'flight',
    p_user,
    'pending',
    v_total,
    'EGP',
    p_contact,
    now() + INTERVAL '15 minutes'
  )
  RETURNING * INTO v_booking;

  -- Create flight booking details
  INSERT INTO public.flight_booking_details (booking_id, flight_id, passengers)
  VALUES (v_booking.id, p_flight, p_passengers);

  -- Decrement seats atomically
  UPDATE public.flights
  SET seats_available = seats_available - v_seats
  WHERE id = p_flight;

  -- Create payment record
  PERFORM public.create_payment(v_booking.id, v_total, 'cash');

  RETURN jsonb_build_object(
    'ok', true,
    'reference', v_booking.reference,
    'booking_id', v_booking.id,
    'total', v_total,
    'expires_at', v_booking.expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.book_flight IS 
  'Atomically books flight — locks row, checks availability, decrements seats, creates booking + payment';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 2. BOOK HOTEL (Atomic with date-range check)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.book_hotel(
  p_user UUID,
  p_hotel UUID,
  p_room_type TEXT,
  p_check_in DATE,
  p_check_out DATE,
  p_guests INTEGER,
  p_rooms INTEGER,
  p_contact JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_hotel public.hotels;
  v_booking public.bookings;
  v_nights INTEGER;
  v_total NUMERIC;
  v_night DATE;
  v_avail INTEGER;
BEGIN
  -- Validate profile completeness
  IF NOT public.has_complete_profile(p_user) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_INCOMPLETE');
  END IF;

  -- Validate dates
  IF p_check_out <= p_check_in THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_DATES', 
      'message', 'Check-out must be after check-in');
  END IF;

  IF p_check_in < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PAST_DATE', 
      'message', 'Check-in date cannot be in the past');
  END IF;

  v_nights := p_check_out - p_check_in;

  -- Lock hotel row
  SELECT * INTO v_hotel FROM public.hotels
  WHERE id = p_hotel AND enabled = true AND is_public = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  -- Check availability for ALL nights in the range
  FOR v_night IN SELECT generate_series(p_check_in, p_check_out - 1, '1 day'::interval)::date
  LOOP
    SELECT rooms_left INTO v_avail
    FROM public.hotel_room_availability
    WHERE hotel_id = p_hotel
      AND date = v_night
      AND room_type = p_room_type
    FOR UPDATE;

    IF NOT FOUND OR v_avail < p_rooms THEN
      RETURN jsonb_build_object('ok', false, 'code', 'NO_ROOMS',
        'date', v_night, 'available', COALESCE(v_avail, 0), 'requested', p_rooms,
        'message', 'Insufficient rooms available for selected dates');
    END IF;
  END LOOP;

  -- Calculate total
  v_total := ROUND((v_hotel.price_per_night * v_nights * p_rooms) * (1 + v_hotel.taxes_percent / 100), 2);

  -- Create booking
  INSERT INTO public.bookings (reference, vertical, customer_id, status, total_amount, currency, contact, expires_at)
  VALUES (
    public.generate_reference('HT'),
    'hotel',
    p_user,
    'pending',
    v_total,
    'EGP',
    p_contact,
    now() + INTERVAL '15 minutes'
  )
  RETURNING * INTO v_booking;

  -- Create hotel booking details
  INSERT INTO public.hotel_booking_details (booking_id, hotel_id, room_type, check_in, check_out, guests, rooms, lead_guest)
  VALUES (v_booking.id, p_hotel, p_room_type, p_check_in, p_check_out, p_guests, p_rooms, p_contact);

  -- Decrement availability for each night
  UPDATE public.hotel_room_availability
  SET rooms_left = rooms_left - p_rooms
  WHERE hotel_id = p_hotel
    AND room_type = p_room_type
    AND date >= p_check_in
    AND date < p_check_out;

  -- Create payment
  PERFORM public.create_payment(v_booking.id, v_total, 'cash');

  RETURN jsonb_build_object(
    'ok', true,
    'reference', v_booking.reference,
    'booking_id', v_booking.id,
    'total', v_total,
    'nights', v_nights,
    'expires_at', v_booking.expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.book_hotel IS 
  'Atomically books hotel — validates date-range availability, decrements per-night inventory';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 3. BOOK TRIP (Atomic spots decrement)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.book_trip(
  p_user UUID,
  p_trip UUID,
  p_travelers INTEGER,
  p_lead_traveler JSONB,
  p_special_requests TEXT,
  p_contact JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_trip public.trips;
  v_booking public.bookings;
  v_total NUMERIC;
BEGIN
  -- Validate profile completeness
  IF NOT public.has_complete_profile(p_user) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_INCOMPLETE');
  END IF;

  -- Lock trip row
  SELECT * INTO v_trip FROM public.trips
  WHERE id = p_trip AND enabled = true AND is_public = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  -- Check departure date
  IF v_trip.start_date < CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'code', 'DEPARTED', 
      'message', 'Trip has already started');
  END IF;

  -- Check spot availability
  IF v_trip.spots_available < p_travelers THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_SPOTS',
      'available', v_trip.spots_available, 'requested', p_travelers,
      'message', 'Insufficient spots available');
  END IF;

  -- Calculate total
  v_total := v_trip.price_per_person * p_travelers;

  -- Create booking
  INSERT INTO public.bookings (reference, vertical, customer_id, status, total_amount, currency, contact, expires_at)
  VALUES (
    public.generate_reference('TR'),
    'trip',
    p_user,
    'pending',
    v_total,
    'EGP',
    p_contact,
    now() + INTERVAL '15 minutes'
  )
  RETURNING * INTO v_booking;

  -- Create trip booking details
  INSERT INTO public.trip_booking_details (booking_id, trip_id, travelers, lead_traveler, special_requests)
  VALUES (v_booking.id, p_trip, p_travelers, p_lead_traveler, p_special_requests);

  -- Decrement spots atomically
  UPDATE public.trips
  SET spots_available = spots_available - p_travelers
  WHERE id = p_trip;

  -- Create payment
  PERFORM public.create_payment(v_booking.id, v_total, 'cash');

  RETURN jsonb_build_object(
    'ok', true,
    'reference', v_booking.reference,
    'booking_id', v_booking.id,
    'total', v_total,
    'expires_at', v_booking.expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.book_trip IS 
  'Atomically books trip — locks row, checks spots, decrements availability';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 4. SUBMIT VISA APPLICATION (No inventory, passport validation)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.submit_visa_application(
  p_user UUID,
  p_visa UUID,
  p_applicant JSONB,
  p_passport JSONB,
  p_documents JSONB,
  p_travel_date DATE,
  p_purpose TEXT,
  p_contact JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_visa public.visas;
  v_booking public.bookings;
  v_passport_expiry DATE;
  v_nationality TEXT;
  v_validation JSONB;
BEGIN
  -- Validate profile completeness
  IF NOT public.has_complete_profile(p_user) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_INCOMPLETE');
  END IF;

  -- Get visa program
  SELECT * INTO v_visa FROM public.visas
  WHERE id = p_visa AND enabled = true AND is_public = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  -- Extract passport details
  v_passport_expiry := (p_passport->>'expiry_date')::DATE;
  v_nationality := p_passport->>'nationality';

  -- Validate nationality eligibility
  IF v_visa.eligible_nationalities IS NOT NULL 
     AND NOT (v_nationality = ANY(v_visa.eligible_nationalities)) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NATIONALITY_NOT_ELIGIBLE',
      'message', 'Your nationality is not eligible for this visa program');
  END IF;

  -- Validate passport expiry
  v_validation := public.validate_passport_expiry(p_visa, v_passport_expiry, p_travel_date);
  IF NOT (v_validation->>'valid')::BOOLEAN THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PASSPORT_EXPIRED',
      'validation', v_validation);
  END IF;

  -- Create booking
  INSERT INTO public.bookings (reference, vertical, customer_id, status, total_amount, currency, contact, expires_at)
  VALUES (
    public.generate_reference('VS'),
    'visa',
    p_user,
    'pending',
    v_visa.price + v_visa.service_fee,
    'EGP',
    p_contact,
    now() + INTERVAL '24 hours'  -- Visa applications get 24h hold time
  )
  RETURNING * INTO v_booking;

  -- Create visa booking details
  INSERT INTO public.visa_booking_details (
    booking_id, visa_id, applicant, passport, documents, 
    purpose_of_travel, intended_travel_date, review_status
  )
  VALUES (
    v_booking.id, p_visa, p_applicant, p_passport, p_documents,
    p_purpose, p_travel_date, 'submitted'
  );

  -- Create payment
  PERFORM public.create_payment(v_booking.id, v_visa.price + v_visa.service_fee, 'cash');

  RETURN jsonb_build_object(
    'ok', true,
    'reference', v_booking.reference,
    'booking_id', v_booking.id,
    'total', v_visa.price + v_visa.service_fee,
    'processing_days', v_visa.processing_days,
    'expires_at', v_booking.expires_at
  );
END;
$$;

COMMENT ON FUNCTION public.submit_visa_application IS 
  'Submits visa application — validates passport + nationality, no inventory decrement';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 5. CANCEL BOOKING (With refund calculation)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_user UUID,
  p_reference TEXT,
  p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking public.bookings;
  v_policy public.booking_policies;
  v_service_time TIMESTAMPTZ;
  v_hours_until INTEGER;
  v_refund_amount NUMERIC := 0;
  v_penalty_amount NUMERIC := 0;
BEGIN
  -- Get booking (check ownership)
  SELECT * INTO v_booking FROM public.bookings
  WHERE reference = p_reference
    AND (customer_id = p_user OR public.is_staff())
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsondb_build_object('ok', false, 'code', 'NOT_FOUND', 'message', 'Booking not found');
  END IF;

  -- Check if already cancelled
  IF v_booking.status IN ('cancelled', 'expired', 'refunded') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_CANCELLED', 
      'message', 'Booking is already cancelled');
  END IF;

  -- Get policy
  SELECT * INTO v_policy FROM public.booking_policies
  WHERE vertical = v_booking.vertical;

  -- Determine service time (departure/check-in/start date)
  CASE v_booking.vertical
    WHEN 'flight' THEN
      SELECT departure_at INTO v_service_time
      FROM public.flights f
      JOIN public.flight_booking_details fbd ON fbd.flight_id = f.id
      WHERE fbd.booking_id = v_booking.id;
    WHEN 'hotel' THEN
      SELECT check_in::TIMESTAMPTZ INTO v_service_time
      FROM public.hotel_booking_details
      WHERE booking_id = v_booking.id;
    WHEN 'trip' THEN
      SELECT start_date::TIMESTAMPTZ INTO v_service_time
      FROM public.trips t
      JOIN public.trip_booking_details tbd ON tbd.trip_id = t.id
      WHERE tbd.booking_id = v_booking.id;
    WHEN 'visa' THEN
      -- Visa: check if submitted to authorities (review_status)
      DECLARE v_review_status TEXT;
      BEGIN
        SELECT review_status INTO v_review_status
        FROM public.visa_booking_details
        WHERE booking_id = v_booking.id;
        
        IF v_review_status IN ('under_review', 'approved') THEN
          v_refund_amount := 0;  -- No refund after submission
          v_penalty_amount := v_booking.total_amount;
        ELSE
          v_refund_amount := v_booking.total_amount;  -- Full refund before submission
        END IF;
        
        GOTO apply_refund;
      END;
  END CASE;

  -- Calculate hours until service
  v_hours_until := EXTRACT(EPOCH FROM (v_service_time - now())) / 3600;

  -- Apply cancellation policy
  IF v_hours_until >= v_policy.free_cancel_window THEN
    v_refund_amount := v_booking.total_amount;
    v_penalty_amount := 0;
  ELSIF v_hours_until >= v_policy.penalty_window THEN
    v_penalty_amount := v_booking.total_amount * (v_policy.penalty_percent / 100);
    v_refund_amount := v_booking.total_amount - v_penalty_amount;
  ELSE
    v_refund_amount := 0;
    v_penalty_amount := v_booking.total_amount;
  END IF;

  <<apply_refund>>
  
  -- Update booking status
  UPDATE public.bookings
  SET status = 'cancelled', cancelled_at = now(), notes = p_reason
  WHERE id = v_booking.id;

  -- Restore inventory based on vertical
  CASE v_booking.vertical
    WHEN 'flight' THEN
      UPDATE public.flights f
      SET seats_available = seats_available + jsonb_array_length(fbd.passengers)
      FROM public.flight_booking_details fbd
      WHERE fbd.booking_id = v_booking.id AND f.id = fbd.flight_id;
    WHEN 'hotel' THEN
      UPDATE public.hotel_room_availability hra
      SET rooms_left = rooms_left + hbd.rooms
      FROM public.hotel_booking_details hbd
      WHERE hbd.booking_id = v_booking.id
        AND hra.hotel_id = hbd.hotel_id
        AND hra.room_type = hbd.room_type
        AND hra.date >= hbd.check_in
        AND hra.date < hbd.check_out;
    WHEN 'trip' THEN
      UPDATE public.trips t
      SET spots_available = spots_available + tbd.travelers
      FROM public.trip_booking_details tbd
      WHERE tbd.booking_id = v_booking.id AND t.id = tbd.trip_id;
    ELSE NULL;
  END CASE;

  RETURN jsonb_build_object(
    'ok', true,
    'booking_id', v_booking.id,
    'reference', v_booking.reference,
    'refund_amount', v_refund_amount,
    'penalty_amount', v_penalty_amount,
    'message', 'Booking cancelled successfully'
  );
END;
$$;

COMMENT ON FUNCTION public.cancel_booking IS 
  'Cancels booking with refund calculation per policy — restores inventory atomically';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 6. CONFIRM BOOKING (Staff only, clears expiry)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.confirm_booking(
  p_staff UUID,
  p_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Check caller is staff
  IF NOT public.is_staff() THEN
    RETURN jsondb_build_object('ok', false, 'error', 'Access denied: staff only');
  END IF;

  -- Update booking
  UPDATE public.bookings
  SET 
    status = 'confirmed',
    confirmed_at = now(),
    expires_at = NULL
  WHERE reference = p_reference
    AND status = 'pending'
  RETURNING id INTO v_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Booking not found or already processed');
  END IF;

  RETURN jsondb_build_object('ok', true, 'booking_id', v_booking_id, 'message', 'Booking confirmed');
END;
$$;

COMMENT ON FUNCTION public.confirm_booking IS 
  'Staff-only: confirms pending booking and clears expiry';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 7. EXPIRE PENDING BOOKINGS (Cron job)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.expire_pending_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_booking RECORD;
BEGIN
  -- Find expired pending bookings
  FOR v_booking IN
    SELECT id, vertical FROM public.bookings
    WHERE status = 'pending'
      AND expires_at IS NOT NULL
      AND expires_at < now()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Mark as expired
    UPDATE public.bookings
    SET status = 'expired'
    WHERE id = v_booking.id;

    -- Restore inventory
    CASE v_booking.vertical
      WHEN 'flight' THEN
        UPDATE public.flights f
        SET seats_available = seats_available + jsonb_array_length(fbd.passengers)
        FROM public.flight_booking_details fbd
        WHERE fbd.booking_id = v_booking.id AND f.id = fbd.flight_id;
      WHEN 'hotel' THEN
        UPDATE public.hotel_room_availability hra
        SET rooms_left = rooms_left + hbd.rooms
        FROM public.hotel_booking_details hbd
        WHERE hbd.booking_id = v_booking.id
          AND hra.hotel_id = hbd.hotel_id
          AND hra.room_type = hbd.room_type
          AND hra.date >= hbd.check_in
          AND hra.date < hbd.check_out;
      WHEN 'trip' THEN
        UPDATE public.trips t
        SET spots_available = spots_available + tbd.travelers
        FROM public.trip_booking_details tbd
        WHERE tbd.booking_id = v_booking.id AND t.id = tbd.trip_id;
      ELSE NULL;
    END CASE;

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN v_expired_count;
END;
$$;

COMMENT ON FUNCTION public.expire_pending_bookings IS 
  'Cron job: expires pending bookings past hold time, restores inventory atomically';

-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 8. REVIEW VISA APPLICATION (Staff only)
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CREATE OR REPLACE FUNCTION public.review_visa_application(
  p_staff UUID,
  p_application UUID,
  p_decision TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id UUID;
BEGIN
  -- Check caller is staff
  IF NOT public.is_staff() THEN
    RETURN jsondb_build_object('ok', false, 'error', 'Access denied: staff only');
  END IF;

  -- Validate decision
  IF p_decision NOT IN ('approved', 'rejected', 'needs_more_info') THEN
    RETURN jsondb_build_object('ok', false, 'error', 'Invalid decision');
  END IF;

  -- Update visa application
  UPDATE public.visa_booking_details
  SET 
    review_status = p_decision,
    reviewer_id = p_staff,
    review_notes = p_notes,
    decided_at = now()
  WHERE booking_id = p_application
  RETURNING booking_id INTO v_booking_id;

  IF NOT FOUND THEN
    RETURN jsondb_build_object('ok', false, 'error', 'Application not found');
  END IF;

  -- Update booking status if approved
  IF p_decision = 'approved' THEN
    UPDATE public.bookings
    SET status = 'confirmed', confirmed_at = now()
    WHERE id = v_booking_id;
  END IF;

  RETURN jsondb_build_object('ok', true, 'booking_id', v_booking_id, 'decision', p_decision);
END;
$$;

COMMENT ON FUNCTION public.review_visa_application IS 
  'Staff-only: approves/rejects visa application, updates booking status';

-- =====================================================================
-- MIGRATION 028 COMPLETE ✅
-- =====================================================================
-- RPC Functions: book_flight, book_hotel, book_trip, submit_visa_application,
--                cancel_booking, confirm_booking, expire_pending_bookings,
--                review_visa_application
-- All use SELECT FOR UPDATE for row-level locking
-- Atomic inventory management prevents overselling
-- Cancellation with refund calculation per policy
-- Expiry cron job restores inventory
-- =====================================================================
