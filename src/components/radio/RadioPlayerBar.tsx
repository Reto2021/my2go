import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, animate, PanInfo, AnimatePresence } from "framer-motion";
import { 
  Flame, Play, Pause, Lock, VolumeX, Volume2, Loader2, 
  ChevronRight, Radio, ChevronUp, Tv 
} from "lucide-react";
import { useRadioStore } from "@/lib/radio-store";
import { useStreak } from "@/hooks/useStreak";
import { useAuthSafe } from "@/contexts/AuthContext";
import { Confetti } from "@/components/ui/confetti";
import { TalerIcon } from "@/components/icons/TalerIcon";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { hapticToggle } from "@/lib/haptics";
import { supabase } from "@/integrations/supabase/client";
import { LiveEventsPanel, LiveIndicator } from "./LiveEventsPanel";
import { useLiveEventsStore } from "@/lib/live-events-store";

interface RadioPlayerBarProps {
  onExpand: () => void;
  onStreakDetailsOpen?: () => void;
}

interface ListeningTier {
  minSeconds: number;
  reward: number;
}

// Hook to fetch tiers from database
function useListeningTiers() {
  const [tiers, setTiers] = useState<ListeningTier[]>([]);
  
  useEffect(() => {
    supabase
      .from('radio_listening_tiers')
      .select('min_duration_seconds, taler_reward')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTiers(data.map(t => ({
            minSeconds: t.min_duration_seconds,
            reward: t.taler_reward
          })));
        }
      });
  }, []);
  
  return tiers;
}

