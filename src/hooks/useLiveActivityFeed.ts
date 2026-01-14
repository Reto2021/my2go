import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ActivityItem {
  id: string;
  type: 'taler_earned' | 'redemption' | 'badge' | 'streak' | 'referral' | 'milestone' | 'streak_start';
  message: string;
  icon: string;
  timestamp: Date;
  amount?: number;
}

const ACTIVITY_MESSAGES = {
  taler_earned: [
    'Ein Hörer hat gerade Taler verdient 🪙',
    'Jemand sammelt fleissig Taler 🎧',
    'Radio hören lohnt sich! 🪙',
  ],
  redemption: [
    // Will be replaced with partner-specific messages
    'Ein Gutschein wurde gerade eingelöst 🎁',
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
  streak_start: [
    'Ein neuer Streak wurde gestartet 🚀',
    'Jemand beginnt seine Treue-Serie 💫',
    'Ein Hörer startet durch! 🌟',
  ],
  referral: [
    'Ein neuer Hörer wurde eingeladen 👋',
    'Die Community wächst! 🚀',
    'Freunde werben Freunde 💜',
  ],
  milestone: [
    'Ein Taler-Meilenstein wurde erreicht 🎯',
    'Jemand hat ein neues Level erreicht 📈',
    'Ein Hörer feiert seinen Erfolg! 🎊',
  ],
};

const ICONS = {
  taler_earned: '🪙',
  redemption: '🎁',
  badge: '🏆',
  streak: '🔥',
  streak_start: '🚀',
  referral: '👋',
  milestone: '🎯',
};

// Taler milestones to celebrate
const TALER_MILESTONES = [100, 250, 500, 1000, 2500, 5000, 10000];

function getRandomMessage(type: ActivityItem['type']): string {
  const messages = ACTIVITY_MESSAGES[type];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getMilestoneMessage(amount: number): string {
  return `${amount.toLocaleString('de-DE')} Taler wurden gerade erreicht! 🎯`;
}

function getRedemptionMessage(partnerName?: string): string {
  if (partnerName) {
    const templates = [
      `Einlösung bei ${partnerName} 🎁`,
      `Gutschein bei ${partnerName} genutzt ☕`,
      `Jemand spart bei ${partnerName} 🛍️`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  return 'Ein Gutschein wurde gerade eingelöst 🎁';
}

function getStreakMessage(days: number): string {
  if (days === 1) return 'Ein neuer Streak wurde gestartet! 🚀';
  if (days === 7) return '7-Tage Streak! Eine Woche am Ball 🔥';
  if (days === 14) return '14-Tage Streak! Zwei Wochen stark 💪';
  if (days === 30) return '30-Tage Streak! Ein ganzer Monat! 🏆';
  if (days >= 100) return `${days}-Tage Streak! Unglaublich! 👑`;
  return `${days}-Tage Streak geht weiter 🔥`;
}

// Sample partner names for mock activities
const SAMPLE_PARTNERS = [
  'Café Müller', 'Bäckerei Schmid', 'Pizzeria Roma', 'Restaurant Sonne',
  'Blumen Hofer', 'Coiffeur Style', 'Fitness Plus', 'Buchhandlung Meier'
];

function createMockActivity(): ActivityItem {
  const types: ActivityItem['type'][] = ['taler_earned', 'redemption', 'badge', 'streak', 'referral', 'milestone', 'streak_start'];
  const weights = [35, 20, 12, 12, 5, 8, 8]; // Weighted probability
  
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

  // Special handling for milestone type
  if (selectedType === 'milestone') {
    const milestone = TALER_MILESTONES[Math.floor(Math.random() * TALER_MILESTONES.length)];
    return {
      id: `mock-${Date.now()}-${Math.random()}`,
      type: 'milestone',
      message: getMilestoneMessage(milestone),
      icon: '🎯',
      timestamp: new Date(),
      amount: milestone,
    };
  }

  // Special handling for streak type
  if (selectedType === 'streak') {
    const days = [3, 5, 7, 10, 14, 21, 30][Math.floor(Math.random() * 7)];
    return {
      id: `mock-${Date.now()}-${Math.random()}`,
      type: 'streak',
      message: getStreakMessage(days),
      icon: '🔥',
      timestamp: new Date(),
      amount: days,
    };
  }

  // Special handling for redemption - use partner names
  if (selectedType === 'redemption') {
    const partnerName = SAMPLE_PARTNERS[Math.floor(Math.random() * SAMPLE_PARTNERS.length)];
    return {
      id: `mock-${Date.now()}-${Math.random()}`,
      type: 'redemption',
      message: getRedemptionMessage(partnerName),
      icon: '🎁',
      timestamp: new Date(),
    };
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

    // Listen to real transactions (including Taler milestones)
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
            // Check if this might be a milestone (large round numbers)
            const isMilestone = TALER_MILESTONES.some(m => tx.amount >= m && tx.amount < m + 50);
            
            if (isMilestone && Math.random() < 0.3) {
              const nearestMilestone = TALER_MILESTONES.reduce((prev, curr) => 
                Math.abs(curr - tx.amount) < Math.abs(prev - tx.amount) ? curr : prev
              );
              addActivity({
                id: `milestone-${Date.now()}`,
                type: 'milestone',
                message: getMilestoneMessage(nearestMilestone),
                icon: '🎯',
                timestamp: new Date(),
                amount: nearestMilestone,
              });
            } else {
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
        }
      )
      .subscribe();

    // Listen to redemptions with partner name lookup
    const redemptionChannel = supabase
      .channel('activity-redemptions')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'redemptions',
        },
        async (payload) => {
          const redemption = payload.new as { status: string; partner_id: string };
          if (redemption.status === 'used') {
            // Try to get partner name
            let partnerName: string | undefined;
            try {
              const { data } = await supabase
                .rpc('get_partner_public_info', { partner_id: redemption.partner_id });
              if (data && data[0]) {
                partnerName = data[0].name;
              }
            } catch {
              // Ignore errors, just use generic message
            }
            
            addActivity({
              id: `red-${Date.now()}`,
              type: 'redemption',
              message: getRedemptionMessage(partnerName),
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

    // Listen to profile updates for streak changes
    const profileChannel = supabase
      .channel('activity-profiles')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const oldProfile = payload.old as { current_streak?: number };
          const newProfile = payload.new as { current_streak?: number };
          
          const oldStreak = oldProfile.current_streak || 0;
          const newStreak = newProfile.current_streak || 0;
          
          // New streak started (went from 0 to 1)
          if (oldStreak === 0 && newStreak === 1) {
            addActivity({
              id: `streak-start-${Date.now()}`,
              type: 'streak_start',
              message: getRandomMessage('streak_start'),
              icon: '🚀',
              timestamp: new Date(),
            });
          }
          // Streak milestone reached
          else if (newStreak > oldStreak && [7, 14, 30, 50, 100].includes(newStreak)) {
            addActivity({
              id: `streak-${Date.now()}`,
              type: 'streak',
              message: getStreakMessage(newStreak),
              icon: '🔥',
              timestamp: new Date(),
              amount: newStreak,
            });
          }
        }
      )
      .subscribe();

    // Listen to referrals
    const referralChannel = supabase
      .channel('activity-referrals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'referrals',
        },
        () => {
          addActivity({
            id: `referral-${Date.now()}`,
            type: 'referral',
            message: getRandomMessage('referral'),
            icon: '👋',
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
      profileChannel.unsubscribe();
      referralChannel.unsubscribe();
      clearInterval(simulationInterval);
    };
  }, [addActivity, maxItems]);

  return { activities, isConnected };
}
