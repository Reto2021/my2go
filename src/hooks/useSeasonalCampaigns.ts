import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SeasonalCampaign {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner_image_url: string | null;
  badge_text: string;
  badge_color: string;
  bonus_multiplier: number;
  bonus_taler: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CampaignPartner {
  id: string;
  campaign_id: string;
  partner_id: string;
  custom_badge_text: string | null;
  sort_order: number;
}

export function useActiveCampaigns() {
  return useQuery({
    queryKey: ['seasonal-campaigns', 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasonal_campaigns')
        .select('*')
        .eq('is_active', true)
        .lte('starts_at', new Date().toISOString())
        .gte('ends_at', new Date().toISOString())
        .order('starts_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SeasonalCampaign[];
    },
  });
}

export function useAllCampaigns() {
  return useQuery({
    queryKey: ['seasonal-campaigns', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('seasonal_campaigns')
        .select('*')
        .order('starts_at', { ascending: false });
      if (error) throw error;
      return (data || []) as SeasonalCampaign[];
    },
  });
}

export function useCampaignPartners(campaignId: string | null) {
  return useQuery({
    queryKey: ['campaign-partners', campaignId],
    enabled: !!campaignId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_partners')
        .select('*')
        .eq('campaign_id', campaignId!)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data || []) as CampaignPartner[];
    },
  });
}

export function usePartnerActiveCampaigns(partnerId: string | null) {
  return useQuery({
    queryKey: ['partner-campaigns', partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_partners')
        .select('*, seasonal_campaigns(*)')
        .eq('partner_id', partnerId!);
      if (error) throw error;
      return data || [];
    },
  });
}
