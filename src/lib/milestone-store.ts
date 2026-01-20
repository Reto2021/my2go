import { create } from 'zustand';

interface MilestoneData {
  type: 'taler' | 'redemption' | 'streak' | 'leaderboard';
  value: number;
  title: string;
  description: string;
  icon?: string;
}

interface MilestoneState {
  pendingMilestone: MilestoneData | null;
  triggerMilestone: (milestone: MilestoneData) => void;
  dismissMilestone: () => void;
}

export const useMilestoneStore = create<MilestoneState>((set) => ({
  pendingMilestone: null,
  
  triggerMilestone: (milestone) => set({ pendingMilestone: milestone }),
  
  dismissMilestone: () => set({ pendingMilestone: null }),
}));

// Predefined milestones to check
export const MILESTONES = {
  taler: [100, 250, 500, 1000, 2500, 5000],
  redemption: [1, 5, 10, 25, 50],
  streak: [7, 14, 30, 60, 100],
  leaderboard: [1, 2, 3], // Top 3
};

// Helper to get milestone data
export function getMilestoneData(type: keyof typeof MILESTONES, value: number): MilestoneData {
  switch (type) {
    case 'taler':
      return {
        type: 'taler',
        value,
        title: `${value} Taler erreicht!`,
        description: 'Du bist auf dem besten Weg zum Taler-Profi!',
        icon: '🪙',
      };
    case 'redemption':
      return {
        type: 'redemption',
        value,
        title: `${value} Einlösungen!`,
        description: value === 1 
          ? 'Deine erste Einlösung – der Anfang einer Reise!'
          : 'Du geniesst die Vorteile in vollen Zügen!',
        icon: '🎁',
      };
    case 'streak':
      return {
        type: 'streak',
        value,
        title: `${value}-Tage Streak!`,
        description: 'Deine Treue zahlt sich aus!',
        icon: '🔥',
      };
    case 'leaderboard':
      const icons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
      const titles: Record<number, string> = { 
        1: 'Du bist #1!', 
        2: 'Silber-Rang!', 
        3: 'Bronze erreicht!' 
      };
      return {
        type: 'leaderboard',
        value,
        title: titles[value] || `Top ${value}!`,
        description: 'Du gehörst zur Elite der Taler-Sammler!',
        icon: icons[value] || '🏆',
      };
  }
}

// Check if a milestone was crossed
export function checkMilestoneCrossed(
  type: keyof typeof MILESTONES,
  currentValue: number,
  previousValue: number
): number | null {
  const thresholds = MILESTONES[type];
  
  for (const threshold of thresholds) {
    if (previousValue < threshold && currentValue >= threshold) {
      return threshold;
    }
  }
  return null;
}
