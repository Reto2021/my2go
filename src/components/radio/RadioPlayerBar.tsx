import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, animate, PanInfo, AnimatePresence } from "framer-motion";
import { 
  Flame, Play, Pause, Lock, VolumeX, Volume2, Loader2, 
  ChevronRight, Radio, ChevronUp 
} from "lucide-react";
import { useRadioStore } from "@/lib/radio-store";
import { useStreak } from "@/hooks/useStreak";
import { useAuthSafe } from "@/contexts/AuthContext";
import { Confetti } from "@/components/ui/confetti";
import { TalerIcon } from "@/components/icons/TalerIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { hapticToggle } from "@/lib/haptics";

interface RadioPlayerBarProps {
  onExpand: () => void;
  onStreakDetailsOpen?: () => void;
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
  const [lastTierIndex, setLastTierIndex] = useState(-1);
  const [justReachedTier, setJustReachedTier] = useState(false);
  
  useEffect(() => {
    if (!isPlaying || !sessionStartTime) {
      setElapsed(0);
      setLastTierIndex(-1);
      return;
    }
    
    const startMs = sessionStartTime.getTime();
    setElapsed(Math.floor((Date.now() - startMs) / 1000));
    
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startMs) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, sessionStartTime]);
  
  const currentTierIndex = TIERS.findIndex((tier, i) => {
    const nextTier = TIERS[i + 1];
    return elapsed >= tier.minSeconds && (!nextTier || elapsed < nextTier.minSeconds);
  });
  
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
  const nextTierIndex = currentTierIndex + 1;
  const nextTier = TIERS[nextTierIndex];
  const currentTier = currentTierIndex >= 0 ? TIERS[currentTierIndex] : null;
  
  let progress = 0;
  let secondsToNextTier = 0;
  
  if (nextTier && currentTier) {
    const rangeStart = currentTier.minSeconds;
    const rangeEnd = nextTier.minSeconds;
    progress = ((elapsed - rangeStart) / (rangeEnd - rangeStart)) * 100;
    secondsToNextTier = rangeEnd - elapsed;
  } else if (!currentTier) {
    progress = (elapsed / TIERS[0].minSeconds) * 100;
    secondsToNextTier = TIERS[0].minSeconds - elapsed;
  } else {
    progress = 100;
    secondsToNextTier = 0;
  }
  
  const pendingTaler = nextTier?.reward || (earnedTaler === 0 ? TIERS[0].reward : 0);
  
  return {
    elapsed,
    earnedTaler,
    pendingTaler,
    progress: Math.min(100, progress),
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
  const mins = Math.floor(seconds / 60);
  if (mins === 0) return `${seconds}s`;
  return `${mins}m`;
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

export function RadioPlayerBar({ onExpand, onStreakDetailsOpen }: RadioPlayerBarProps) {
  const { isPlaying, togglePlay, toggleMute, isMuted, isLoading: isRadioLoading, nowPlaying } = useRadioStore();
  const { streakStatus, isLoading: isStreakLoading, claimStreak, isClaiming } = useStreak();
  const authContext = useAuthSafe();
  const currentBalance = authContext?.balance?.taler_balance ?? 0;
  
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [sliderProgress, setSliderProgress] = useState(0);
  
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderWidth = useRef(0);
  
  const x = useMotionValue(0);
  
  // Session progress for mini-player
  const { elapsed, earnedTaler, pendingTaler, progress, isMaxTier, secondsToNextTier, justReachedTier } = useSessionProgress();
  
  // Streak data
  const canClaim = streakStatus?.can_claim ?? false;
  const nextBonus = streakStatus?.next_bonus || 5;
  const currentStreak = streakStatus?.current_streak || 0;
  const hasBonusAvailable = canClaim && !hasClaimedToday;
  
  // Calculate slider width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        sliderWidth.current = containerRef.current.offsetWidth - 72;
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);
  
  // Update progress based on x position
  useEffect(() => {
    const unsubscribe = x.on("change", (latest) => {
      if (sliderWidth.current > 0) {
        setSliderProgress(Math.min(1, Math.max(0, latest / sliderWidth.current)));
      }
    });
    return () => unsubscribe();
  }, [x]);
  
  // Cleanup lock timer
  useEffect(() => {
    return () => {
      if (lockTimerRef.current) {
        clearInterval(lockTimerRef.current);
      }
    };
  }, []);
  
  // Update hasClaimedToday
  useEffect(() => {
    if (streakStatus && !streakStatus.can_claim) {
      setHasClaimedToday(true);
    }
  }, [streakStatus]);
  
  // Handle slide complete
  const handleSlideComplete = () => {
    if (isLocked || isClaiming) return;
    
    hapticToggle();
    
    // Always start/ensure radio is playing
    if (!isPlaying && !isRadioLoading) {
      togglePlay();
    }
    
    // Only claim streak bonus if available
    if (canClaim && !hasClaimedToday) {
      claimStreak(undefined, {
        onSuccess: (data) => {
          if (data.success) {
            setShowConfetti(true);
            setHasClaimedToday(true);
            toast.success(`+${data.bonus} Taler erhalten!`, {
              description: `Tag ${data.current_streak} – weiter so!`,
            });
            setTimeout(() => setShowConfetti(false), 3000);
            startLock();
          }
        },
        onError: () => {
          toast.error("Fehler beim Beanspruchen des Bonus");
          animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
          setSliderProgress(0);
        },
      });
    } else {
      toast.success("Radio 2Go läuft!", {
        description: hasClaimedToday ? "Dein Tages-Bonus wurde bereits abgeholt." : undefined,
      });
      animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
      setSliderProgress(0);
    }
  };
  
  // Start 65 second lock
  const startLock = () => {
    setIsLocked(true);
    setLockRemaining(65);
    
    lockTimerRef.current = setInterval(() => {
      setLockRemaining((prev) => {
        if (prev <= 1) {
          if (lockTimerRef.current) {
            clearInterval(lockTimerRef.current);
            lockTimerRef.current = null;
          }
          setIsLocked(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  // Handle toggle play
  const handleTogglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isLocked) {
      toast.warning(`Noch ${lockRemaining}s gesperrt`);
      return;
    }
    hapticToggle();
    togglePlay();
  };
  
  // Handle mute
  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    hapticToggle();
    toggleMute();
  };
  
  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const percentage = info.offset.x / sliderWidth.current;
    
    if (percentage > 0.75) {
      animate(x, sliderWidth.current, { type: "spring", stiffness: 400, damping: 25 });
      handleSlideComplete();
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
      setSliderProgress(0);
    }
  };
  
  // Determine which state to show
  const showMiniPlayer = isPlaying || isLocked;
  
  // Don't render during initial streak loading
  if (isStreakLoading) return null;
  
  return (
    <>
      <Confetti isActive={showConfetti} />
      
      {/* Fixed bar above BottomNav */}
      <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 pointer-events-none">
        {/* Background blur layer */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/95 to-transparent" />
        <div className="relative mx-auto max-w-lg px-3 pointer-events-auto">
          <AnimatePresence mode="wait">
            {showMiniPlayer ? (
              /* ===== STATE 3: Mini Player (Radio Playing) ===== */
              <motion.div
                key="mini-player"
                initial={{ y: 20, opacity: 0, scale: 0.95 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className={cn(
                  "relative rounded-2xl bg-secondary shadow-xl shadow-secondary/30 cursor-pointer overflow-hidden transition-all duration-300 outline-none isolate",
                  justReachedTier && "ring-2 ring-accent"
                )}
                onClick={onExpand}
                tabIndex={-1}
              >
                {/* Progress bar at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-secondary-foreground/10">
                  <motion.div
                    className={cn(
                      "h-full transition-colors",
                      isMaxTier ? "bg-accent" : "bg-accent/80"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
                
                {/* Lock progress bar */}
                {isLocked && (
                  <div className="absolute top-1 left-0 right-0 h-0.5 bg-white/10">
                    <motion.div
                      initial={{ width: "100%" }}
                      animate={{ width: `${(lockRemaining / 65) * 100}%` }}
                      transition={{ duration: 1, ease: "linear" }}
                      className="h-full bg-gradient-to-r from-accent to-amber-400"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-3 p-2.5 pt-3">
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
                      {isLocked ? `Gesperrt – ${lockRemaining}s` : (nowPlaying?.title || 'Radio 2Go')}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-secondary-foreground/60">
                      <span>{formatTime(elapsed)}</span>
                      <span className="text-secondary-foreground/30">•</span>
                      
                      {/* Balance + Session Bonus */}
                      <div className="flex items-center gap-1">
                        <TalerIcon className="h-3.5 w-3.5 text-accent" />
                        <span className="text-accent font-bold">{currentBalance}</span>
                        {justReachedTier ? (
                          <motion.span 
                            className="text-accent font-bold"
                            initial={{ scale: 0.8 }}
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5 }}
                          >
                            (+{earnedTaler} 🎉)
                          </motion.span>
                        ) : earnedTaler > 0 ? (
                          <span className="text-accent/70 font-medium">(+{earnedTaler})</span>
                        ) : secondsToNextTier > 0 ? (
                          <span className="opacity-60">+{pendingTaler} in {formatTimeToTier(secondsToNextTier)}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  
                  {/* Mute Button */}
                  <button
                    onClick={handleToggleMute}
                    className={cn(
                      "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                      isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70"
                    )}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </button>
                  
                  {/* Play/Pause Button */}
                  <button
                    onClick={handleTogglePlay}
                    disabled={isRadioLoading || isLocked}
                    className={cn(
                      "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                      "bg-accent text-accent-foreground",
                      isLocked && "opacity-70"
                    )}
                  >
                    {isRadioLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isLocked ? (
                      <Lock className="h-4 w-4" />
                    ) : (
                      <Pause className="h-4 w-4" />
                    )}
                  </button>
                  
                  {/* Expand indicator */}
                  <ChevronUp className="h-4 w-4 text-secondary-foreground/40 shrink-0" />
                </div>
              </motion.div>
            ) : (
              /* ===== STATE 1 & 2: Slider Mode (Compact) ===== */
              <motion.div
                key="slider"
                initial={{ y: 20, opacity: 0 }}
                animate={{ 
                  y: 0, 
                  opacity: 1,
                  boxShadow: hasBonusAvailable
                    ? [
                        '0 4px 25px rgba(0,0,0,0.25), 0 0 0 0 rgba(255, 170, 0, 0.3)',
                        '0 4px 25px rgba(0,0,0,0.25), 0 0 8px 4px rgba(255, 170, 0, 0)',
                        '0 4px 25px rgba(0,0,0,0.25), 0 0 0 0 rgba(255, 170, 0, 0.3)',
                      ]
                    : '0 4px 25px rgba(0,0,0,0.25)',
                }}
                exit={{ y: 20, opacity: 0 }}
                transition={{
                  y: { duration: 0.3 },
                  opacity: { duration: 0.3 },
                  boxShadow: hasBonusAvailable 
                    ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } 
                    : { duration: 0.3 },
                }}
                className="rounded-2xl bg-secondary shadow-strong overflow-hidden relative"
              >
                {/* Shine effect - only when bonus available */}
                {hasBonusAvailable && (
                  <motion.div
                    className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl z-20"
                    initial={false}
                  >
                    <motion.div
                      className="absolute inset-y-0 w-24 -skew-x-12"
                      style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
                      }}
                      animate={{ x: ['-100%', '400%'] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: "easeInOut",
                      }}
                    />
                  </motion.div>
                )}
                
                <div className="p-2.5">
                  <div 
                    ref={containerRef}
                    className="relative h-14 rounded-xl"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    {/* Track glow */}
                    <motion.div
                      className="absolute inset-y-1 left-1 bg-gradient-to-r from-accent/25 to-transparent rounded-lg"
                      style={{ 
                        width: `${Math.max(56, sliderProgress * 85)}%`,
                        opacity: 0.5 + sliderProgress * 0.5,
                      }}
                    />
                    
                    {/* Center text - improved contrast */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                      style={{ opacity: 1 - sliderProgress * 1.5 }}
                    >
                      <div className="flex items-center gap-2 text-secondary-foreground/80">
                        <span className="text-sm font-semibold tracking-wide">
                          {hasBonusAvailable 
                            ? `Slide für +${nextBonus} Taler`
                            : 'Radio 2Go starten'
                          }
                        </span>
                        <motion.div
                          animate={{ x: [0, 6, 0] }}
                          transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </motion.div>
                      </div>
                    </motion.div>
                    
                    {/* Right side badge */}
                    <div className="absolute right-1.5 top-1 bottom-1 flex items-center pointer-events-none">
                      <motion.div
                        className="px-3 py-1.5 rounded-lg font-bold text-secondary flex items-center gap-1.5"
                        animate={{ scale: hasBonusAvailable ? 1 + sliderProgress * 0.12 : 1 }}
                        style={{
                          background: `linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(38 95% 45%) 100%)`,
                          boxShadow: hasBonusAvailable && sliderProgress > 0.5 
                            ? `0 0 ${12 + sliderProgress * 12}px hsl(44 98% 49% / ${0.4 + sliderProgress * 0.3})`
                            : '0 2px 6px rgba(0,0,0,0.15)',
                        }}
                      >
                        {hasBonusAvailable ? (
                          <>
                            <Flame className="h-3.5 w-3.5" />
                            <span className="text-sm font-bold">+{nextBonus}</span>
                          </>
                        ) : currentStreak > 0 ? (
                          <>
                            <Flame className="h-3.5 w-3.5" />
                            <span className="text-sm font-bold">{currentStreak}</span>
                          </>
                        ) : (
                          <Radio className="h-4 w-4" />
                        )}
                      </motion.div>
                    </div>
                    
                    {/* Draggable handle */}
                    <motion.div
                      drag="x"
                      dragConstraints={{ left: 0, right: sliderWidth.current }}
                      dragElastic={0.05}
                      onDragEnd={handleDragEnd}
                      style={{ x }}
                      whileDrag={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="absolute left-1 top-1 bottom-1 w-14 cursor-grab active:cursor-grabbing z-10"
                    >
                      <div 
                        className="w-full h-full rounded-lg flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(38 95% 45%) 100%)',
                          boxShadow: '0 2px 10px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.25)',
                        }}
                      >
                        {isClaiming || isRadioLoading ? (
                          <Loader2 className="h-5 w-5 text-secondary animate-spin" />
                        ) : (
                          <Play className="h-5 w-5 text-secondary fill-secondary" />
                        )}
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
