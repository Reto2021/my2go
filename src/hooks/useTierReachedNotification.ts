import { useState, useEffect, useRef } from 'react';
import { useRadioStore } from '@/lib/radio-store';
import { hapticSuccess } from '@/lib/haptics';

// Tier thresholds in seconds (must match DB tiers)
const TIERS = [
  { minSeconds: 300, reward: 1 },   // 5 min
  { minSeconds: 900, reward: 2 },   // 15 min
  { minSeconds: 1800, reward: 3 },  // 30 min
  { minSeconds: 3600, reward: 5 },  // 60 min
];

export function useTierReachedNotification() {
  const { isPlaying, sessionStartTime } = useRadioStore();
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentTierReward, setCurrentTierReward] = useState(0);
  const lastTierIndexRef = useRef(-1);
  
  useEffect(() => {
    if (!isPlaying || !sessionStartTime) {
      lastTierIndexRef.current = -1;
      return;
    }
    
    const startMs = sessionStartTime.getTime();
    
    const checkTier = () => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      
      // Find current tier
      const currentTierIndex = TIERS.findIndex((tier, i) => {
        const nextTier = TIERS[i + 1];
        return elapsed >= tier.minSeconds && (!nextTier || elapsed < nextTier.minSeconds);
      });
      
      // Detect tier upgrade
      if (currentTierIndex > lastTierIndexRef.current && lastTierIndexRef.current >= -1) {
        const tier = TIERS[currentTierIndex];
        setCurrentTierReward(tier.reward);
        setShowCelebration(true);
        hapticSuccess();
        
        // Auto-hide after 3 seconds
        setTimeout(() => setShowCelebration(false), 3000);
      }
      
      lastTierIndexRef.current = currentTierIndex;
    };
    
    // Check every second
    const interval = setInterval(checkTier, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, sessionStartTime]);
  
  const dismissCelebration = () => setShowCelebration(false);
  
  return {
    showCelebration,
    currentTierReward,
    dismissCelebration,
  };
}
