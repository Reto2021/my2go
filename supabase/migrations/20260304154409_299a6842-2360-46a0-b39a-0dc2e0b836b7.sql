
-- collecting_campaigns: Admin-konfigurierte Kampagnen
CREATE TABLE public.collecting_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  grid_size int NOT NULL DEFAULT 6,
  required_purchases int NOT NULL DEFAULT 11,
  min_unique_shops int NOT NULL DEFAULT 4,
  scan_cooldown_hours int NOT NULL DEFAULT 4,
  max_scans_per_day int NOT NULL DEFAULT 3,
  min_days_to_complete int NOT NULL DEFAULT 3,
  milestones jsonb DEFAULT '[]'::jsonb,
  prize_description text,
  prize_taler int DEFAULT 0,
  logo_url text,
  is_active boolean DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- collecting_cards: User-Fortschritt
CREATE TABLE public.collecting_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.collecting_campaigns(id) ON DELETE CASCADE,
  current_position int DEFAULT 0,
  total_purchases int DEFAULT 0,
  is_completed boolean DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- collecting_card_cells: Scan-History pro Feld
CREATE TABLE public.collecting_card_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.collecting_cards(id) ON DELETE CASCADE,
  cell_position int NOT NULL,
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  move_type text NOT NULL,
  scanned_at timestamptz DEFAULT now(),
  sponsored_cell_id uuid,
  bonus_claimed boolean DEFAULT false
);

-- collecting_sponsored_cells: Partner-buchbare Bonusfelder
CREATE TABLE public.collecting_sponsored_cells (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.collecting_campaigns(id) ON DELETE CASCADE,
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  cell_position int NOT NULL,
  bonus_type text DEFAULT 'extra_taler',
  bonus_value int,
  bonus_reward_id uuid REFERENCES public.rewards(id),
  display_text text,
  is_active boolean DEFAULT true,
  price_chf numeric,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Add FK from cells to sponsored_cells
ALTER TABLE public.collecting_card_cells 
  ADD CONSTRAINT collecting_card_cells_sponsored_cell_id_fkey 
  FOREIGN KEY (sponsored_cell_id) REFERENCES public.collecting_sponsored_cells(id);

-- Add validation trigger for move_type
CREATE OR REPLACE FUNCTION public.validate_collecting_move_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.move_type NOT IN ('horizontal', 'vertical') THEN
    RAISE EXCEPTION 'Invalid move_type: %. Must be horizontal or vertical.', NEW.move_type;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_move_type
  BEFORE INSERT OR UPDATE ON public.collecting_card_cells
  FOR EACH ROW EXECUTE FUNCTION public.validate_collecting_move_type();

-- Updated_at triggers
CREATE TRIGGER update_collecting_campaigns_updated_at
  BEFORE UPDATE ON public.collecting_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collecting_cards_updated_at
  BEFORE UPDATE ON public.collecting_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.collecting_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collecting_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collecting_card_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collecting_sponsored_cells ENABLE ROW LEVEL SECURITY;

-- collecting_campaigns: public read for active campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON public.collecting_campaigns FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage campaigns"
  ON public.collecting_campaigns FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- collecting_cards: users see/manage own cards
CREATE POLICY "Users can view own cards"
  ON public.collecting_cards FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own cards"
  ON public.collecting_cards FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own cards"
  ON public.collecting_cards FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all cards"
  ON public.collecting_cards FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- collecting_card_cells: users see own cells via card ownership
CREATE POLICY "Users can view own cells"
  ON public.collecting_card_cells FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.collecting_cards c 
    WHERE c.id = card_id AND c.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage all cells"
  ON public.collecting_card_cells FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Service role inserts cells via edge function (no INSERT policy for regular users needed)

-- collecting_sponsored_cells: public read, admin/partner write
CREATE POLICY "Anyone can view active sponsored cells"
  ON public.collecting_sponsored_cells FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage sponsored cells"
  ON public.collecting_sponsored_cells FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Partner admins can manage own sponsored cells"
  ON public.collecting_sponsored_cells FOR ALL
  TO authenticated
  USING (public.is_partner_admin(auth.uid(), partner_id))
  WITH CHECK (public.is_partner_admin(auth.uid(), partner_id));
