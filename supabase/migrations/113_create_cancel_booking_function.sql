-- Migration 113: Create cancel_booking function with idempotent inventory restoration

CREATE OR REPLACE FUNCTION cancel_booking(
  p_request_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_current_status text;
  v_vertical text;
  v_departure_date date;
  v_cancelled_at timestamptz;
  v_cancellation_window integer;
  v_cancellation_fee_pct numeric;
  v_total_amount numeric;
  v_refund_amount numeric;
  v_penalty_amount numeric;
  v_hours_until_departure numeric;
  v_flight_id uuid;
  v_trip_id uuid;
  v_hotel_offer_id uuid;
  v_passengers integer;
  v_travelers integer;
  v_rooms integer;
  v_rows_updated integer;
BEGIN
  -- Step 1: Early exit if already cancelled (idempotency check)
  SELECT booking_status, cancelled_at, client_user_id, vertical, departure_date, total_amount
  INTO v_current_status, v_cancelled_at, v_owner, v_vertical, v_departure_date, v_total_amount
  FROM travel_requests
  WHERE id = p_request_id;
  
  IF v_cancelled_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_CANCELLED', 'cancelled_at', v_cancelled_at::text);
  END IF;
  
  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'REQUEST_NOT_FOUND');
  END IF;
  
  -- Step 2: Lock row and recheck (prevent concurrent cancellations)
  SELECT booking_status, cancelled_at
  INTO v_current_status, v_cancelled_at
  FROM travel_requests
  WHERE id = p_request_id
  FOR UPDATE;
  
  IF v_cancelled_at IS NOT NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_CANCELLED', 'cancelled_at', v_cancelled_at::text);
  END IF;
  
  -- Step 3: Validate ownership or staff permission
  IF v_owner != auth.uid() AND NOT is_staff(auth.uid()) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHORIZED');
  END IF;
  
  -- Step 4: Validate cancellable status
  IF v_current_status NOT IN ('quoted', 'pending_payment', 'confirmed') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'CANNOT_CANCEL', 'current_status', v_current_status);
  END IF;
  
  -- Step 5: Get cancellation policy
  SELECT cancellation_window_hours, cancellation_fee_percent
  INTO v_cancellation_window, v_cancellation_fee_pct
  FROM booking_policies
  WHERE vertical = v_vertical;
  
  -- Step 6: Calculate penalty based on time until departure
  IF v_departure_date IS NOT NULL THEN
    v_hours_until_departure := EXTRACT(EPOCH FROM (v_departure_date::timestamp - now())) / 3600;
    
    IF v_cancellation_window IS NOT NULL AND v_hours_until_departure >= v_cancellation_window THEN
      -- Free cancellation window
      v_penalty_amount := 0;
      v_refund_amount := v_total_amount;
    ELSE
      -- Apply penalty
      v_penalty_amount := v_total_amount * (v_cancellation_fee_pct / 100);
      v_refund_amount := v_total_amount - v_penalty_amount;
    END IF;
  ELSE
    -- No departure date (visa), apply flat fee
    v_penalty_amount := v_total_amount * (v_cancellation_fee_pct / 100);
    v_refund_amount := v_total_amount - v_penalty_amount;
  END IF;
  
  -- Step 7: Restore inventory (idempotent - only if not already cancelled)
  IF v_vertical = 'flight' THEN
    -- Get flight booking details
    SELECT flight_id, COALESCE(adults, 0) + COALESCE(children, 0) + COALESCE(infants, 0)
    INTO v_flight_id, v_passengers
    FROM flight_booking_details
    WHERE travel_request_id = p_request_id;
    
    IF v_flight_id IS NOT NULL AND v_passengers > 0 THEN
      UPDATE flights
      SET available_seats = available_seats + v_passengers
      WHERE id = v_flight_id AND available_seats >= 0;
      
      GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    END IF;
    
  ELSIF v_vertical = 'hotel' THEN
    -- Get hotel booking details
    SELECT hotel_offer_id, num_rooms
    INTO v_hotel_offer_id, v_rooms
    FROM hotel_booking_details
    WHERE travel_request_id = p_request_id;
    
    IF v_hotel_offer_id IS NOT NULL AND v_rooms > 0 THEN
      UPDATE hotel_offers
      SET available_rooms = available_rooms + v_rooms
      WHERE id = v_hotel_offer_id AND available_rooms >= 0;
      
      GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    END IF;
    
  ELSIF v_vertical = 'trip' THEN
    -- Get trip booking details
    SELECT trip_id, num_travelers
    INTO v_trip_id, v_travelers
    FROM trip_booking_details
    WHERE travel_request_id = p_request_id;
    
    IF v_trip_id IS NOT NULL AND v_travelers > 0 THEN
      UPDATE trips
      SET available_spots = available_spots + v_travelers
      WHERE id = v_trip_id AND available_spots >= 0;
      
      GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
    END IF;
  END IF;
  
  -- Step 8: Mark booking as cancelled (atomic update with WHERE clause)
  UPDATE travel_requests
  SET
    booking_status = 'cancelled',
    cancelled_at = now(),
    staff_notes = COALESCE(staff_notes, '') || E'\n' || 'Cancelled: ' || COALESCE(p_reason, 'No reason provided'),
    updated_at = now()
  WHERE id = p_request_id 
    AND cancelled_at IS NULL;
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  IF v_rows_updated != 1 THEN
    -- This should not happen due to earlier checks, but safeguard
    RETURN jsonb_build_object('ok', false, 'code', 'CONCURRENT_CANCELLATION');
  END IF;
  
  -- Step 9: Update payment record if exists
  UPDATE payment_records
  SET
    status = 'refunded',
    notes = COALESCE(notes, '') || E'\n' || 'Refund: ' || v_refund_amount || ' (Penalty: ' || v_penalty_amount || ')',
    updated_at = now()
  FROM travel_requests tr
  WHERE payment_records.id = tr.linked_payment_id
    AND tr.id = p_request_id;
  
  -- Step 10: Log cancellation to portal_status_log
  INSERT INTO portal_status_log (
    request_id,
    travel_request_id,
    customer_id,
    from_status,
    to_status,
    note,
    changed_by
  )
  SELECT
    p_request_id,
    p_request_id,
    v_owner,
    v_current_status,
    'cancelled',
    'Cancellation: ' || COALESCE(p_reason, 'User requested') || '. Refund: ' || v_refund_amount || ', Penalty: ' || v_penalty_amount,
    auth.uid()
  WHERE EXISTS (SELECT 1 FROM travel_requests WHERE id = p_request_id);
  
  -- Step 11: Return success with refund details
  RETURN jsonb_build_object(
    'ok', true,
    'booking_status', 'cancelled',
    'cancelled_at', now()::text,
    'total_amount', v_total_amount,
    'penalty_amount', v_penalty_amount,
    'refund_amount', v_refund_amount,
    'hours_until_departure', v_hours_until_departure
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION cancel_booking IS 'Cancels booking with policy-based refund calculation. Idempotent - safe to call multiple times. Restores inventory exactly once.';
