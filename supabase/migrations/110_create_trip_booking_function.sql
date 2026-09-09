-- Migration 110: Create trip booking function

CREATE OR REPLACE FUNCTION create_trip_booking(
  p_travel_request_id uuid,
  p_trip_id uuid,
  p_trip_details jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_available_spots integer;
  v_num_travelers integer;
  v_total_price numeric;
  v_payment_due_hours integer;
  v_booking_ref text;
  v_detail_id uuid;
  v_payment_id uuid;
  v_rows_updated integer;
  v_trip_start date;
  v_trip_end date;
  v_trip_name text;
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
  
  -- Step 2: Validate traveler count
  v_num_travelers := COALESCE((p_trip_details->>'num_travelers')::integer, 1);
  
  IF v_num_travelers <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TRAVELERS');
  END IF;
  
  -- Step 3: Lock and validate trip inventory
  SELECT available_spots, start_date, end_date, name
  INTO v_available_spots, v_trip_start, v_trip_end, v_trip_name
  FROM trips
  WHERE id = p_trip_id AND is_active = true
  FOR UPDATE NOWAIT;
  
  IF v_available_spots IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TRIP_NOT_FOUND');
  END IF;
  
  IF v_available_spots < v_num_travelers THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INSUFFICIENT_SPOTS', 'available', v_available_spots, 'requested', v_num_travelers);
  END IF;
  
  -- Step 4: Decrement inventory with guard
  UPDATE trips
  SET available_spots = available_spots - v_num_travelers
  WHERE id = p_trip_id 
    AND available_spots >= v_num_travelers;
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  IF v_rows_updated != 1 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVENTORY_CONFLICT');
  END IF;
  
  -- Step 5: Calculate pricing
  v_total_price := COALESCE((p_trip_details->>'total_price')::numeric, 0);
  
  IF v_total_price <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_PRICE');
  END IF;
  
  -- Step 6: Get payment due hours from policies
  SELECT payment_due_hours INTO v_payment_due_hours
  FROM booking_policies
  WHERE vertical = 'trip';
  
  -- Step 7: Generate booking reference
  v_booking_ref := generate_booking_reference('TRP');
  
  -- Step 8: Insert trip booking details
  INSERT INTO trip_booking_details (
    travel_request_id, trip_id, trip_name, destination,
    start_date, end_date, num_travelers, itinerary,
    inclusions, exclusions, total_price, currency
  )
  VALUES (
    p_travel_request_id,
    p_trip_id,
    COALESCE(p_trip_details->>'trip_name', v_trip_name),
    p_trip_details->>'destination',
    COALESCE((p_trip_details->>'start_date')::date, v_trip_start),
    COALESCE((p_trip_details->>'end_date')::date, v_trip_end),
    v_num_travelers,
    p_trip_details->'itinerary',
    p_trip_details->'inclusions',
    p_trip_details->'exclusions',
    v_total_price,
    COALESCE(p_trip_details->>'currency', 'EGP')
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
    COALESCE(p_trip_details->>'traveler_name', (SELECT full_name FROM profiles WHERE user_id = v_owner)),
    v_booking_ref,
    v_total_price,
    'pending',
    'pending',
    'Trip booking - ' || v_num_travelers || ' traveler(s)'
  )
  RETURNING id INTO v_payment_id;
  
  -- Step 10: Update travel_request with booking info
  UPDATE travel_requests
  SET 
    vertical = 'trip',
    source = COALESCE((p_trip_details->>'source')::text, 'self_service'),
    booking_reference = v_booking_ref,
    booking_status = 'quoted',
    total_amount = v_total_price,
    currency = COALESCE(p_trip_details->>'currency', 'EGP'),
    expires_at = now() + (v_payment_due_hours || ' hours')::interval,
    linked_payment_id = v_payment_id,
    departure_date = v_trip_start,
    return_date = v_trip_end,
    traveler_count = v_num_travelers,
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
    RETURN jsonb_build_object('ok', false, 'code', 'TRIP_LOCKED');
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION create_trip_booking IS 'Creates trip/tour booking with inventory locking. Returns {ok, booking_reference, ...} or {ok: false, code}.';
