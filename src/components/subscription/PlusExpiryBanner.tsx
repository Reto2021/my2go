import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Crown, X, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { PlusUpgradeSheet } from './PlusUpgradeSheet';

interface SubscriptionInfo {
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_ends_at: string | null;
}

export function PlusExpiryBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  // Fetch subscription info
  const { data: subscriptionInfo } = useQuery({
    queryKey: ['subscription-expiry', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('subscription_status, subscription_tier, subscription_ends_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data as SubscriptionInfo;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if subscription is expiring soon (within 5 days)
  const isActive = subscriptionInfo?.subscription_status === 'active';
  const endsAt = subscriptionInfo?.subscription_ends_at ? new Date(subscriptionInfo.subscription_ends_at) : null;
  const daysRemaining = endsAt ? differenceInDays(endsAt, new Date()) : null;
  const isExpiringSoon = isActive && daysRemaining !== null && daysRemaining >= 0 && daysRemaining <= 5;

  // Don't show if dismissed, not logged in, or not expiring soon
  if (dismissed || !user || !isExpiringSoon) {
    return null;
  }

  const tierName = subscriptionInfo?.subscription_tier === 'taler' ? 'Taler-Plus' : '2Go Plus';
  
  // Urgency styling based on days remaining
  const getUrgencyStyle = () => {
    if (daysRemaining === 0) return 'bg-destructive/10 border-destructive/30 text-destructive';
    if (daysRemaining <= 2) return 'bg-orange-500/10 border-orange-500/30 text-orange-600';
    return 'bg-amber-500/10 border-amber-500/30 text-amber-600';
  };

  const getMessage = () => {
    if (daysRemaining === 0) return 'Dein Abo läuft heute ab!';
    if (daysRemaining === 1) return 'Dein Abo läuft morgen ab!';
    return `Dein Abo läuft in ${daysRemaining} Tagen ab`;
  };

  return (
    <>
      <div 
        className={cn(
          "relative p-3 rounded-xl border animate-in slide-in-from-top-2",
          getUrgencyStyle()
        )}
      >
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
          aria-label="Schliessen"
        >
          <X className="h-4 w-4" />
        </button>
        
        <div 
          className="flex items-center gap-3 cursor-pointer pr-6"
          onClick={() => setShowUpgradeSheet(true)}
        >
          <div className="p-2 rounded-lg bg-background/50">
            <Crown className="h-5 w-5" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm">
              {getMessage()}
            </p>
            <p className="text-xs opacity-80">
              Jetzt {tierName} verlängern und Premium-Vorteile behalten
            </p>
          </div>
          
          <ChevronRight className="h-5 w-5 flex-shrink-0" />
        </div>
      </div>

      <PlusUpgradeSheet 
        open={showUpgradeSheet} 
        onOpenChange={setShowUpgradeSheet} 
      />
    </>
  );
}
