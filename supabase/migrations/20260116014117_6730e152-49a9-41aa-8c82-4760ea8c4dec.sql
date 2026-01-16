-- Add max_per_user column to rewards table
-- NULL = unlimited redemptions per user
-- 1 = one-time redemption per user
-- Any positive integer = max number of times a user can redeem this reward
ALTER TABLE public.rewards 
ADD COLUMN max_per_user integer DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.rewards.max_per_user IS 'Maximum number of times a single user can redeem this reward. NULL means unlimited.';

-- Create a function to check if user can redeem a reward
CREATE OR REPLACE FUNCTION public.can_user_redeem_reward(_user_id uuid, _reward_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max_per_user integer;
  _current_redemptions integer;
BEGIN
  -- Get the max_per_user limit for this reward
  SELECT max_per_user INTO _max_per_user
  FROM rewards
  WHERE id = _reward_id AND is_active = true;
  
  -- If no limit is set, user can redeem
  IF _max_per_user IS NULL THEN
    RETURN true;
  END IF;
  
  -- Count how many times this user has redeemed this reward (excluding cancelled)
  SELECT COUNT(*) INTO _current_redemptions
  FROM redemptions
  WHERE user_id = _user_id 
    AND reward_id = _reward_id
    AND status != 'cancelled';
  
  -- Return whether user is under the limit
  RETURN _current_redemptions < _max_per_user;
END;
$$;

-- Create a function to get remaining redemptions for a user
CREATE OR REPLACE FUNCTION public.get_user_remaining_redemptions(_user_id uuid, _reward_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _max_per_user integer;
  _current_redemptions integer;
BEGIN
  -- Get the max_per_user limit for this reward
  SELECT max_per_user INTO _max_per_user
  FROM rewards
  WHERE id = _reward_id;
  
  -- If no limit is set, return -1 to indicate unlimited
  IF _max_per_user IS NULL THEN
    RETURN -1;
  END IF;
  
  -- Count how many times this user has redeemed this reward (excluding cancelled)
  SELECT COUNT(*) INTO _current_redemptions
  FROM redemptions
  WHERE user_id = _user_id 
    AND reward_id = _reward_id
    AND status != 'cancelled';
  
  -- Return remaining redemptions (can be 0 or negative if over limit)
  RETURN GREATEST(0, _max_per_user - _current_redemptions);
END;
$$;