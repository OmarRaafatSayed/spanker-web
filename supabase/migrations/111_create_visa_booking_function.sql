-- Migration 111: Create visa booking function

CREATE OR REPLACE FUNCTION create_visa_booking(
  p_travel_request_id uuid,
  p_visa_details jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_owner uuid;
  v_total_price numeric;
  v_payment_due_hours integer;
  v_booking_ref text;
  v_detail_id uuid;
  v_payment_id uuid;
  v_visa_app_id uuid;
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
  
  -- Step 2: Validate pricing
  v_total_price := COALESCE((p_visa_details->>'total_price')::numeric, 0);
  
  IF v_total_price <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_PRICE');
  END IF;
  
  -- Step 3: Get payment due hours from policies
  SELECT payment_due_hours INTO v_payment_due_hours
  FROM booking_policies
  WHERE vertical = 'visa';
  
  -- Step 4: Generate booking reference
  v_booking_ref := generate_booking_reference('VSA');
  
  -- Step 5: Optionally link to existing visa_application
  v_visa_app_id := (p_visa_details->>'visa_application_id')::uuid;
  
  -- Step 6: Insert visa booking details
  INSERT INTO visa_booking_details (
    travel_request_id, visa_application_id, destination_country,
    visa_type, processing_type, service_fee, government_fee,
    total_price, currency
  )
  VALUES (
    p_travel_request_id,
    v_visa_app_id,
    p_visa_details->>'destination_country',
    p_visa_details->>'visa_type',
    p_visa_details->>'processing_type',
    (p_visa_details->>'service_fee')::numeric,
    (p_visa_details->>'government_fee')::numeric,
    v_total_price,
    COALESCE(p_visa_details->>'currency', 'EGP')
  )
  RETURNING id INTO v_detail_id;
  
  -- Step 7: Create payment record
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
    COALESCE(p_visa_details->>'applicant_name', (SELECT full_name FROM profiles WHERE user_id = v_owner)),
    v_booking_ref,
    v_total_price,
    'pending',
    'pending',
    'Visa application - ' || (p_visa_details->>'destination_country')
  )
  RETURNING id INTO v_payment_id;
  
  -- Step 8: Update travel_request with booking info
  UPDATE travel_requests
  SET 
    vertical = 'visa',
    source = COALESCE((p_visa_details->>'source')::text, 'self_service'),
    booking_reference = v_booking_ref,
    booking_status = 'quoted',
    total_amount = v_total_price,
    currency = COALESCE(p_visa_details->>'currency', 'EGP'),
    expires_at = now() + (v_payment_due_hours || ' hours')::interval,
    linked_payment_id = v_payment_id,
    linked_visa_application_id = v_visa_app_id,
    destination_country = p_visa_details->>'destination_country',
    updated_at = now()
  WHERE id = p_travel_request_id;
  
  -- Step 9: Return success
  RETURN jsonb_build_object(
    'ok', true,
    'booking_reference', v_booking_ref,
    'detail_id', v_detail_id,
    'payment_id', v_payment_id,
    'expires_at', (now() + (v_payment_due_hours || ' hours')::interval)::text
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION create_visa_booking IS 'Creates visa booking (no inventory). Returns {ok, booking_reference, ...} or {ok: false, code}.';
