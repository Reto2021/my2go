import { Link } from 'react-router-dom';
import { useActiveCampaigns, useCampaignPartners } from '@/hooks/useSeasonalCampaigns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ChevronRight, Sparkles, Store } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function CampaignBanner() {
  const { data: campaigns = [] } = useActiveCampaigns();
  const activeCampaign = campaigns[0]; // Show the most recent active campaign

  const { data: campaignPartners = [] } = useCampaignPartners(activeCampaign?.id || null);

  const partnerIds = campaignPartners.map(cp => cp.partner_id);

  const { data: partners = [] } = useQuery({
    queryKey: ['campaign-partner-details', partnerIds],
    enabled: partnerIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, slug, logo_url, category, city')
        .in('id', partnerIds)
        .eq('is_active', true);
      if (error) throw error;
      return data || [];
    },
  });

  if (!activeCampaign || partners.length === 0) return null;

  const endsAt = new Date(activeCampaign.ends_at);
  const daysLeft = Math.max(0, Math.ceil((endsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  return (
    <section className="container pb-4">
      <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/15 via-accent/10 to-primary/10 border border-accent/20">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-5 w-5 text-accent" />
          <h3 className="font-bold text-base">{activeCampaign.name}</h3>
          <Badge 
            variant="secondary" 
            className="ml-auto text-[10px]"
            style={{ backgroundColor: activeCampaign.badge_color + '20', color: activeCampaign.badge_color }}
          >
            {activeCampaign.badge_text}
          </Badge>
        </div>

        {activeCampaign.description && (
          <p className="text-sm text-muted-foreground mb-3">{activeCampaign.description}</p>
        )}

        {/* Bonus info */}
        {(activeCampaign.bonus_taler > 0 || activeCampaign.bonus_multiplier > 1) && (
          <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl bg-accent/10">
            <span className="text-sm font-semibold text-accent">
              {activeCampaign.bonus_taler > 0 && `+${activeCampaign.bonus_taler} Bonus-Taler`}
              {activeCampaign.bonus_taler > 0 && activeCampaign.bonus_multiplier > 1 && ' · '}
              {activeCampaign.bonus_multiplier > 1 && `${activeCampaign.bonus_multiplier}x Taler`}
            </span>
            <span className="text-xs text-muted-foreground">bei Kampagnen-Partnern</span>
          </div>
        )}

        {/* Partner logos */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {partners.slice(0, 6).map(p => (
            <Link
              key={p.id}
              to={`/partner/${p.id}`}
              className="shrink-0 flex flex-col items-center gap-1.5 w-16 group"
            >
              {p.logo_url ? (
                <img
                  src={p.logo_url}
                  alt={p.name}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-accent/30 group-hover:ring-accent transition-all"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center ring-2 ring-accent/30">
                  <Store className="h-5 w-5 text-muted-foreground" />
                </div>
              )}
              <span className="text-[10px] font-medium text-center leading-tight line-clamp-2">{p.name}</span>
            </Link>
          ))}
          {partners.length > 6 && (
            <div className="shrink-0 w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center text-xs font-bold text-muted-foreground">
              +{partners.length - 6}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-accent/10">
          <span className="text-xs text-muted-foreground">
            Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} · bis {format(endsAt, 'dd. MMM', { locale: de })}
          </span>
          <Link to="/partner" className="text-xs font-semibold text-accent flex items-center gap-1">
            Alle Partner <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}
