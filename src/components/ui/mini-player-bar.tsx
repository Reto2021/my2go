import { motion, AnimatePresence } from 'framer-motion';
import { Pause } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';
import { hapticToggle } from '@/lib/haptics';
import { TalerIcon } from '@/components/icons/TalerIcon';

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

function useSessionProgress() {
  const { isPlaying, sessionStartTime } = useRadioStore();
  const [elapsed, setElapsed] = useState(0);
  
  useEffect(() => {
    if (!isPlaying || !sessionStartTime) {
      setElapsed(0);
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
  
  const earnedTaler = currentTierIndex >= 0 ? TIERS[currentTierIndex].reward : 0;
  
  // Progress to next tier
  const nextTierIndex = currentTierIndex + 1;
  const nextTier = TIERS[nextTierIndex];
  const currentTier = currentTierIndex >= 0 ? TIERS[currentTierIndex] : null;
  
  let progress = 0;
  let targetSeconds = TIERS[0].minSeconds;
  
  if (nextTier && currentTier) {
    // Progress between current and next tier
    const rangeStart = currentTier.minSeconds;
    const rangeEnd = nextTier.minSeconds;
    progress = ((elapsed - rangeStart) / (rangeEnd - rangeStart)) * 100;
    targetSeconds = rangeEnd;
  } else if (!currentTier) {
    // Progress to first tier
    progress = (elapsed / TIERS[0].minSeconds) * 100;
    targetSeconds = TIERS[0].minSeconds;
  } else {
    // Max tier reached
    progress = 100;
    targetSeconds = currentTier.minSeconds;
  }
  
  const pendingTaler = nextTier?.reward || (earnedTaler === 0 ? TIERS[0].reward : 0);
  
  return {
    elapsed,
    earnedTaler,
    pendingTaler,
    progress: Math.min(100, progress),
    targetSeconds,
    isMaxTier: !nextTier && currentTierIndex >= 0,
  };
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function MiniPlayerBar({ onExpand }: MiniPlayerBarProps) {
  const { isPlaying, nowPlaying, togglePlay, isLoading } = useRadioStore();
  const { elapsed, earnedTaler, pendingTaler, progress, isMaxTier } = useSessionProgress();
  
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
          <div className="mx-auto max-w-lg">
            <div 
              className="relative rounded-2xl bg-secondary shadow-xl shadow-secondary/30 cursor-pointer overflow-hidden"
              onClick={onExpand}
            >
              {/* Progress bar at top */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-secondary-foreground/10">
                <motion.div
                  className={cn(
                    "h-full",
                    isMaxTier ? "bg-accent" : "bg-accent/80"
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
              
              <div className="flex items-center gap-3 p-2 pt-3">
                {/* Album Art or Equalizer */}
                <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
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
                    <span>{formatTime(elapsed)}</span>
                    <span className="text-secondary-foreground/30">•</span>
                    <div className="flex items-center gap-1">
                      {earnedTaler > 0 ? (
                        <>
                          <TalerIcon className="h-3 w-3 text-accent" />
                          <span className="text-accent font-medium">+{earnedTaler}</span>
                        </>
                      ) : (
                        <>
                          <TalerIcon className="h-3 w-3 opacity-50" />
                          <span className="opacity-70">+{pendingTaler} bald</span>
                        </>
                      )}
                    </div>
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
