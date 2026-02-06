import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/contexts/AuthContext';
import { Sparkles, ChevronRight, MapPin, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface RecommendedReward {
  id: string;
  title: string;
  taler_cost: number;
  partner_name: string;
  partner_slug: string;
  reason: string; // Why it's recommended
}

function useRecommendedRewards() {
  const auth = useAuthSafe();
  const userId = auth?.user?.id;

  return useQuery({
    queryKey: ['recommended-rewards', userId],
    queryFn: async (): Promise<RecommendedReward[]> => {
      if (!userId) return [];

      // Get user's recent redemption patterns
      const { data: recentRedemptions } = await supabase
        .from('redemptions')
        .select('reward_id, partner_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get user's balance
      const { data: balanceData } = await supabase.rpc('get_user_balance', { _user_id: userId });
      const balance = (balanceData as any)?.taler_balance || 0;

      // Get all active rewards with partner info
      const { data: rewards } = await supabase
        .from('rewards')
        .select('id, title, taler_cost, reward_type, partner_id, description')
        .eq('is_active', true)
        .lte('taler_cost', Math.max(balance * 2, 100)) // Show affordable + aspirational
        .order('taler_cost', { ascending: true })
        .limit(50);

      if (!rewards?.length) return [];

      // Get partner names
      const partnerIds = [...new Set(rewards.map(r => r.partner_id))];
      const { data: partners } = await supabase.rpc('get_public_partners_safe');
      const partnerMap = new Map((partners as any[] || []).map(p => [p.id, { name: p.name, slug: p.slug }]));

      // Score rewards based on affordability and variety
      const redeemedPartnerIds = new Set((recentRedemptions || []).map(r => r.partner_id));
      
      const scored = rewards
        .map(r => {
          const partner = partnerMap.get(r.partner_id);
          if (!partner) return null;

          let score = 0;
          let reason = '';

          // Affordable = higher score
          if (r.taler_cost <= balance) {
            score += 30;
            reason = 'Jetzt einlösbar';
          } else {
            reason = `Noch ${r.taler_cost - balance} Taler`;
          }

          // New partner = bonus (encourage variety)
          if (!redeemedPartnerIds.has(r.partner_id)) {
            score += 20;
            if (!reason.includes('einlösbar')) reason = 'Neuer Partner für dich';
          }

          // Experiences get a boost
          if (r.reward_type === 'experience') {
            score += 10;
            reason = 'Erlebnis-Tipp';
          }

          return {
            id: r.id,
            title: r.title,
            taler_cost: r.taler_cost,
            partner_name: partner.name,
            partner_slug: partner.slug,
            reason,
            score,
          };
        })
        .filter(Boolean)
        .sort((a, b) => b!.score - a!.score)
        .slice(0, 3) as (RecommendedReward & { score: number })[];

      return scored.map(({ score, ...rest }) => rest);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 10,
  });
}

export function RecommendedRewardsSection() {
  const { data: recommendations, isLoading } = useRecommendedRewards();

  if (isLoading || !recommendations?.length) return null;

  return (
    <section className="container pb-4">
      <div className="section-header">
        <h2 className="section-title flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Für dich empfohlen
        </h2>
      </div>
      <div className="space-y-2">
        {recommendations.map((rec) => (
          <Link
            key={rec.id}
            to={`/rewards/${rec.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-accent/5 border border-accent/10 hover:bg-accent/10 transition-colors group"
          >
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center shrink-0">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground line-clamp-1">{rec.title}</p>
              <p className="text-xs text-muted-foreground">{rec.partner_name}</p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-accent">
                <Coins className="h-3 w-3" />
                {rec.taler_cost}
              </span>
              <p className="text-[10px] text-muted-foreground">{rec.reason}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent shrink-0" />
          </Link>
        ))}
      </div>
    </section>
  );
}
