-- Add GoHighLevel integration columns to partners table
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS ghl_location_id TEXT,
ADD COLUMN IF NOT EXISTS ghl_synced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS ghl_sync_status TEXT DEFAULT 'pending';

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_partners_ghl_location_id ON public.partners(ghl_location_id);

-- Add comment for documentation
COMMENT ON COLUMN public.partners.ghl_location_id IS 'GoHighLevel Sub-Account (Location) ID';
COMMENT ON COLUMN public.partners.ghl_synced_at IS 'Last sync timestamp with GoHighLevel';
COMMENT ON COLUMN public.partners.ghl_sync_status IS 'Sync status: pending, synced, error';