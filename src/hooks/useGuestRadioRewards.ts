import { useEffect, useRef, useState, useCallback } from 'react';
import { useRadioStore } from '@/lib/radio-store';
import { useGuestRewardsStore, shouldShowSignupPrompt, SIGNUP_PROMPT_THRESHOLD_SECONDS } from '@/lib/guest-rewards-store';
import { triggerTalerAnimation } from '@/components/taler/TalerEarnAnimation';

interface UseGuestRadioRewardsReturn {
  totalEarned: number;
  currentSessionDuration: number;
  shouldShowSignup: boolean;
  hasEverEarnedTaler: boolean;
  showFirstTalerCelebration: boolean;
  firstTalerAmount: number;
  closeFirstTalerCelebration: () => void;
  markSignupShown: () => void;
}

export function useGuestRadioRewards(): UseGuestRadioRewardsReturn {
  const { isPlaying } = useRadioStore();
  const {
    totalTalerEarned,
    currentSessionDuration,
    hasShownSignupPrompt,
    hasEverEarnedTaler,
    startGuestSession,
    updateSessionDuration,
    endGuestSession,
    markSignupPromptShown,
    celebrateTier,
  } = useGuestRewardsStore();
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [shouldShowSignup, setShouldShowSignup] = useState(false);
  const [showFirstTalerCelebration, setShowFirstTalerCelebration] = useState(false);
  const [firstTalerAmount, setFirstTalerAmount] = useState(0);
  const hasTriggeredFirstCelebrationRef = useRef(false);
  
  // Start/stop session based on playback
  useEffect(() => {
    if (isPlaying) {
      startGuestSession();
      
      // Update duration every second
      intervalRef.current = setInterval(() => {
        const { newTier, totalEarned } = updateSessionDuration();
        
        // Check if we should show signup prompt
        const duration = useGuestRewardsStore.getState().currentSessionDuration;
        if (shouldShowSignupPrompt(duration, hasShownSignupPrompt)) {
          setShouldShowSignup(true);
        }
        
        // If a new tier was reached, trigger celebration
        if (newTier) {
          // Trigger Taler animation
          triggerTalerAnimation(newTier.reward, 'radio');
          celebrateTier(newTier.name);
          
          // Show first-time celebration if this is the first ever Taler earned
          const wasFirstTime = !useGuestRewardsStore.getState().hasEverEarnedTaler || 
                               (!hasTriggeredFirstCelebrationRef.current && totalEarned > 0);
          
          if (wasFirstTime && !hasTriggeredFirstCelebrationRef.current) {
            hasTriggeredFirstCelebrationRef.current = true;
            setFirstTalerAmount(newTier.reward);
            setShowFirstTalerCelebration(true);
          }
        }
      }, 1000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      // Stop tracking when not playing
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
  }, [isPlaying, hasShownSignupPrompt, startGuestSession, updateSessionDuration, celebrateTier]);
  
  const markSignupShown = useCallback(() => {
    markSignupPromptShown();
    setShouldShowSignup(false);
  }, [markSignupPromptShown]);
  
  const closeFirstTalerCelebration = useCallback(() => {
    setShowFirstTalerCelebration(false);
  }, []);
  
  return {
    totalEarned: totalTalerEarned,
    currentSessionDuration,
    shouldShowSignup,
    hasEverEarnedTaler,
    showFirstTalerCelebration,
    firstTalerAmount,
    closeFirstTalerCelebration,
    markSignupShown,
  };
}
