-- Add contact person fields to partners table
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS contact_first_name TEXT,
ADD COLUMN IF NOT EXISTS contact_last_name TEXT,
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.partners.contact_first_name IS 'Vorname der Kontaktperson';
COMMENT ON COLUMN public.partners.contact_last_name IS 'Nachname der Kontaktperson';
COMMENT ON COLUMN public.partners.contact_email IS 'E-Mail der Kontaktperson';
COMMENT ON COLUMN public.partners.contact_phone IS 'Telefon der Kontaktperson';