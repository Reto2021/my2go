-- Add level and engagement_area columns to sponsors table
ALTER TABLE public.sponsors 
ADD COLUMN IF NOT EXISTS level text DEFAULT 'bronze' CHECK (level IN ('platinum', 'gold', 'silver', 'bronze')),
ADD COLUMN IF NOT EXISTS engagement_area text DEFAULT 'community' CHECK (engagement_area IN ('reward', 'radio', 'event', 'partner', 'community')),
ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 100,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS featured_on_home boolean DEFAULT false;

-- Create index for sorting
CREATE INDEX IF NOT EXISTS idx_sponsors_level_sort ON public.sponsors (level, sort_order);

-- Update sort_order based on level for existing sponsors
UPDATE public.sponsors SET sort_order = 
  CASE level
    WHEN 'platinum' THEN 10
    WHEN 'gold' THEN 20
    WHEN 'silver' THEN 30
    WHEN 'bronze' THEN 40
    ELSE 100
  END
WHERE sort_order = 100;