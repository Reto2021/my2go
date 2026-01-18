import { useState } from 'react';
import { Crown, Check, Loader2, ExternalLink, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { PlusUpgradeSheet } from '@/components/subscription/PlusUpgradeSheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export function SubscriptionSettings() {
  const { user } = useAuth();
  const { 
    isSubscribed, 
    isTrial, 
    status, 
    tier, 
    subscriptionEnd, 
    trialDaysRemaining,
    isLoading,
    openCustomerPortal,
    checkSubscription 
  } = useSubscription();
  
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  if (!user || isLoading) {
    return null;
  }

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      await openCustomerPortal();
    } catch (error) {
      toast.error('Fehler beim Öffnen der Abo-Verwaltung');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  const tierLabels = {
    monthly: 'Monatlich',
    yearly: 'Jährlich',
  };

  return (
    <div className="card-base divide-y divide-border">
      {/* Subscription Status */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              isSubscribed 
                ? "bg-gradient-to-br from-amber-400 to-orange-500" 
                : "bg-muted"
            )}>
              <Crown className={cn(
                "h-5 w-5",
                isSubscribed ? "text-white" : "text-muted-foreground"
              )} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">2Go Plus</p>
                {isSubscribed && !isTrial && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs">
                    Aktiv
                  </Badge>
                )}
                {isTrial && (
                  <Badge variant="outline" className="border-amber-500 text-amber-600 text-xs">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Testphase
                  </Badge>
                )}
                {!isSubscribed && !isTrial && (
                  <Badge variant="secondary" className="text-xs">
                    Nicht aktiv
                  </Badge>
                )}
              </div>
              
              {isSubscribed && !isTrial && tier && (
                <p className="text-sm text-muted-foreground">
                  {tierLabels[tier] || tier} • 
                  {subscriptionEnd && (
                    <> nächste Verlängerung am {format(subscriptionEnd, 'dd. MMMM yyyy', { locale: de })}</>
                  )}
                </p>
              )}
              
              {isTrial && trialDaysRemaining && (
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  Noch {trialDaysRemaining} Tage kostenlos testen
                </p>
              )}
              
              {!isSubscribed && !isTrial && (
                <p className="text-sm text-muted-foreground">
                  Schalte Premium-Rewards frei
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Features for subscribers */}
        {isSubscribed && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Deine Vorteile
            </p>
            <div className="flex flex-wrap gap-2">
              {['CHF-Rabatte', '%-Rabatte', '2für1 Angebote'].map((feature) => (
                <div 
                  key={feature}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-xs"
                >
                  <Check className="h-3 w-3" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4">
        {isSubscribed && !isTrial ? (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleManageSubscription}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ExternalLink className="h-4 w-4 mr-2" />
            )}
            Abo verwalten
          </Button>
        ) : isTrial ? (
          <div className="space-y-2">
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              onClick={() => setShowUpgradeSheet(true)}
            >
              <Crown className="h-4 w-4 mr-2" />
              Jetzt 2Go Plus sichern
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Nach der Testphase ab CHF 4.90/Monat
            </p>
          </div>
        ) : (
          <Button
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            onClick={() => setShowUpgradeSheet(true)}
          >
            <Crown className="h-4 w-4 mr-2" />
            2Go Plus abonnieren
          </Button>
        )}
      </div>

      <PlusUpgradeSheet 
        open={showUpgradeSheet} 
        onOpenChange={setShowUpgradeSheet}
        trigger="settings"
      />
    </div>
  );
}
