-- Create live_events table for persistent storage of live streams
CREATE TABLE public.live_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'concert', -- concert, church, dj, talk, special
  stream_url TEXT NOT NULL,
  thumbnail_url TEXT,
  host_name TEXT,
  host_avatar_url TEXT,
  
  -- Scheduling
  scheduled_start TIMESTAMP WITH TIME ZONE,
  scheduled_end TIMESTAMP WITH TIME ZONE,
  
  -- Status
  is_live BOOLEAN NOT NULL DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Stats
  viewer_count INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  
  -- Metadata
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.live_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can view active live events
CREATE POLICY "Anyone can view active live events"
ON public.live_events
FOR SELECT
USING (is_active = true);

-- Admins can manage all live events
CREATE POLICY "Admins can manage live events"
ON public.live_events
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create updated_at trigger
CREATE TRIGGER update_live_events_updated_at
BEFORE UPDATE ON public.live_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_live_events_is_live ON public.live_events(is_live) WHERE is_active = true;
CREATE INDEX idx_live_events_scheduled ON public.live_events(scheduled_start) WHERE is_active = true;

-- Add realtime support
ALTER PUBLICATION supabase_realtime ADD TABLE public.live_events;