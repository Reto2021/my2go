import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const GUEST_REWARDS_KEY = 'guest_taler_rewards';

interface GuestTier {
  name: string;
  reward: number;
  duration: number; // seconds required
}

// Mirror the listening tiers from the database
const GUEST_TIERS: GuestTier[] = [
  { name: 'Bronze', reward: 5, duration: 300 },      // 5 min
  { name: 'Silber', reward: 10, duration: 600 },     // 10 min
  { name: 'Gold', reward: 20, duration: 900 },       // 15 min
  { name: 'Platin', reward: 35, duration: 1800 },    // 30 min
  { name: 'Diamant', reward: 60, duration: 3600 },   // 60 min
];

interface GuestRewardsState {
  // Accumulated rewards during guest session
  totalTalerEarned: number;
  currentSessionDuration: number;
  currentTierIndex: number;
  sessionStartTime: number | null;
  hasShownSignupPrompt: boolean;
  hasEverEarnedTaler: boolean;
  celebratedTiers: string[];
  
  // Actions
  startGuestSession: () => void;
  updateSessionDuration: () => { newTier: GuestTier | null; totalEarned: number };
  endGuestSession: () => { duration: number; earned: number };
  markSignupPromptShown: () => void;
  celebrateTier: (tierName: string) => void;
  getCurrentTier: () => GuestTier | null;
  getNextTier: () => GuestTier | null;
  clearGuestData: () => void;
}

export const useGuestRewardsStore = create<GuestRewardsState>()(
  persist(
    (set, get) => ({
      totalTalerEarned: 0,
      currentSessionDuration: 0,
      currentTierIndex: -1,
      sessionStartTime: null,
      hasShownSignupPrompt: false,
      hasEverEarnedTaler: false,
      celebratedTiers: [],

      startGuestSession: () => {
        const { sessionStartTime } = get();
        if (!sessionStartTime) {
          set({ sessionStartTime: Date.now() });
        }
      },

      updateSessionDuration: () => {
        const { sessionStartTime, currentTierIndex, celebratedTiers, totalTalerEarned } = get();
        
        if (!sessionStartTime) {
          return { newTier: null, totalEarned: totalTalerEarned };
        }
        
        const duration = Math.floor((Date.now() - sessionStartTime) / 1000);
        set({ currentSessionDuration: duration });
        
        // Check if we've reached a new tier
        let newTierIndex = -1;
        for (let i = GUEST_TIERS.length - 1; i >= 0; i--) {
          if (duration >= GUEST_TIERS[i].duration) {
            newTierIndex = i;
            break;
          }
        }
        
        // If we've reached a new tier that we haven't celebrated yet
        if (newTierIndex > currentTierIndex) {
          const newTier = GUEST_TIERS[newTierIndex];
          const alreadyCelebrated = celebratedTiers.includes(newTier.name);
          
          set({ 
            currentTierIndex: newTierIndex,
            totalTalerEarned: newTier.reward,
            hasEverEarnedTaler: true,
          });
          
          if (!alreadyCelebrated) {
            return { newTier, totalEarned: newTier.reward };
          }
        }
        
        return { newTier: null, totalEarned: get().totalTalerEarned };
      },

      endGuestSession: () => {
        const { currentSessionDuration, totalTalerEarned } = get();
        set({ 
          sessionStartTime: null,
          currentSessionDuration: 0,
        });
        return { duration: currentSessionDuration, earned: totalTalerEarned };
      },

      markSignupPromptShown: () => {
        set({ hasShownSignupPrompt: true });
      },

      celebrateTier: (tierName: string) => {
        const { celebratedTiers } = get();
        if (!celebratedTiers.includes(tierName)) {
          set({ celebratedTiers: [...celebratedTiers, tierName] });
        }
      },

      getCurrentTier: () => {
        const { currentTierIndex } = get();
        return currentTierIndex >= 0 ? GUEST_TIERS[currentTierIndex] : null;
      },

      getNextTier: () => {
        const { currentTierIndex } = get();
        const nextIndex = currentTierIndex + 1;
        return nextIndex < GUEST_TIERS.length ? GUEST_TIERS[nextIndex] : null;
      },

      clearGuestData: () => {
        set({
          totalTalerEarned: 0,
          currentSessionDuration: 0,
          currentTierIndex: -1,
          sessionStartTime: null,
          hasShownSignupPrompt: false,
          celebratedTiers: [],
          // Keep hasEverEarnedTaler for first-time celebration logic
        });
      },
    }),
    {
      name: GUEST_REWARDS_KEY,
      partialize: (state) => ({
        totalTalerEarned: state.totalTalerEarned,
        hasShownSignupPrompt: state.hasShownSignupPrompt,
        hasEverEarnedTaler: state.hasEverEarnedTaler,
        celebratedTiers: state.celebratedTiers,
      }),
    }
  )
);

// Helper to check if signup prompt should be shown (after 5 min of listening)
export const SIGNUP_PROMPT_THRESHOLD_SECONDS = 300; // 5 minutes

export function shouldShowSignupPrompt(duration: number, hasShownPrompt: boolean): boolean {
  return duration >= SIGNUP_PROMPT_THRESHOLD_SECONDS && !hasShownPrompt;
}
