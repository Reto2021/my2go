import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Sponsor, RewardSponsor } from '@/components/sponsors/SponsorBadge';

export function useRewardSponsors(rewardId: string | undefined) {
  const [sponsors, setSponsors] = useState<RewardSponsor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!rewardId) {
      setIsLoading(false);
      return;
    }

    const fetchSponsors = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const { data, error: fetchError } = await supabase
          .from('reward_sponsors')
          .select(`
            id,
            reward_id,
            sponsor_id,
            sponsorship_type,
            display_text,
            sponsor:sponsors (
              id,
              name,
              logo_url,
              website
            )
          `)
          .eq('reward_id', rewardId);

        if (fetchError) throw fetchError;
        
        // Transform data to flatten sponsor
        const transformed = (data || []).map((item: any) => ({
          ...item,
          sponsor: item.sponsor as Sponsor
        })) as RewardSponsor[];
        
        setSponsors(transformed);
      } catch (err) {
        console.error('Failed to fetch reward sponsors:', err);
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSponsors();
  }, [rewardId]);

  return { sponsors, isLoading, error };
}

// Hook to get sponsors for multiple rewards at once (for lists)
export function useRewardsSponsors(rewardIds: string[]) {
  const [sponsorsMap, setSponsorsMap] = useState<Record<string, RewardSponsor[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (rewardIds.length === 0) {
      setIsLoading(false);
      return;
    }

    const fetchSponsors = async () => {
      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from('reward_sponsors')
          .select(`
            id,
            reward_id,
            sponsor_id,
            sponsorship_type,
            display_text,
            sponsor:sponsors (
              id,
              name,
              logo_url,
              website
            )
          `)
          .in('reward_id', rewardIds);

        if (error) throw error;
        
        // Group by reward_id
        const grouped: Record<string, RewardSponsor[]> = {};
        (data || []).forEach((item: any) => {
          const rewardId = item.reward_id;
          if (!grouped[rewardId]) {
            grouped[rewardId] = [];
          }
          grouped[rewardId].push({
            ...item,
            sponsor: item.sponsor as Sponsor
          } as RewardSponsor);
        });
        
        setSponsorsMap(grouped);
      } catch (err) {
        console.error('Failed to fetch rewards sponsors:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSponsors();
  }, [rewardIds.join(',')]);

  return { sponsorsMap, isLoading };
}
