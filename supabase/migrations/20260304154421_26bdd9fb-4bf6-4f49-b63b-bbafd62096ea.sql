
-- Fix search_path for the new validation function
CREATE OR REPLACE FUNCTION public.validate_collecting_move_type()
RETURNS trigger LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.move_type NOT IN ('horizontal', 'vertical') THEN
    RAISE EXCEPTION 'Invalid move_type: %. Must be horizontal or vertical.', NEW.move_type;
  END IF;
  RETURN NEW;
END;
$$;
