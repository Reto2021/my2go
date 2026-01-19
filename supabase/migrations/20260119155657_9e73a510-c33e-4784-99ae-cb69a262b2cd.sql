-- Remove the overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can insert QR scans" ON public.qr_scans;

-- Add IP address column for rate limiting and deduplication
ALTER TABLE public.qr_scans ADD COLUMN IF NOT EXISTS ip_address text;

-- Create a secure function to insert QR scans with rate limiting
-- This function checks for duplicate scans from the same IP within a time window
CREATE OR REPLACE FUNCTION public.insert_qr_scan_rate_limited(
  _partner_id uuid,
  _utm_source text DEFAULT NULL,
  _utm_medium text DEFAULT NULL,
  _utm_campaign text DEFAULT NULL,
  _user_agent text DEFAULT NULL,
  _referrer text DEFAULT NULL,
  _user_id uuid DEFAULT NULL,
  _ip_address text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_scan_count integer;
  scan_id uuid;
BEGIN
  -- Check if partner exists and is active
  IF NOT EXISTS (SELECT 1 FROM partners WHERE id = _partner_id AND is_active = true) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid partner');
  END IF;

  -- Rate limiting: Check if this IP has made too many scans in the last minute
  -- Allow max 10 scans per IP per minute to prevent spam
  IF _ip_address IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_scan_count
    FROM qr_scans
    WHERE ip_address = _ip_address
      AND scanned_at > now() - interval '1 minute';
    
    IF recent_scan_count >= 10 THEN
      RETURN json_build_object('success', false, 'error', 'Rate limit exceeded');
    END IF;
    
    -- Deduplication: Check if same IP scanned same partner in the last 5 minutes
    IF EXISTS (
      SELECT 1 FROM qr_scans 
      WHERE partner_id = _partner_id 
        AND ip_address = _ip_address 
        AND scanned_at > now() - interval '5 minutes'
    ) THEN
      -- Silently succeed but don't insert duplicate
      RETURN json_build_object('success', true, 'deduplicated', true);
    END IF;
  END IF;

  -- Insert the scan
  INSERT INTO qr_scans (
    partner_id,
    utm_source,
    utm_medium,
    utm_campaign,
    user_agent,
    referrer,
    user_id,
    ip_address
  ) VALUES (
    _partner_id,
    _utm_source,
    _utm_medium,
    _utm_campaign,
    _user_agent,
    _referrer,
    _user_id,
    _ip_address
  )
  RETURNING id INTO scan_id;

  RETURN json_build_object('success', true, 'scan_id', scan_id);
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.insert_qr_scan_rate_limited TO anon, authenticated;

-- Create index for rate limiting queries
CREATE INDEX IF NOT EXISTS idx_qr_scans_ip_scanned_at ON public.qr_scans(ip_address, scanned_at) WHERE ip_address IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qr_scans_ip_partner ON public.qr_scans(ip_address, partner_id, scanned_at) WHERE ip_address IS NOT NULL;