import { useState } from 'react';
import { usePartnerTier } from '@/hooks/usePartnerTier';
import { PARTNER_TIERS } from '@/lib/partner-tiers';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, ArrowRight, Loader2, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface UpgradeBannerProps {
  partnerId: string;
  featureName?: string;
  className?: string;
  compact?: boolean;
}

export function UpgradeBanner({ partnerId, featureName, className, compact = false }: UpgradeBannerProps) {
  const { tier, isLoading } = usePartnerTier(partnerId);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Don't show for partner tier
  if (isLoading || tier === 'partner') return null;

  const handleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      const { data, error } = await supabase.functions.invoke('upgrade-partner-tier', {
        body: { 
          partner_id: partnerId,
          billing_period: 'monthly',
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('Keine Checkout-URL erhalten');

      // Open in new tab, fallback to redirect
      const popup = window.open(data.url, '_blank');
      if (!popup) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Upgrade error:', error);
      toast.error('Fehler beim Starten des Upgrades');
    } finally {
      setIsUpgrading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleUpgrade}
        disabled={isUpgrading}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium",
          "bg-gradient-to-r from-primary to-accent text-white",
          "hover:opacity-90 transition-opacity",
          "disabled:opacity-50",
          className
        )}
      >
        {isUpgrading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Crown className="h-3 w-3" />
        )}
        Upgrade
      </button>
    );
  }

  return (
    <Card className={cn("border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 shrink-0">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm mb-1">
              {featureName ? `${featureName} freischalten` : 'Auf Partner upgraden'}
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              {featureName 
                ? `Diese Funktion ist im Partner-Paket enthalten.`
                : 'Schalte alle Features frei: Gutscheine, erweiterte Analytics, POS-Materialien und mehr.'
              }
            </p>
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleUpgrade}
                disabled={isUpgrading}
                size="sm"
                className="gap-2"
              >
                {isUpgrading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Jetzt upgraden
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
              <span className="text-xs text-muted-foreground">
                ab CHF {PARTNER_TIERS.partner.monthlyPrice}/Monat
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