function useSessionProgress(tiers: ListeningTier[]) {
  const { isPlaying, currentSessionDuration, updateSessionDuration } = useRadioStore();
  const [lastTierIndex, setLastTierIndex] = useState(-1);
  const [justReachedTier, setJustReachedTier] = useState(false);
  
  const elapsed = currentSessionDuration;
  const safeTiers = tiers || [];
  
  // Calculate tier index (safe for empty array)
  const currentTierIndex = safeTiers.length > 0 
    ? safeTiers.findIndex((tier, i) => {
        const nextTier = safeTiers[i + 1];
        return elapsed >= tier.minSeconds && (!nextTier || elapsed < nextTier.minSeconds);
      })
    : -1;
  
  // Update session duration every second (same as expanded player)
  useEffect(() => {
    if (!isPlaying) {
      setLastTierIndex(-1);
      return;
    }
    
    const interval = setInterval(() => {
      updateSessionDuration();
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, updateSessionDuration]);
  
  // Track tier changes for celebration
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
  
  // Early return AFTER all hooks
  if (safeTiers.length === 0) {
    return {
      elapsed,
      earnedTaler: 0,
      pendingTaler: 0,
      progress: 0,
      isMaxTier: false,
      secondsToNextTier: 0,
      justReachedTier: false,
    };
  }
  
  const earnedTaler = currentTierIndex >= 0 ? safeTiers[currentTierIndex].reward : 0;
  const nextTierIndex = currentTierIndex + 1;
  const nextTier = safeTiers[nextTierIndex];
  const currentTier = currentTierIndex >= 0 ? safeTiers[currentTierIndex] : null;
  
  let progress = 0;
  let secondsToNextTier = 0;
  
  if (nextTier && currentTier) {
    const rangeStart = currentTier.minSeconds;
    const rangeEnd = nextTier.minSeconds;
    progress = ((elapsed - rangeStart) / (rangeEnd - rangeStart)) * 100;
    secondsToNextTier = rangeEnd - elapsed;
  } else if (!currentTier) {
    progress = (elapsed / safeTiers[0].minSeconds) * 100;
    secondsToNextTier = safeTiers[0].minSeconds - elapsed;
  } else {
    progress = 100;
    secondsToNextTier = 0;
  }
  
  const pendingTaler = nextTier?.reward || (earnedTaler === 0 ? safeTiers[0].reward : 0);
  
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
  const { isPlaying, togglePlay, toggleMute, isMuted, isLoading: isRadioLoading, nowPlaying, isPlayerMinimized, setPlayerMinimized } = useRadioStore();
  const { streakStatus, isLoading: isStreakLoading, claimStreak, isClaiming } = useStreak();
  const authContext = useAuthSafe();
  const isAuthenticated = !!authContext?.user;
  const currentBalance = authContext?.balance?.taler_balance ?? 0;
  
  // Live events
  const { fetchEvents, subscribeToRealtime } = useLiveEventsStore();
  const [showLiveEvents, setShowLiveEvents] = useState(false);
  
  // Fetch live events on mount and subscribe to realtime
  useEffect(() => {
    fetchEvents();
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
  }, [fetchEvents, subscribeToRealtime]);
  
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [sliderProgress, setSliderProgress] = useState(0);
  const [hasWiggled, setHasWiggled] = useState(false);
  
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderWidth = useRef(0);
  
  const x = useMotionValue(0);
  
  // Load tiers from database and calculate session progress
  const tiers = useListeningTiers();
  const { elapsed, earnedTaler, pendingTaler, progress, isMaxTier, secondsToNextTier, justReachedTier } = useSessionProgress(tiers);
  
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
  
  // Wiggle animation - repeat every 10 seconds while slider is visible and not used
  useEffect(() => {
    if (isPlaying || hasWiggled) return;
    
    const doWiggle = () => {
      if (sliderWidth.current <= 0) return;
      
      animate(x, 24, { 
        type: "spring", 
        stiffness: 300, 
        damping: 15,
        onComplete: () => {
          animate(x, 12, { 
            type: "spring", 
            stiffness: 400, 
            damping: 20,
            onComplete: () => {
              animate(x, 18, { 
                type: "spring", 
                stiffness: 500, 
                damping: 25,
                onComplete: () => {
                  animate(x, 0, { 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 25 
                  });
                }
              });
            }
          });
        }
      });
    };
    
    // Initial wiggle after short delay
    const initialTimer = setTimeout(doWiggle, 800);
    
    // Repeat every 10 seconds
    const intervalTimer = setInterval(doWiggle, 10000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(intervalTimer);
    };
  }, [isPlaying, hasWiggled, x]);
  
  // Handle slide complete
  const handleSlideComplete = () => {
    if (isLocked || isClaiming) return;
    
    hapticToggle();
    
    // Always start/ensure radio is playing
    if (!isPlaying && !isRadioLoading) {
      togglePlay();
    }
    
    // Open expanded player with video when radio starts
    onExpand();
    
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
      // Just reset slider without toast notification
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
    // Stop wiggle animation once user interacts
    setHasWiggled(true);
    
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
  // 1. Mini player: playing AND not minimized, or locked
  // 2. Minimized bar: playing but minimized (swipe up to restore)
  // 3. Slider: not playing
  const showMiniPlayer = (isPlaying && !isPlayerMinimized) || isLocked;
  const showMinimizedBar = isPlaying && isPlayerMinimized && !isLocked;
  
  // Only show player when radio STARTS playing (not continuously)
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    // Only un-minimize when radio starts (transition from not playing to playing)
    if (isPlaying && !wasPlayingRef.current) {
      setPlayerMinimized(false);
    }
    wasPlayingRef.current = isPlaying;
  }, [isPlaying, setPlayerMinimized]);
  
  // Don't render during initial streak loading
  if (isStreakLoading) return null;
  
  return (
    <>
      <Confetti isActive={showConfetti} />
      
      {/* Fixed bar above BottomNav - using higher z-index and fixed pixel value for consistency */}
      <div className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-3 pointer-events-none" style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="relative pointer-events-auto">
          <AnimatePresence mode="popLayout">
            {showMiniPlayer ? (
              /* ===== STATE 3: Mini Player (Radio Playing) ===== */
              <motion.div
                key="mini-player"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 20, opacity: 0 }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 300,
                  opacity: { duration: 0.15 }
                }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.3, bottom: 0.5 }}
                onDragEnd={(_, info) => {
                  // Swipe up to expand player
                  if (info.offset.y < -40 || info.velocity.y < -200) {
                    hapticToggle();
                    onExpand();
                  }
                  // Swipe down to minimize (hide bar, radio keeps playing)
                  else if (info.offset.y > 60 || info.velocity.y > 300) {
                    hapticToggle();
                    setPlayerMinimized(true);
                  }
                }}
                className={cn(
                  "relative rounded-2xl bg-secondary shadow-xl shadow-secondary/30 cursor-grab active:cursor-grabbing overflow-hidden transition-colors duration-300 outline-none isolate touch-pan-x",
                  justReachedTier && "ring-2 ring-accent"
                )}
                onClick={onExpand}
                tabIndex={-1}
              >
                {/* Swipe indicator */}
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-secondary-foreground/20" />
                
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
                
                <div className="flex items-center gap-3 p-2.5 pt-4">
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
                    <p className="text-xs text-secondary-foreground/60 truncate">
                      {isMaxTier ? (
                        <span className="text-accent font-medium">Max erreicht 🏆</span>
                      ) : secondsToNextTier > 0 ? (
                        <span className="flex items-center gap-1">
                          <TalerIcon className="h-3 w-3 text-accent" />
                          <span className="text-accent font-medium">+{pendingTaler}</span>
                          <span>in {formatTimeToTier(secondsToNextTier)}</span>
                        </span>
                      ) : (
                        <span>{nowPlaying?.artist || 'Live Stream'}</span>
                      )}
                    </p>
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
            ) : showMinimizedBar ? (
              /* ===== STATE 2: Minimized Bar (Radio still playing, swipe up to restore) ===== */
              <motion.div
                key="minimized-bar"
                initial={{ y: 40, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 40, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0.5, bottom: 0.3 }}
                onDragEnd={(_, info) => {
                  // Swipe up to restore mini player
                  if (info.offset.y < -30 || info.velocity.y < -150) {
                    hapticToggle();
                    setPlayerMinimized(false);
                  }
                }}
                onClick={() => {
                  hapticToggle();
                  setPlayerMinimized(false);
                }}
                className="rounded-full bg-secondary/90 backdrop-blur-sm shadow-lg px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors"
              >
                {/* Equalizer */}
                <Equalizer className="flex-shrink-0" />
                
                {/* Now Playing */}
                <p className="text-xs text-secondary-foreground font-medium truncate flex-1">
                  {nowPlaying?.title || 'Radio 2Go läuft'}
                </p>
                
                {/* Session time */}
                <span className="text-xs text-secondary-foreground/60 tabular-nums">
                  {formatTime(elapsed)}
                </span>
                
                {/* Swipe up hint */}
                <ChevronUp className="h-4 w-4 text-secondary-foreground/40" />
              </motion.div>
            ) : (
              /* ===== STATE 1: Slider Mode (Compact) ===== */
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
                    {/* Soft spotlight - cool sky-blue glow matching primary */}
                    <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
                      <motion.div
                        className="absolute"
                        style={{
                          width: 100,
                          height: 100,
                          top: '50%',
                          marginTop: -50,
                          background: 'radial-gradient(circle, rgba(122, 184, 214, 0.45) 0%, rgba(122, 184, 214, 0.2) 45%, transparent 70%)',
                          filter: 'blur(10px)',
                        }}
                        animate={{ 
                          x: [-50, 300],
                          opacity: [0, 0.7, 0.9, 0.7, 0],
                        }}
                        transition={{
                          duration: 3.5,
                          repeat: Infinity,
                          ease: 'easeInOut',
                          repeatDelay: 2,
                        }}
                      />
                    </div>
                    
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
          
          {/* Live Events Badge removed - now in header only */}
        </div>
      </div>
      
      {/* Live Events Panel */}
      <LiveEventsPanel 
        isOpen={showLiveEvents} 
        onClose={() => setShowLiveEvents(false)} 
      />
    </>
  );
}
