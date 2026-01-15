import { motion, AnimatePresence } from 'framer-motion';
import { Pause } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';
import { hapticToggle } from '@/lib/haptics';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { useAuthSafe } from '@/contexts/AuthContext';

interface MiniPlayerBarProps {
  onExpand: () => void;
}

function Equalizer({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end gap-[2px] h-4", className)}>
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-1" />
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-2" />
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-3" />
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-4" />
    </div>
  );
}

// Tier thresholds in seconds (must match DB tiers)
const TIERS = [
  { minSeconds: 300, reward: 1 },   // 5 min
  { minSeconds: 900, reward: 2 },   // 15 min
  { minSeconds: 1800, reward: 3 },  // 30 min
  { minSeconds: 3600, reward: 5 },  // 60 min
];

interface SessionProgress {
  elapsed: number;
  earnedTaler: number;
  pendingTaler: number;
  progress: number;
  targetSeconds: number;
  isMaxTier: boolean;
  secondsToNextTier: number;
  justReachedTier: boolean;
}

function useSessionProgress(): SessionProgress {
  const { isPlaying, sessionStartTime } = useRadioStore();
  const [elapsed, setElapsed] = useState(0);
  const [lastTierIndex, setLastTierIndex] = useState(-1);
  const [justReachedTier, setJustReachedTier] = useState(false);
  
  useEffect(() => {
    if (!isPlaying || !sessionStartTime) {
      setElapsed(0);
      setLastTierIndex(-1);
      return;
    }
    
    // Calculate initial elapsed time
    const startMs = sessionStartTime.getTime();
    setElapsed(Math.floor((Date.now() - startMs) / 1000));
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, sessionStartTime]);
  
  // Find current tier and next tier
  const currentTierIndex = TIERS.findIndex((tier, i) => {
    const nextTier = TIERS[i + 1];
    return elapsed >= tier.minSeconds && (!nextTier || elapsed < nextTier.minSeconds);
  });
  
  // Detect tier change for animation
  useEffect(() => {
    if (currentTierIndex > lastTierIndex && lastTierIndex >= -1 && elapsed > 0) {
      setJustReachedTier(true);
      const timer = setTimeout(() => setJustReachedTier(false), 2000);
      setLastTierIndex(currentTierIndex);
      return () => clearTimeout(timer);
    }
    if (currentTierIndex !== lastTierIndex) {
      setLastTierIndex(currentTierIndex);
    }
  }, [currentTierIndex, lastTierIndex, elapsed]);
  
  const earnedTaler = currentTierIndex >= 0 ? TIERS[currentTierIndex].reward : 0;
  
  // Progress to next tier
  const nextTierIndex = currentTierIndex + 1;
  const nextTier = TIERS[nextTierIndex];
  const currentTier = currentTierIndex >= 0 ? TIERS[currentTierIndex] : null;
  
  let progress = 0;
  let targetSeconds = TIERS[0].minSeconds;
  let secondsToNextTier = 0;
  
  if (nextTier && currentTier) {
    // Progress between current and next tier
    const rangeStart = currentTier.minSeconds;
    const rangeEnd = nextTier.minSeconds;
    progress = ((elapsed - rangeStart) / (rangeEnd - rangeStart)) * 100;
    targetSeconds = rangeEnd;
    secondsToNextTier = rangeEnd - elapsed;
  } else if (!currentTier) {
    // Progress to first tier
    progress = (elapsed / TIERS[0].minSeconds) * 100;
    targetSeconds = TIERS[0].minSeconds;
    secondsToNextTier = TIERS[0].minSeconds - elapsed;
  } else {
    // Max tier reached
    progress = 100;
    targetSeconds = currentTier.minSeconds;
    secondsToNextTier = 0;
  }
  
  const pendingTaler = nextTier?.reward || (earnedTaler === 0 ? TIERS[0].reward : 0);
  
  return {
    elapsed,
    earnedTaler,
    pendingTaler,
    progress: Math.min(100, progress),
    targetSeconds,
    isMaxTier: !nextTier && currentTierIndex >= 0,
    secondsToNextTier: Math.max(0, secondsToNextTier),
    justReachedTier,
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatTimeToTier(seconds: number): string {
  if (seconds <= 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) return `${mins}m`;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MiniPlayerBar({ onExpand }: MiniPlayerBarProps) {
  const { isPlaying, nowPlaying, togglePlay, isLoading } = useRadioStore();
  const { elapsed, earnedTaler, pendingTaler, progress, isMaxTier, secondsToNextTier, justReachedTier } = useSessionProgress();
  const authContext = useAuthSafe();
  const currentBalance = authContext?.balance?.taler_balance ?? 0;
  
  // Determine current tier index for dot indicators
  const currentTierIndex = TIERS.findIndex((tier, i) => {
    const nextTier = TIERS[i + 1];
    return elapsed >= tier.minSeconds && (!nextTier || elapsed < nextTier.minSeconds);
  });
  
  // Check if we're close to next reward (glow effect)
  const isAlmostThere = secondsToNextTier > 0 && secondsToNextTier <= 10;
  
  const handleTogglePlay = () => {
    hapticToggle();
    togglePlay();
  };
  
  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-[72px] left-0 right-0 z-40 px-3"
        >
          <div className="mx-auto max-w-lg relative">
            {/* Glow effect when almost at next tier */}
            <AnimatePresence>
              {isAlmostThere && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute -inset-1 bg-accent/30 rounded-3xl blur-lg"
                />
              )}
            </AnimatePresence>
            
            <div 
              className={cn(
                "relative rounded-2xl bg-secondary shadow-xl cursor-pointer overflow-hidden transition-all duration-300",
                justReachedTier && "ring-2 ring-accent ring-offset-2 ring-offset-background",
                isAlmostThere ? "shadow-accent/50 shadow-2xl" : "shadow-secondary/30"
              )}
              onClick={onExpand}
            >
              {/* Tier dots indicator at very top */}
              <div className="absolute top-0 left-0 right-0 flex items-center justify-center gap-1.5 py-1 bg-black/20">
                {TIERS.map((tier, index) => {
                  const isReached = elapsed >= tier.minSeconds;
                  const isNext = index === currentTierIndex + 1 || (currentTierIndex === -1 && index === 0);
                  
                  return (
                    <motion.div
                      key={tier.minSeconds}
                      className={cn(
                        "rounded-full transition-all duration-300",
                        isReached 
                          ? "w-2.5 h-2.5 bg-accent" 
                          : isNext 
                            ? "w-2 h-2 bg-accent/50" 
                            : "w-1.5 h-1.5 bg-white/20"
                      )}
                      animate={isNext && secondsToNextTier <= 30 ? {
                        scale: [1, 1.3, 1],
                      } : {}}
                      transition={{
                        duration: 0.8,
                        repeat: isNext && secondsToNextTier <= 30 ? Infinity : 0,
                        repeatType: "reverse"
                      }}
                    />
                  );
                })}
              </div>
              
              <div className="flex items-center gap-3 p-2 pt-4">
                {/* Album Art or Equalizer */}
                <div className={cn(
                  "h-12 w-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 transition-all",
                  justReachedTier && "animate-pulse"
                )}>
                  {nowPlaying?.artworkUrl ? (
                    <img 
                      src={nowPlaying.artworkUrl} 
                      alt={nowPlaying.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Equalizer />
                  )}
                </div>
                
                {/* Song Info + Session Progress */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-secondary-foreground truncate">
                    {nowPlaying?.title || 'Radio 2Go'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-secondary-foreground/60">
                    {/* Current Balance */}
                    <div className="flex items-center gap-1">
                      <TalerIcon className="h-3 w-3 text-accent" />
                      <span className="text-accent font-bold">{currentBalance}</span>
                      {earnedTaler > 0 && !justReachedTier && (
                        <span className="text-accent/70 font-medium">(+{earnedTaler})</span>
                      )}
                      {justReachedTier && (
                        <motion.span 
                          className="text-accent font-bold"
                          initial={{ scale: 0.8 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5 }}
                        >
                          (+{earnedTaler} 🎉)
                        </motion.span>
                      )}
                    </div>
                    
                    {/* Countdown to next tier - prominent display */}
                    {!justReachedTier && secondsToNextTier > 0 && (
                      <>
                        <span className="text-secondary-foreground/30">•</span>
                        <motion.div 
                          className={cn(
                            "flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors",
                            secondsToNextTier <= 30 
                              ? "bg-accent/20 text-accent font-semibold" 
                              : "text-secondary-foreground/60"
                          )}
                          animate={secondsToNextTier <= 30 ? { 
                            scale: [1, 1.03, 1],
                          } : {}}
                          transition={{ 
                            duration: 0.6, 
                            repeat: secondsToNextTier <= 30 ? Infinity : 0,
                            repeatType: "reverse"
                          }}
                        >
                          <span className={cn(
                            "tabular-nums",
                            secondsToNextTier <= 30 && "font-bold"
                          )}>
                            {formatTimeToTier(secondsToNextTier)}
                          </span>
                          <span className="text-[10px]">→ +{pendingTaler}</span>
                          {secondsToNextTier <= 30 && (
                            <span className="text-[10px]">🔥</span>
                          )}
                        </motion.div>
                      </>
                    )}
                    
                    {/* Max tier indicator */}
                    {isMaxTier && !justReachedTier && (
                      <>
                        <span className="text-secondary-foreground/30">•</span>
                        <span className="text-accent text-[10px] font-semibold">MAX 🎉</span>
                      </>
                    )}
                  </div>
                </div>
                
                {/* Play/Pause Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePlay();
                  }}
                  disabled={isLoading}
                  className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                    "bg-accent text-accent-foreground"
                  )}
                  aria-label={isPlaying ? 'Pause' : 'Abspielen'}
                >
                  {isLoading ? (
                    <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
