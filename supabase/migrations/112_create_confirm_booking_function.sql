-- Migration 112: Create confirm_booking function (staff-only)

CREATE OR REPLACE FUNCTION confirm_booking(
  p_request_id uuid,
  p_staff_uid uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_current_status text;
  v_payment_id uuid;
BEGIN
  -- Step 1: Validate staff permission
  IF NOT is_staff(p_staff_uid) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_STAFF');
  END IF;
  
  -- Step 2: Lock travel_request
  SELECT booking_status, linked_payment_id
  INTO v_current_status, v_payment_id
  FROM travel_requests
  WHERE id = p_request_id
  FOR UPDATE;
  
  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'REQUEST_NOT_FOUND');
  END IF;
  
  -- Step 3: Validate current status
  IF v_current_status NOT IN ('quoted', 'pending_payment') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_STATUS', 'current_status', v_current_status);
  END IF;
  
  -- Step 4: Update booking status
  UPDATE travel_requests
  SET
    booking_status = 'confirmed',
    confirmed_at = now(),
    expires_at = NULL,
    updated_at = now()
  WHERE id = p_request_id;
  
  -- Step 5: Update payment status
  IF v_payment_id IS NOT NULL THEN
    UPDATE payment_records
    SET
      status = 'full',
      payment_date = CURRENT_DATE,
      updated_at = now()
    WHERE id = v_payment_id;
  END IF;
  
  -- Step 6: Return success
  RETURN jsonb_build_object(
    'ok', true,
    'booking_status', 'confirmed',
    'confirmed_at', now()::text
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

COMMENT ON FUNCTION confirm_booking IS 'Staff-only: confirms booking after payment received. Clears expires_at, updates payment_records.';
