-- Migration 114: Create expire_pending_bookings function (idempotent background job)

CREATE OR REPLACE FUNCTION expire_pending_bookings()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_expired_count integer := 0;
  v_request_record record;
  v_flight_id uuid;
  v_trip_id uuid;
  v_hotel_offer_id uuid;
  v_passengers integer;
  v_travelers integer;
  v_rooms integer;
BEGIN
  -- Find all expired bookings that are not yet marked expired/cancelled
  FOR v_request_record IN
    SELECT id, vertical, booking_reference
    FROM travel_requests
    WHERE expires_at IS NOT NULL
      AND expires_at < now()
      AND booking_status IN ('draft', 'quoted', 'pending_payment')
      AND cancelled_at IS NULL
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Restore inventory based on vertical
    IF v_request_record.vertical = 'flight' THEN
      SELECT flight_id, COALESCE(adults, 0) + COALESCE(children, 0) + COALESCE(infants, 0)
      INTO v_flight_id, v_passengers
      FROM flight_booking_details
      WHERE travel_request_id = v_request_record.id;
      
      IF v_flight_id IS NOT NULL AND v_passengers > 0 THEN
        UPDATE flights
        SET available_seats = available_seats + v_passengers
        WHERE id = v_flight_id AND available_seats >= 0;
      END IF;
      
    ELSIF v_request_record.vertical = 'hotel' THEN
      SELECT hotel_offer_id, num_rooms
      INTO v_hotel_offer_id, v_rooms
      FROM hotel_booking_details
      WHERE travel_request_id = v_request_record.id;
      
      IF v_hotel_offer_id IS NOT NULL AND v_rooms > 0 THEN
        UPDATE hotel_offers
        SET available_rooms = available_rooms + v_rooms
        WHERE id = v_hotel_offer_id AND available_rooms >= 0;
      END IF;
      
    ELSIF v_request_record.vertical = 'trip' THEN
      SELECT trip_id, num_travelers
      INTO v_trip_id, v_travelers
      FROM trip_booking_details
      WHERE travel_request_id = v_request_record.id;
      
      IF v_trip_id IS NOT NULL AND v_travelers > 0 THEN
        UPDATE trips
        SET available_spots = available_spots + v_travelers
        WHERE id = v_trip_id AND available_spots >= 0;
      END IF;
    END IF;
    
    -- Mark as cancelled with "expired" reason
    UPDATE travel_requests
    SET
      booking_status = 'cancelled',
      cancelled_at = now(),
      staff_notes = COALESCE(staff_notes, '') || E'\n' || 'Auto-cancelled: Payment not received before expiry',
      updated_at = now()
    WHERE id = v_request_record.id;
    
    -- Update payment record
    UPDATE payment_records
    SET
      status = 'cancelled',
      notes = COALESCE(notes, '') || E'\n' || 'Expired: Payment not received',
      updated_at = now()
    FROM travel_requests tr
    WHERE payment_records.id = tr.linked_payment_id
      AND tr.id = v_request_record.id;
    
    -- Log to system_logs
    INSERT INTO system_logs (level, event, details, source, metadata)
    VALUES (
      'info',
      'booking_expired',
      'Booking ' || v_request_record.booking_reference || ' expired and cancelled',
      'expire_pending_bookings',
      jsonb_build_object('request_id', v_request_record.id, 'vertical', v_request_record.vertical)
    );
    
    v_expired_count := v_expired_count + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'ok', true,
    'expired_count', v_expired_count
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION expire_pending_bookings IS 'Background job: expires unpaid bookings past expires_at. Idempotent, safe to run every 10 minutes. Uses SKIP LOCKED for concurrency.';
