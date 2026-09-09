-- Migration 107: Create helper functions

-- Helper: Check if user is staff
CREATE OR REPLACE FUNCTION is_staff(p_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = p_uid 
      AND role IN ('staff', 'admin', 'super_admin')
  );
$$;

COMMENT ON FUNCTION is_staff IS 'Returns true if user has staff, admin, or super_admin role';

-- Helper: Generate unique booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference(p_prefix text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_year text;
  v_random text;
  v_reference text;
  v_attempt integer := 0;
  v_max_attempts integer := 10;
BEGIN
  v_year := TO_CHAR(NOW(), 'YYYY');
  
  LOOP
    -- Generate 6 alphanumeric characters (uppercase)
    v_random := UPPER(SUBSTRING(MD5(RANDOM()::text || CLOCK_TIMESTAMP()::text) FROM 1 FOR 6));
    
    -- Format: SPK-{PREFIX}-{YYYY}-{RANDOM}
    v_reference := 'SPK-' || UPPER(p_prefix) || '-' || v_year || '-' || v_random;
    
    -- Check if unique
    IF NOT EXISTS (SELECT 1 FROM travel_requests WHERE booking_reference = v_reference) THEN
      RETURN v_reference;
    END IF;
    
    v_attempt := v_attempt + 1;
    IF v_attempt >= v_max_attempts THEN
      RAISE EXCEPTION 'Failed to generate unique booking reference after % attempts', v_max_attempts;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION generate_booking_reference IS 'Generates collision-safe booking reference with format SPK-{PREFIX}-{YYYY}-{6CHAR}';
