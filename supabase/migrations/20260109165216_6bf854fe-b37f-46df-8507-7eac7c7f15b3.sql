-- Fix security warnings: Set search_path on functions

-- Fix update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Fix generate_unique_code
CREATE OR REPLACE FUNCTION public.generate_unique_code(prefix TEXT DEFAULT '2GO')
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
BEGIN
  new_code := prefix || '-' || UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT) FROM 1 FOR 5));
  RETURN new_code;
END;
$$;

-- Fix generate_redemption_code
CREATE OR REPLACE FUNCTION public.generate_redemption_code()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  RETURN UPPER(SUBSTRING(MD5(gen_random_uuid()::TEXT || NOW()::TEXT) FROM 1 FOR 8));
END;
$$;