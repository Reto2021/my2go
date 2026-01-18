import { useQuery } from '@tanstack/react-query';
import { Crown, Calendar, Coins, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { differenceInDays, format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TalerPlusRedemption {
  id: string;
  created_at: string;
  amount: number;
  description: string | null;
}

interface SubscriptionInfo {
  subscription_status: string | null;
  subscription_tier: string | null;
  subscription_ends_at: string | null;
}

export function TalerPlusStats() {
  const { user } = useAuth();

  // Fetch subscription info directly from profiles table
  const { data: subscriptionInfo } = useQuery({
    queryKey: ['subscription-info', user?.id],
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
  });

  // Fetch Taler-Plus redemption transactions
  const { data: redemptions, isLoading } = useQuery({
    queryKey: ['taler-plus-redemptions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('id, created_at, amount, description')
        .eq('user_id', user.id)
        .eq('source', 'system')
        .eq('type', 'spend')
        .ilike('description', '%Plus%')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as TalerPlusRedemption[];
    },
    enabled: !!user?.id,
  });

  // Calculate stats
  const totalRedemptions = redemptions?.length || 0;
  const totalTalerSpent = redemptions?.reduce((sum, r) => sum + Math.abs(r.amount), 0) || 0;
  const totalDaysRedeemed = totalRedemptions * 30; // Each redemption = 30 days

  // Check subscription status
  const isSubscribed = subscriptionInfo?.subscription_status === 'active' || subscriptionInfo?.subscription_status === 'trialing';
  const subscriptionEndDate = subscriptionInfo?.subscription_ends_at ? new Date(subscriptionInfo.subscription_ends_at) : null;
  const daysRemaining = subscriptionEndDate ? differenceInDays(subscriptionEndDate, new Date()) : 0;
  const isTalerSubscription = subscriptionInfo?.subscription_tier === 'taler';

  if (isLoading) {
    return (
      <div className="card-base p-4 space-y-4">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    );
  }

  // Don't show if user has never used Taler-Plus and isn't subscribed via Taler
  if (totalRedemptions === 0 && !isTalerSubscription) {
    return null;
  }

  return (
    <section className="animate-in">
      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
        <Crown className="h-4 w-4 text-amber-500" />
        Taler-Plus Statistik
      </h2>

      <div className="card-base p-4 space-y-4">
        {/* Current Status Banner */}
        {isSubscribed && isTalerSubscription && (
          <div className="p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <span className="font-medium text-foreground">2Go Plus aktiv</span>
              </div>
              {daysRemaining > 0 && (
                <span className="text-sm text-amber-600 font-medium">
                  noch {daysRemaining} Tage
                </span>
              )}
            </div>
            {subscriptionEndDate && (
              <p className="text-sm text-muted-foreground mt-1">
                Läuft ab am {format(subscriptionEndDate, 'dd. MMMM yyyy', { locale: de })}
              </p>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Calendar className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-foreground">{totalDaysRedeemed}</div>
            <p className="text-xs text-muted-foreground">Tage eingelöst</p>
          </div>

          <div className="p-3 rounded-xl bg-muted/50 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
              <Coins className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-foreground">{totalTalerSpent}</div>
            <p className="text-xs text-muted-foreground">Taler ausgegeben</p>
          </div>
        </div>

        {/* Redemption Count */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Einlösungen gesamt</span>
          </div>
          <span className="font-semibold text-foreground">{totalRedemptions}×</span>
        </div>

        {/* Recent Redemptions */}
        {redemptions && redemptions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Letzte Einlösungen
            </p>
            <div className="space-y-2">
              {redemptions.slice(0, 3).map((redemption) => (
                <div
                  key={redemption.id}
                  className="flex items-center justify-between text-sm py-2 border-b border-border/50 last:border-0"
                >
                  <span className="text-muted-foreground">
                    {format(new Date(redemption.created_at), 'dd. MMM yyyy', { locale: de })}
                  </span>
                  <span className="font-medium text-foreground">
                    -{Math.abs(redemption.amount)} Taler
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
