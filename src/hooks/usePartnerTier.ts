import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PartnerTier, FEATURE_KEYS } from '@/lib/partner-tiers';

interface PartnerTierData {
  tier: PartnerTier;
  canCreateRewards: boolean;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  showsPoweredByBadge: boolean;
  canExportData: boolean;
  hasFeaturedPlacement: boolean;
  subscriptionEndsAt: string | null;
  isLoading: boolean;
}

export function usePartnerTier(partnerId: string | null): PartnerTierData {
  const { data, isLoading } = useQuery({
    queryKey: ['partner-tier', partnerId],
    queryFn: async () => {
      if (!partnerId) return null;
      
      const { data, error } = await supabase
        .from('partners')
        .select('tier, subscription_ends_at')
        .eq('id', partnerId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!partnerId,
  });

  const tier = (data?.tier as PartnerTier) || 'starter';
  const isPartnerTier = tier === 'partner';

  return {
    tier,
    canCreateRewards: isPartnerTier,
    hasAdvancedAnalytics: isPartnerTier,
    hasPrioritySupport: isPartnerTier,
    showsPoweredByBadge: !isPartnerTier,
    canExportData: isPartnerTier,
    hasFeaturedPlacement: isPartnerTier,
    subscriptionEndsAt: data?.subscription_ends_at || null,
    isLoading,
  };
}

// Hook to check specific feature access
export function usePartnerFeature(partnerId: string | null, featureKey: keyof typeof FEATURE_KEYS): boolean {
  const { tier } = usePartnerTier(partnerId);
  
  if (tier === 'partner') return true;
  
  // Starter tier features
  const starterAllowed: (keyof typeof FEATURE_KEYS)[] = [];
  return starterAllowed.includes(featureKey);
}
