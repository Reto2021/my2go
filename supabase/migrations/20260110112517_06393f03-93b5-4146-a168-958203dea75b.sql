-- Create function to award review bonus
CREATE OR REPLACE FUNCTION public.award_review_bonus(_user_id uuid, _review_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _bonus_amount INTEGER;
  _already_awarded BOOLEAN;
BEGIN
  -- Get bonus amount from settings
  SELECT (value::TEXT)::INTEGER INTO _bonus_amount
  FROM public.system_settings WHERE key = 'review_bonus_taler';
  _bonus_amount := COALESCE(_bonus_amount, 5);
  
  -- Check if bonus was already awarded for this review
  IF EXISTS (
    SELECT 1 FROM public.transactions 
    WHERE user_id = _user_id 
      AND source = 'bonus'
      AND reference_id = _review_request_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Bonus already awarded',
      'bonus', 0
    );
  END IF;
  
  -- Award bonus Taler
  INSERT INTO public.transactions (user_id, amount, type, source, description, reference_id)
  VALUES (_user_id, _bonus_amount, 'earn', 'bonus', 'Bewertungs-Bonus', _review_request_id);
  
  RETURN jsonb_build_object(
    'success', true,
    'bonus', _bonus_amount,
    'message', 'Bonus awarded successfully'
  );
END;
$function$;