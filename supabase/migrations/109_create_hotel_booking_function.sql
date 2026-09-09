-- Migration 109: Create hotel booking function

CREATE OR REPLACE FUNCTION create_hotel_booking(
  p_travel_request_id uuid,
  p_hotel_offer_id uuid,
  p_hotel_details jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_available_rooms integer;
  v_num_rooms integer;
  v_num_nights integer;
  v_total_price numeric;
  v_payment_due_hours integer;
  v_booking_ref text;
  v_detail_id uuid;
  v_payment_id uuid;
  v_rows_updated integer;
  v_check_in date;
  v_check_out date;
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
  
  -- Step 2: Validate dates and calculate nights
  v_check_in := (p_hotel_details->>'check_in')::date;
  v_check_out := (p_hotel_details->>'check_out')::date;
  
  IF v_check_in IS NULL OR v_check_out IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'MISSING_DATES');
  END IF;
  
  IF v_check_out <= v_check_in THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_DATES');
  END IF;
  
  v_num_nights := v_check_out - v_check_in;
  v_num_rooms := COALESCE((p_hotel_details->>'num_rooms')::integer, 1);
  
  IF v_num_rooms <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_ROOMS');
  END IF;
  
  -- Step 3: Lock and validate hotel offer inventory
  SELECT available_rooms INTO v_available_rooms
  FROM hotel_offers
  WHERE id = p_hotel_offer_id AND is_active = true
  FOR UPDATE NOWAIT;
  
  IF v_available_rooms IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'HOTEL_NOT_FOUND');
  END IF;
  
  IF v_available_rooms < v_num_rooms THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INSUFFICIENT_ROOMS', 'available', v_available_rooms, 'requested', v_num_rooms);
  END IF;
  
  -- Step 4: Decrement inventory with guard
  UPDATE hotel_offers
  SET available_rooms = available_rooms - v_num_rooms
  WHERE id = p_hotel_offer_id 
    AND available_rooms >= v_num_rooms;
  
  GET DIAGNOSTICS v_rows_updated = ROW_COUNT;
  
  IF v_rows_updated != 1 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVENTORY_CONFLICT');
  END IF;
  
  -- Step 5: Calculate pricing
  v_total_price := COALESCE((p_hotel_details->>'total_price')::numeric, 0);
  
  IF v_total_price <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_PRICE');
  END IF;
  
  -- Step 6: Get payment due hours from policies
  SELECT payment_due_hours INTO v_payment_due_hours
  FROM booking_policies
  WHERE vertical = 'hotel';
  
  -- Step 7: Generate booking reference
  v_booking_ref := generate_booking_reference('HTL');
  
  -- Step 8: Insert hotel booking details
  INSERT INTO hotel_booking_details (
    travel_request_id, hotel_offer_id, hotel_name, hotel_location,
    city, country, check_in, check_out, room_type, board_basis,
    num_rooms, adults, children, total_price, currency, special_requests
  )
  VALUES (
    p_travel_request_id,
    p_hotel_offer_id,
    p_hotel_details->>'hotel_name',
    p_hotel_details->>'hotel_location',
    p_hotel_details->>'city',
    p_hotel_details->>'country',
    v_check_in,
    v_check_out,
    p_hotel_details->>'room_type',
    p_hotel_details->>'board_basis',
    v_num_rooms,
    (p_hotel_details->>'adults')::integer,
    (p_hotel_details->>'children')::integer,
    v_total_price,
    COALESCE(p_hotel_details->>'currency', 'EGP'),
    p_hotel_details->>'special_requests'
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
    COALESCE(p_hotel_details->>'guest_name', (SELECT full_name FROM profiles WHERE user_id = v_owner)),
    v_booking_ref,
    v_total_price,
    'pending',
    'pending',
    'Hotel booking - ' || v_num_nights || ' night(s)'
  )
  RETURNING id INTO v_payment_id;
  
  -- Step 10: Update travel_request with booking info
  UPDATE travel_requests
  SET 
    vertical = 'hotel',
    source = COALESCE((p_hotel_details->>'source')::text, 'self_service'),
    booking_reference = v_booking_ref,
    booking_status = 'quoted',
    total_amount = v_total_price,
    currency = COALESCE(p_hotel_details->>'currency', 'EGP'),
    expires_at = now() + (v_payment_due_hours || ' hours')::interval,
    linked_payment_id = v_payment_id,
    departure_date = v_check_in,
    return_date = v_check_out,
    updated_at = now()
  WHERE id = p_travel_request_id;
  
  -- Step 11: Return success
  RETURN jsonb_build_object(
    'ok', true,
    'booking_reference', v_booking_ref,
    'detail_id', v_detail_id,
    'payment_id', v_payment_id,
    'num_nights', v_num_nights,
    'expires_at', (now() + (v_payment_due_hours || ' hours')::interval)::text
  );
  
EXCEPTION
  WHEN lock_not_available THEN
    RETURN jsonb_build_object('ok', false, 'code', 'HOTEL_LOCKED');
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION create_hotel_booking IS 'Creates hotel booking with inventory locking. Returns {ok, booking_reference, ...} or {ok: false, code}.';
