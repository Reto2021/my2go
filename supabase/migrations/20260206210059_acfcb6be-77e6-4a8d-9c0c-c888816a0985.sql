
-- Add 'navigation' to transaction_source enum
ALTER TYPE public.transaction_source ADD VALUE IF NOT EXISTS 'navigation';

-- Create RPC to award navigation taler (3 Taler, 1x per partner per day)
CREATE OR REPLACE FUNCTION public.award_navigation_taler(_user_id uuid, _partner_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_already_today BOOLEAN;
  v_reward INTEGER := 3;
BEGIN
  -- Check if user already navigated to this partner today
  SELECT EXISTS (
    SELECT 1 FROM transactions
    WHERE user_id = _user_id
      AND partner_id = _partner_id
      AND source = 'navigation'
      AND type = 'earn'
      AND created_at >= date_trunc('day', NOW())
  ) INTO v_already_today;

  IF v_already_today THEN
    RETURN jsonb_build_object(
      'success', false,
      'already_awarded', true,
      'message', 'Heute bereits Navigations-Taler erhalten'
    );
  END IF;

  -- Award Taler
  INSERT INTO transactions (user_id, partner_id, amount, type, source, description)
  VALUES (_user_id, _partner_id, v_reward, 'earn', 'navigation', 'Navigation zu Partner');

  -- Add to monthly batch
  PERFORM add_taler_to_batch(_user_id, v_reward);

  RETURN jsonb_build_object(
    'success', true,
    'taler_awarded', v_reward,
    'message', '+3 Taler für Navigation'
  );
END;
$$;
