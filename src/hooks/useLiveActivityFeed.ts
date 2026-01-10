import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  type: 'taler_earned' | 'redemption' | 'badge' | 'streak' | 'referral';
  message: string;
  icon: string;
  timestamp: Date;
  amount?: number;
}

const ACTIVITY_MESSAGES = {
  taler_earned: [
    'Ein Hörer hat gerade Taler verdient 🪙',
    'Jemand sammelt fleißig Taler 🎧',
    'Radio hören lohnt sich! 🪙',
  ],
  redemption: [
    'Ein Gutschein wurde gerade eingelöst ☕',
    'Jemand spart bei einem Partner 🎁',
    'Ein Hörer genießt seine Belohnung 🛍️',
  ],
  badge: [
    'Eine neue Auszeichnung wurde erreicht 🏆',
    'Jemand hat ein Badge freigeschaltet 🎖️',
    'Ein Hörer feiert seinen Erfolg 🌟',
  ],
  streak: [
    'Die Treue-Serie geht weiter 🔥',
    'Jemand bleibt am Ball 💪',
    'Ein weiterer Tag, ein weiterer Streak 🎯',
  ],
  referral: [
    'Ein neuer Hörer wurde eingeladen 👋',
    'Die Community wächst! 🚀',
    'Freunde werben Freunde 💜',
  ],
};

const ICONS = {
  taler_earned: '🪙',
  redemption: '🎁',
  badge: '🏆',
  streak: '🔥',
  referral: '👋',
};

function getRandomMessage(type: ActivityItem['type']): string {
  const messages = ACTIVITY_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

function createMockActivity(): ActivityItem {
  const types: ActivityItem['type'][] = ['taler_earned', 'redemption', 'badge', 'streak', 'referral'];
  const weights = [40, 25, 15, 15, 5]; // Weighted probability
  
  let totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  let selectedType: ActivityItem['type'] = 'taler_earned';
  for (let i = 0; i < types.length; i++) {
    if (random < weights[i]) {
      selectedType = types[i];
      break;
    }
    random -= weights[i];
  }

  return {
    id: `mock-${Date.now()}-${Math.random()}`,
    type: selectedType,
    message: getRandomMessage(selectedType),
    icon: ICONS[selectedType],
    timestamp: new Date(),
    amount: selectedType === 'taler_earned' ? Math.floor(Math.random() * 50) + 10 : undefined,
  };
}

export function useLiveActivityFeed(maxItems: number = 5) {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  const addActivity = useCallback((activity: ActivityItem) => {
    setActivities(prev => {
      const newActivities = [activity, ...prev].slice(0, maxItems);
      return newActivities;
    });
  }, [maxItems]);

  useEffect(() => {
    // Initialize with some recent activities
    const initialActivities: ActivityItem[] = [];
    for (let i = 0; i < 3; i++) {
      initialActivities.push({
        ...createMockActivity(),
        timestamp: new Date(Date.now() - i * 30000), // 30 seconds apart
      });
    }
    setActivities(initialActivities);
    setIsConnected(true);

    // Listen to real transactions
    const transactionChannel = supabase
      .channel('activity-transactions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
        },
        (payload) => {
          const tx = payload.new as { type: string; amount: number; source: string };
          if (tx.type === 'earn' && tx.amount > 0) {
            addActivity({
              id: `tx-${Date.now()}`,
              type: 'taler_earned',
              message: `+${tx.amount} Taler wurden gerade verdient 🪙`,
              icon: '🪙',
              timestamp: new Date(),
              amount: tx.amount,
            });
          }
        }
      )
      .subscribe();

    // Listen to redemptions
    const redemptionChannel = supabase
      .channel('activity-redemptions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'redemptions',
        },
        (payload) => {
          const redemption = payload.new as { status: string };
          if (redemption.status === 'used') {
            addActivity({
              id: `red-${Date.now()}`,
              type: 'redemption',
              message: getRandomMessage('redemption'),
              icon: '🎁',
              timestamp: new Date(),
            });
          }
        }
      )
      .subscribe();

    // Listen to badges
    const badgeChannel = supabase
      .channel('activity-badges')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
        },
        () => {
          addActivity({
            id: `badge-${Date.now()}`,
            type: 'badge',
            message: getRandomMessage('badge'),
            icon: '🏆',
            timestamp: new Date(),
          });
        }
      )
      .subscribe();

    // Simulate periodic activity for demo purposes when no real activity
    const simulationInterval = setInterval(() => {
      // Only add mock activity sometimes (30% chance)
      if (Math.random() < 0.3) {
        addActivity(createMockActivity());
      }
    }, 15000); // Every 15 seconds

    return () => {
      transactionChannel.unsubscribe();
      redemptionChannel.unsubscribe();
      badgeChannel.unsubscribe();
      clearInterval(simulationInterval);
    };
  }, [addActivity, maxItems]);

  return { activities, isConnected };
}
