-- Migration 108: Create flight booking function

CREATE OR REPLACE FUNCTION create_flight_booking(
  p_travel_request_id uuid,
  p_flight_id uuid,
  p_flight_details jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_available_seats integer;
  v_passengers integer;
  v_total_price numeric;
  v_payment_due_hours integer;
  v_booking_ref text;
  v_detail_id uuid;
  v_payment_id uuid;
  v_rows_updated integer;
BEGIN
  -- Step 1: Lock and validate ownership of travel_request
  SELECT client_user_id INTO v_owner
  FROM travel_requests
  WHERE id = p_travel_request_id
  FOR UPDATE;
  
  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'REQUEST_NOT_FOUND');
  END IF;
  
  IF v_owner != auth.uid() THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_OWNER');
  END IF;
  
  -- Step 2: Calculate passenger count
  v_passengers := COALESCE((p_flight_details->>'adults')::integer, 1) +
                  COALESCE((p_flight_details->>'children')::integer, 0) +
                  COALESCE((p_flight_details->>'infants')::integer, 0);
  
  IF v_passengers <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_PASSENGERS');
  END IF;
  
  -- Step 3: Lock and validate flight inventory
  SELECT available_seats INTO v_available_seats
  FROM flights
  WHERE id = p_flight_id AND is_active = true
  FOR UPDATE NOWAIT;
  
  IF v_available_seats IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'FLIGHT_NOT_FOUND');
  END IF;
  
  IF v_available_seats < v_passengers THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INSUFFICIENT_SEATS', 'available', v_available_seats, 'requested', v_passengers);
  END IF;
  
  -- Step 4: Decrement inventory with guard
  UPDATE flights
  SET available_seats = available_seats - v_passengers
  WHERE id = p_flight_id 
    AND available_seats >= v_passengers;
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  IF v_rows_updated != 1 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVENTORY_CONFLICT');
  END IF;
  
  -- Step 5: Calculate pricing
  v_total_price := COALESCE((p_flight_details->>'total_price')::numeric, 0);
  
  IF v_total_price <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_PRICE');
  END IF;
  
  -- Step 6: Get payment due hours from policies
  SELECT payment_due_hours INTO v_payment_due_hours
  FROM booking_policies
  WHERE vertical = 'flight';
  
  -- Step 7: Generate booking reference
  v_booking_ref := generate_booking_reference('FLT');
  
  -- Step 8: Insert flight booking details
  INSERT INTO flight_booking_details (
    travel_request_id, flight_id, origin, destination, departure_date, return_date,
    adults, children, infants, cabin_class, outbound_flight, return_flight,
    total_price, currency
  )
  VALUES (
    p_travel_request_id,
    p_flight_id,
    p_flight_details->>'origin',
    p_flight_details->>'destination',
    (p_flight_details->>'departure_date')::date,
    (p_flight_details->>'return_date')::date,
    (p_flight_details->>'adults')::integer,
    (p_flight_details->>'children')::integer,
    (p_flight_details->>'infants')::integer,
    p_flight_details->>'cabin_class',
    p_flight_details->'outbound_flight',
    p_flight_details->'return_flight',
    v_total_price,
    COALESCE(p_flight_details->>'currency', 'EGP')
  )
  RETURNING id INTO v_detail_id;
  
  -- Step 9: Create payment record
  INSERT INTO payment_records (
    client_user_id,
    client_name,
    booking_reference,
    amount,
    payment_method,
    status,
    notes
  )
  VALUES (
    v_owner,
    COALESCE(p_flight_details->>'passenger_name', (SELECT full_name FROM profiles WHERE user_id = v_owner)),
    v_booking_ref,
    v_total_price,
    'pending',
    'pending',
    'Flight booking - awaiting payment'
  )
  RETURNING id INTO v_payment_id;
  
  -- Step 10: Update travel_request with booking info
  UPDATE travel_requests
  SET 
    vertical = 'flight',
    source = COALESCE((p_flight_details->>'source')::text, 'self_service'),
    booking_reference = v_booking_ref,
    booking_status = 'quoted',
    total_amount = v_total_price,
    currency = COALESCE(p_flight_details->>'currency', 'EGP'),
    expires_at = now() + (v_payment_due_hours || ' hours')::interval,
    linked_payment_id = v_payment_id,
    updated_at = now()
  WHERE id = p_travel_request_id;
  
  -- Step 11: Return success
  RETURN jsonb_build_object(
    'ok', true,
    'booking_reference', v_booking_ref,
    'detail_id', v_detail_id,
    'payment_id', v_payment_id,
    'expires_at', (now() + (v_payment_due_hours || ' hours')::interval)::text
  );
  
EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object('ok', false, 'code', 'FLIGHT_LOCKED');
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION create_flight_booking IS 'Creates flight booking with inventory locking. Returns {ok, booking_reference, ...} or {ok: false, code}.';
