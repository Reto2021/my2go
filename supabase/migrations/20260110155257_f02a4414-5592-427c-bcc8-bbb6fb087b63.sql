-- Add unique constraint to prevent duplicate claims
ALTER TABLE public.code_claims
ADD CONSTRAINT unique_user_code_claim UNIQUE (user_id, code_id);

-- Create atomic air drop code redemption function
CREATE OR REPLACE FUNCTION public.redeem_air_drop_code(
  _user_id UUID,
  _code TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code_record RECORD;
  _claim_id UUID;
  _transaction_id UUID;
BEGIN
  -- Validate input
  IF _user_id IS NULL OR _code IS NULL OR TRIM(_code) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid input');
  END IF;

  -- Lock row for update to prevent race condition
  SELECT * INTO _code_record
  FROM air_drop_codes
  WHERE code = UPPER(TRIM(_code))
    AND is_active = true
    AND (valid_from IS NULL OR valid_from <= now())
    AND valid_until > now()
  FOR UPDATE;
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ungültiger oder abgelaufener Code');
  END IF;
  
  -- Check max claims limit
  IF _code_record.current_claims >= _code_record.max_claims THEN
    RETURN jsonb_build_object('success', false, 'error', 'Maximale Einlösungen erreicht');
  END IF;
  
  -- Check if user already claimed this code
  IF EXISTS (
    SELECT 1 FROM code_claims 
    WHERE code_id = _code_record.id AND user_id = _user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Du hast diesen Code bereits eingelöst');
  END IF;
  
  -- Insert claim record
  INSERT INTO code_claims (code_id, user_id, taler_awarded)
  VALUES (_code_record.id, _user_id, _code_record.taler_value)
  RETURNING id INTO _claim_id;
  
  -- Insert transaction record
  INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
  VALUES (
    _user_id, 
    _code_record.taler_value, 
    'earn', 
    'air_drop', 
    'Air-Drop Code eingelöst: ' || _code_record.code,
    _claim_id
  )
  RETURNING id INTO _transaction_id;
  
  -- Atomically increment claim count
  UPDATE air_drop_codes
  SET current_claims = current_claims + 1
  WHERE id = _code_record.id;
  
  RETURN jsonb_build_object(
    'success', true,
    'taler_awarded', _code_record.taler_value,
    'claim_id', _claim_id,
    'transaction_id', _transaction_id
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Du hast diesen Code bereits eingelöst');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ein Fehler ist aufgetreten');
END;
$$;