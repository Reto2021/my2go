
-- Rename partner Kollenhof → Cholenhof
UPDATE public.partners 
SET name = 'Cholenhof', slug = 'cholenhof'
WHERE id = 'af4cc3d4-8b81-4cf0-95de-7e8058ae0735';

-- Rename campaign Kollenhof Burgerpass → Bruger-Pass
UPDATE public.collecting_campaigns
SET title = 'Bruger-Pass', slug = 'bruger-pass'
WHERE id = '25a2a241-989d-4c8f-ab37-4e49b0df0a82';
