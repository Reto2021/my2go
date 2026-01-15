import { useState, useEffect, useRef } from 'react';
import { useRadioStore, getCelebratedTiers, addCelebratedTier } from '@/lib/radio-store';
import { hapticSuccess } from '@/lib/haptics';

// Tier thresholds in seconds (must match DB tiers)
const TIERS = [
  { minSeconds: 60, reward: 1, name: 'Kurzhörer' },    // 1 min
  { minSeconds: 900, reward: 2, name: 'Stammhörer' },  // 15 min
  { minSeconds: 1800, reward: 3, name: 'Dauerhörer' }, // 30 min
  { minSeconds: 3600, reward: 5, name: 'Superfan' },   // 60 min
];

interface NextTierInfo {
  name: string;
  reward: number;
  secondsRemaining: number;
}

// Play tier sound - moved outside component to avoid hook issues
function playTierSound() {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    
    const playNote = (freq: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + startTime + duration);
      
      oscillator.start(audioContext.currentTime + startTime);
      oscillator.stop(audioContext.currentTime + startTime + duration);
    };
    
    // Play ascending notes (C5, E5, G5, C6) - a happy fanfare
    playNote(523.25, 0, 0.15);     // C5
    playNote(659.25, 0.1, 0.15);   // E5
    playNote(783.99, 0.2, 0.15);   // G5
    playNote(1046.50, 0.3, 0.3);   // C6 (longer)
  } catch (e) {
    console.log('Could not play tier sound:', e);
  }
}

export function useTierReachedNotification() {
  const { isPlaying, sessionStartTime } = useRadioStore();
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentTierReward, setCurrentTierReward] = useState(0);
  const [currentTierName, setCurrentTierName] = useState('');
  const [nextTierInfo, setNextTierInfo] = useState<NextTierInfo | null>(null);
  const lastCheckedTierRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (!isPlaying || !sessionStartTime) {
      lastCheckedTierRef.current = null;
      setNextTierInfo(null);
      return;
    }
    
    const startMs = sessionStartTime.getTime();
    
    const checkTier = () => {
      const elapsed = Math.floor((Date.now() - startMs) / 1000);
      
      // Find current tier index
      let currentTierIndex = -1;
      for (let i = TIERS.length - 1; i >= 0; i--) {
        if (elapsed >= TIERS[i].minSeconds) {
          currentTierIndex = i;
          break;
        }
      }
      
      // Calculate next tier info
      const nextTierIndex = currentTierIndex + 1;
      if (nextTierIndex < TIERS.length) {
        const nextTier = TIERS[nextTierIndex];
        setNextTierInfo({
          name: nextTier.name,
          reward: nextTier.reward,
          secondsRemaining: nextTier.minSeconds - elapsed,
        });
      } else {
        setNextTierInfo(null); // All tiers reached
      }
      
      // Detect tier upgrade - check against sessionStorage to persist across refreshes
      if (currentTierIndex >= 0) {
        const tier = TIERS[currentTierIndex];
        const celebratedTiers = getCelebratedTiers();
        
        // Only celebrate if this tier hasn't been celebrated in this session
        if (!celebratedTiers.includes(tier.name) && lastCheckedTierRef.current !== tier.name) {
          setCurrentTierReward(tier.reward);
          setCurrentTierName(tier.name);
          setShowCelebration(true);
          hapticSuccess();
          playTierSound();
          
          // Mark as celebrated in sessionStorage
          addCelebratedTier(tier.name);
          lastCheckedTierRef.current = tier.name;
          
          // Auto-hide after 4 seconds
          setTimeout(() => setShowCelebration(false), 4000);
        }
      }
    };
    
    // Check every second
    const interval = setInterval(checkTier, 1000);
    checkTier(); // Initial check
    
    return () => clearInterval(interval);
  }, [isPlaying, sessionStartTime]);
  
  const dismissCelebration = () => setShowCelebration(false);
  
  return {
    showCelebration,
    currentTierReward,
    currentTierName,
    nextTierInfo,
    dismissCelebration,
  };
}
