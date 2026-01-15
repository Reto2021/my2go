-- Update the process_referral function to link successful referrals with share events
CREATE OR REPLACE FUNCTION public.process_referral(_referral_code text, _referred_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    _referrer_id uuid;
    _referral_id uuid;
    _referrer_bonus int := 25;
    _referred_bonus int := 25;
    _result json;
BEGIN
    -- Find the referrer by their permanent code
    SELECT user_id INTO _referrer_id
    FROM user_codes
    WHERE permanent_code = upper(_referral_code)
    AND is_active = true;

    -- Check if referrer exists
    IF _referrer_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid referral code');
    END IF;

    -- Check if user is trying to refer themselves
    IF _referrer_id = _referred_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Cannot refer yourself');
    END IF;

    -- Check if user was already referred
    IF EXISTS (SELECT 1 FROM profiles WHERE id = _referred_user_id AND referred_by IS NOT NULL) THEN
        RETURN json_build_object('success', false, 'error', 'User already has a referrer');
    END IF;

    -- Check if this referral already exists
    IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = _referred_user_id) THEN
        RETURN json_build_object('success', false, 'error', 'Referral already processed');
    END IF;

    -- Create the referral record
    INSERT INTO referrals (referrer_id, referred_id, referrer_bonus, referred_bonus, status)
    VALUES (_referrer_id, _referred_user_id, _referrer_bonus, _referred_bonus, 'completed')
    RETURNING id INTO _referral_id;

    -- Update the referred user's profile
    UPDATE profiles
    SET referred_by = _referrer_id
    WHERE id = _referred_user_id;

    -- Update the referrer's referral count
    UPDATE profiles
    SET referral_count = COALESCE(referral_count, 0) + 1
    WHERE id = _referrer_id;

    -- Award bonus to referrer
    INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
    VALUES (_referrer_id, _referrer_bonus, 'earn', 'referral', 'Empfehlungsbonus', _referral_id);

    -- Award bonus to referred user
    INSERT INTO transactions (user_id, amount, type, source, description, reference_id)
    VALUES (_referred_user_id, _referred_bonus, 'earn', 'referral', 'Willkommensbonus durch Empfehlung', _referral_id);

    -- Link the most recent share event with this referral code to the conversion
    UPDATE referral_shares
    SET converted_referral_id = _referral_id
    WHERE id = (
        SELECT id 
        FROM referral_shares 
        WHERE referral_code = upper(_referral_code)
        AND converted_referral_id IS NULL
        ORDER BY shared_at DESC
        LIMIT 1
    );

    RETURN json_build_object(
        'success', true,
        'referral_id', _referral_id,
        'referrer_bonus', _referrer_bonus,
        'referred_bonus', _referred_bonus
    );
END;
$$;