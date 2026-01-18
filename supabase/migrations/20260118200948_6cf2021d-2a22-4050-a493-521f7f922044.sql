-- Create sponsoring inquiries table
CREATE TABLE public.sponsoring_inquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  desired_level TEXT,
  engagement_area TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.sponsoring_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can view all inquiries
CREATE POLICY "Admins can view sponsoring inquiries"
ON public.sponsoring_inquiries
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Admins can update inquiries
CREATE POLICY "Admins can update sponsoring inquiries"
ON public.sponsoring_inquiries
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Policy: Anyone can insert (public form)
CREATE POLICY "Anyone can submit sponsoring inquiry"
ON public.sponsoring_inquiries
FOR INSERT
WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_sponsoring_inquiries_updated_at
BEFORE UPDATE ON public.sponsoring_inquiries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for status filtering
CREATE INDEX idx_sponsoring_inquiries_status ON public.sponsoring_inquiries(status);
CREATE INDEX idx_sponsoring_inquiries_created_at ON public.sponsoring_inquiries(created_at DESC);