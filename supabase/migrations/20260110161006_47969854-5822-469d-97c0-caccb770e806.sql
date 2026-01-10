-- Create partner applications table to store partner signup requests
CREATE TABLE public.partner_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Company info
  company_name text NOT NULL,
  industry text NOT NULL,
  website text,
  
  -- Location
  address_street text NOT NULL,
  address_number text NOT NULL,
  postal_code text NOT NULL,
  city text NOT NULL,
  country text DEFAULT 'CH',
  
  -- Contact
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text NOT NULL,
  whatsapp_opt_in boolean DEFAULT false,
  
  -- Details
  google_business_url text,
  opening_hours text,
  goals text[] DEFAULT '{}',
  
  -- Shipping
  shipping_same_as_location boolean DEFAULT true,
  shipping_street text,
  shipping_number text,
  shipping_postal_code text,
  shipping_city text,
  
  -- Status
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'contacted')),
  reviewed_at timestamp with time zone,
  reviewed_by uuid REFERENCES auth.users(id),
  notes text,
  
  -- Metadata
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Policies
-- Users can create their own applications
CREATE POLICY "Users can create their own application"
ON public.partner_applications
FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON public.partner_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can manage all applications
CREATE POLICY "Admins can manage all applications"
ON public.partner_applications
FOR ALL
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create index for faster lookups
CREATE INDEX idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX idx_partner_applications_user_id ON public.partner_applications(user_id);

-- Update trigger for updated_at
CREATE TRIGGER update_partner_applications_updated_at
BEFORE UPDATE ON public.partner_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();