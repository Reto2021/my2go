CREATE OR REPLACE FUNCTION public.award_review_bonus(
  _user_id uuid, 
  _review_request_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _bonus_amount INTEGER;
BEGIN
  SELECT (value::TEXT)::INTEGER INTO _bonus_amount
  FROM system_settings WHERE key = 'review_bonus_taler';
  _bonus_amount := COALESCE(_bonus_amount, 5);

  IF NOT EXISTS (
    SELECT 1 FROM review_requests 
    WHERE id = _review_request_id 
      AND user_id = _user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid review request');
  END IF;

  IF EXISTS (
    SELECT 1 FROM transactions 
    WHERE user_id = _user_id 
      AND reference_id = _review_request_id
      AND source = 'bonus'
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bonus already awarded');
  END IF;

  INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
  VALUES (_user_id, _bonus_amount, 'earn', 'bonus', 'Bewertungs-Bonus', _review_request_id);

  PERFORM add_taler_to_batch(_user_id, _bonus_amount);

  RETURN jsonb_build_object('success', true, 'bonus', _bonus_amount);
END;
$$;