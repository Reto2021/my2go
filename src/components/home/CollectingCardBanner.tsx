import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/contexts/AuthContext';
import { useRegion } from '@/hooks/useRegion';
import { Grid3X3, ChevronRight, Trophy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { TalerIcon } from '@/components/icons/TalerIcon';

export function CollectingCardBanner() {
  const auth = useAuthSafe();
  const userId = auth?.user?.id;
  // Fetch all active campaigns globally (no region filter)
  const { data: campaigns = [] } = useQuery({
    queryKey: ['active-collecting-campaigns'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('collecting_campaigns' as any)
        .select('id, slug, title, subtitle, logo_url, required_purchases, prize_taler, prize_description, ends_at, region_id')
        .eq('is_active', true)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data as any[]) || [];
    },
  });

  // Fetch user's cards for these campaigns
  const campaignIds = campaigns.map((c: any) => c.id);
  const { data: cards = [] } = useQuery({
    queryKey: ['user-collecting-cards', userId, campaignIds],
    queryFn: async () => {
      if (!userId || campaignIds.length === 0) return [];
      const { data, error } = await supabase
        .from('collecting_cards' as any)
        .select('*')
        .eq('user_id', userId)
        .in('campaign_id', campaignIds);
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!userId && campaignIds.length > 0,
  });

  if (campaigns.length === 0) return null;

  const cardsByCampaign = new Map(cards.map((c: any) => [c.campaign_id, c]));

  return (
    <section className="container pb-3">
      <div className="space-y-2">
        {campaigns.map((campaign: any) => {
          const card = cardsByCampaign.get(campaign.id);
          const purchases = card?.total_purchases ?? 0;
          const progress = Math.min((purchases / campaign.required_purchases) * 100, 100);
          const isCompleted = card?.is_completed ?? false;
          const daysLeft = campaign.ends_at
            ? Math.max(0, Math.ceil((new Date(campaign.ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
            : null;

          return (
            <Link
              key={campaign.id}
              to={`/sammeln/${campaign.slug}`}
              className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 border border-primary/20 hover:border-primary/40 transition-all group"
            >
              {campaign.logo_url ? (
                <img
                  src={campaign.logo_url}
                  alt=""
                  className="w-12 h-12 rounded-xl object-contain bg-white p-1 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <Grid3X3 className="h-6 w-6 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-bold text-sm truncate">{campaign.title}</h3>
                  {isCompleted && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-accent/15 text-accent text-[10px] font-bold shrink-0">
                      <Trophy className="h-2.5 w-2.5" /> Fertig
                    </span>
                  )}
                </div>
                {!isCompleted && (
                  <>
                    <Progress value={progress} className="h-1.5 mb-1" />
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{purchases}/{campaign.required_purchases} Stempel</span>
                      {campaign.prize_taler > 0 && (
                        <span className="flex items-center gap-0.5">
                          <TalerIcon className="h-3 w-3" />
                          {campaign.prize_taler} Bonus
                        </span>
                      )}
                      {daysLeft !== null && <span>· {daysLeft}d übrig</span>}
                    </div>
                  </>
                )}
                {isCompleted && (
                  <p className="text-xs text-muted-foreground">Karte abgeschlossen! 🎉</p>
                )}
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
