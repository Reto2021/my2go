import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface SubscriptionState {
  isLoading: boolean;
  isSubscribed: boolean;
  isTrial: boolean;
  status: 'free' | 'trial' | 'active' | 'cancelled' | 'expired';
  tier: 'monthly' | 'yearly' | null;
  subscriptionEnd: Date | null;
  trialDaysRemaining: number | null;
}

export function useSubscription() {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    isTrial: false,
    status: 'free',
    tier: null,
    subscriptionEnd: null,
    trialDaysRemaining: null,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setSubscription({
        isLoading: false,
        isSubscribed: false,
        isTrial: false,
        status: 'free',
        tier: null,
        subscriptionEnd: null,
        trialDaysRemaining: null,
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        setSubscription(prev => ({ ...prev, isLoading: false }));
        return;
      }

      setSubscription({
        isLoading: false,
        isSubscribed: data.subscribed || data.status === 'trial',
        isTrial: data.is_trial || false,
        status: data.status || 'free',
        tier: data.subscription_tier || null,
        subscriptionEnd: data.subscription_end ? new Date(data.subscription_end) : null,
        trialDaysRemaining: data.trial_days_remaining || null,
      });
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscription(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  // Refresh every 60 seconds
  useEffect(() => {
    if (!user) return;
    
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [user, checkSubscription]);

  const createCheckout = async (tier: 'monthly' | 'yearly') => {
    try {
      const { data, error } = await supabase.functions.invoke('create-plus-checkout', {
        body: { tier },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      throw error;
    }
  };

  const openCustomerPortal = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      throw error;
    }
  };

  return {
    ...subscription,
    checkSubscription,
    createCheckout,
    openCustomerPortal,
  };
}

// Premium reward types that require subscription
export const PREMIUM_REWARD_TYPES = ['fixed_discount', 'percent_discount', 'two_for_one'];

export function isPremiumReward(rewardType: string): boolean {
  return PREMIUM_REWARD_TYPES.includes(rewardType);
}
