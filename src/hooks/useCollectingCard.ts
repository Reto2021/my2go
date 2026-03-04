import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CollectingCampaign {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  grid_size: number;
  required_purchases: number;
  min_unique_shops: number;
  milestones: Array<{ at_purchase: number; type: string; value: number; label?: string }>;
  prize_description: string | null;
  prize_taler: number | null;
  logo_url: string | null;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface CollectingCard {
  id: string;
  user_id: string;
  campaign_id: string;
  current_position: number;
  total_purchases: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface CollectingCell {
  id: string;
  card_id: string;
  cell_position: number;
  partner_id: string;
  move_type: "horizontal" | "vertical";
  scanned_at: string;
  sponsored_cell_id: string | null;
  bonus_claimed: boolean;
}

export interface SponsoredCell {
  id: string;
  campaign_id: string;
  partner_id: string;
  cell_position: number;
  bonus_type: string;
  bonus_value: number | null;
  display_text: string | null;
  is_active: boolean;
}

export function useCollectingCampaign(slug: string | undefined) {
  return useQuery({
    queryKey: ["collecting-campaign", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collecting_campaigns" as any)
        .select("*")
        .eq("slug", slug!)
        .eq("is_active", true)
        .single();
      if (error) throw error;
      return data as unknown as CollectingCampaign;
    },
    enabled: !!slug,
  });
}

export function useCollectingCard(campaignId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ["collecting-card", campaignId, userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collecting_cards" as any)
        .select("*")
        .eq("campaign_id", campaignId!)
        .eq("user_id", userId!)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
      return (data as unknown as CollectingCard) || null;
    },
    enabled: !!campaignId && !!userId,
  });
}

export function useCollectingCells(cardId: string | undefined) {
  return useQuery({
    queryKey: ["collecting-cells", cardId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collecting_card_cells" as any)
        .select("*")
        .eq("card_id", cardId!)
        .order("cell_position", { ascending: true });
      if (error) throw error;
      return (data as unknown as CollectingCell[]) || [];
    },
    enabled: !!cardId,
  });
}

export function useSponsoredCells(campaignId: string | undefined) {
  return useQuery({
    queryKey: ["sponsored-cells", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("collecting_sponsored_cells" as any)
        .select("*")
        .eq("campaign_id", campaignId!)
        .eq("is_active", true);
      if (error) throw error;
      return (data as unknown as SponsoredCell[]) || [];
    },
    enabled: !!campaignId,
  });
}
