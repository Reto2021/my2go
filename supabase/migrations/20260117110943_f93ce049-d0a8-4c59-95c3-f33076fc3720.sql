-- Add partner_id to live_events for partner-owned streams
ALTER TABLE public.live_events 
ADD COLUMN partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX idx_live_events_partner_id ON public.live_events(partner_id);

-- Drop existing policies to recreate with partner support
DROP POLICY IF EXISTS "Admins can manage live events" ON public.live_events;
DROP POLICY IF EXISTS "Anyone can view active live events" ON public.live_events;

-- Admins can manage all live events
CREATE POLICY "Admins can manage all live events" 
ON public.live_events 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Partner admins can manage their own partner's live events
CREATE POLICY "Partner admins can manage own live events" 
ON public.live_events 
FOR ALL 
USING (
  partner_id IS NOT NULL 
  AND is_partner_admin(auth.uid(), partner_id)
)
WITH CHECK (
  partner_id IS NOT NULL 
  AND is_partner_admin(auth.uid(), partner_id)
);

-- Anyone can view active live events (public viewing)
CREATE POLICY "Anyone can view active live events" 
ON public.live_events 
FOR SELECT 
USING (is_active = true);