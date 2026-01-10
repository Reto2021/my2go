import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function usePartnerRedemptionCount(partnerId: string) {
  return useQuery({
    queryKey: ['partner-redemption-count', partnerId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('redemptions')
        .select('*', { count: 'exact', head: true })
        .eq('partner_id', partnerId)
        .eq('status', 'used');

      if (error) {
        console.error('Error fetching redemption count:', error);
        return 0;
      }

      return count || 0;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAllPartnerRedemptionCounts() {
  return useQuery({
    queryKey: ['all-partner-redemption-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('redemptions')
        .select('partner_id')
        .eq('status', 'used');

      if (error) {
        console.error('Error fetching redemption counts:', error);
        return {};
      }

      // Count redemptions per partner
      const counts: Record<string, number> = {};
      data?.forEach((redemption) => {
        const partnerId = redemption.partner_id;
        counts[partnerId] = (counts[partnerId] || 0) + 1;
      });

      return counts;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
