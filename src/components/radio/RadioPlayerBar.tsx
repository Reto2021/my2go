import { useState, useRef, useEffect, useCallback } from "react";
import { useMotionValue, animate, PanInfo, AnimatePresence } from "framer-motion";
import { useRadioStore } from "@/lib/radio-store";
import { useStreak } from "@/hooks/useStreak";
import { useAuthSafe } from "@/contexts/AuthContext";
import { Confetti } from "@/components/ui/confetti";
import { toast } from "sonner";
import { hapticToggle, hapticSuccess } from "@/lib/haptics";
import { supabase } from "@/integrations/supabase/client";
import { LiveEventsPanel } from "./LiveEventsPanel";
import { useLiveEventsStore } from "@/lib/live-events-store";
import { TalerIcon } from "@/components/icons/TalerIcon";

// Custom hooks
import { useWiggleAnimation } from "@/hooks/useWiggleAnimation";
import { useSliderWidth } from "@/hooks/useSliderWidth";
import { useSessionLock } from "@/hooks/useSessionLock";

// Sub-components
import { MiniPlayerState, MinimizedBarState, SliderState } from "./player-states";

interface RadioPlayerBarProps {
  onExpand: () => void;
  onStreakDetailsOpen?: () => void;
}

interface ListeningTier {
  minSeconds: number;
  reward: number;
}

// ============================================
// Internal hooks (specific to this component)
// ============================================

function useListeningTiers() {
  const [tiers, setTiers] = useState<ListeningTier[]>([]);

  useEffect(() => {
    supabase
      .from("radio_listening_tiers")
      .select("min_duration_seconds, taler_reward")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          setTiers(
            data.map((t) => ({
              minSeconds: t.min_duration_seconds,
              reward: t.taler_reward,
            }))
          );
        }
      });
  }, []);

  return tiers;
}

function useSessionProgress(tiers: ListeningTier[], onTierReached?: (reward: number) => void) {
  const { isPlaying, currentSessionDuration, updateSessionDuration } = useRadioStore();
  const [lastTierIndex, setLastTierIndex] = useState(-1);
  const [justReachedTier, setJustReachedTier] = useState(false);

  const elapsed = currentSessionDuration;
  const safeTiers = tiers || [];

  const currentTierIndex =
    safeTiers.length > 0
      ? safeTiers.findIndex((tier, i) => {
          const nextTier = safeTiers[i + 1];
          return elapsed >= tier.minSeconds && (!nextTier || elapsed < nextTier.minSeconds);
        })
      : -1;

  // Update session duration every second
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
      
      // Trigger callback when tier is reached (for balance refresh & confetti)
      if (safeTiers[currentTierIndex] && onTierReached) {
        onTierReached(safeTiers[currentTierIndex].reward);
      }
      
      const timer = setTimeout(() => setJustReachedTier(false), 2000);
      setLastTierIndex(currentTierIndex);
      return () => clearTimeout(timer);
    }
    if (currentTierIndex !== lastTierIndex) {
      setLastTierIndex(currentTierIndex);
    }
  }, [currentTierIndex, lastTierIndex, elapsed, safeTiers, onTierReached]);

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

// ============================================
// Main Component
// ============================================

export function RadioPlayerBar({ onExpand }: RadioPlayerBarProps) {
  const {
    isPlaying,
    togglePlay,
    toggleMute,
    isMuted,
    isLoading: isRadioLoading,
    nowPlaying,
    isPlayerMinimized,
    setPlayerMinimized,
  } = useRadioStore();

  const { streakStatus, isLoading: isStreakLoading, claimStreak, isClaiming } = useStreak();
  const authContext = useAuthSafe();
  const isAuthenticated = !!authContext?.user;

  // Live events
  const { fetchEvents, subscribeToRealtime } = useLiveEventsStore();
  const [showLiveEvents, setShowLiveEvents] = useState(false);

  useEffect(() => {
    fetchEvents();
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
  }, [fetchEvents, subscribeToRealtime]);

  // Local state
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);

  // Motion value for slider
  const x = useMotionValue(0);

  // Custom hooks
  const { containerRef, sliderWidth, progress: sliderProgress, setProgress: setSliderProgress } = useSliderWidth({ x });
  const { isLocked, lockRemaining, startLock } = useSessionLock();
  const { stopWiggle } = useWiggleAnimation({
    x,
    disabled: isPlaying,
    isReady: () => sliderWidth.current > 0,
  });

  // Callback when a tier is reached - show confetti celebration
  const handleTierReached = useCallback((reward: number) => {
    // Show confetti celebration
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Haptic feedback
    hapticSuccess();
    
    // Show toast with Taler earned - clarify that it's credited when stopping
    toast.success(`+${reward} Taler erreicht! 🎉`, {
      description: 'Wird gutgeschrieben wenn du stoppst',
      icon: <TalerIcon className="h-5 w-5 text-accent" />,
    });
  }, []);

  // Load tiers and calculate session progress
  const tiers = useListeningTiers();
  const { elapsed, earnedTaler, pendingTaler, progress, isMaxTier, secondsToNextTier, justReachedTier } =
    useSessionProgress(tiers, isAuthenticated ? handleTierReached : undefined);

  // Streak data
  const canClaim = streakStatus?.can_claim ?? false;
  const nextBonus = streakStatus?.next_bonus || 5;
  const currentStreak = streakStatus?.current_streak || 0;
  const hasBonusAvailable = canClaim && !hasClaimedToday;

  // Update hasClaimedToday
  useEffect(() => {
    if (streakStatus && !streakStatus.can_claim) {
      setHasClaimedToday(true);
    }
  }, [streakStatus]);

  // Only show player when radio STARTS playing
  const wasPlayingRef = useRef(false);
  useEffect(() => {
    if (isPlaying && !wasPlayingRef.current) {
      setPlayerMinimized(false);
    }
    wasPlayingRef.current = isPlaying;
  }, [isPlaying, setPlayerMinimized]);

  // ============================================
  // Event handlers
  // ============================================

  const handleSlideComplete = () => {
    if (isLocked || isClaiming) return;

    hapticToggle();

    // Start radio if not playing
    if (!isPlaying && !isRadioLoading) {
      togglePlay();
    }

    // Open expanded player
    onExpand();

    // Claim streak bonus if available
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
      animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
      setSliderProgress(0);
    }
  };

  const handleTogglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isLocked) {
      toast.warning(`Noch ${lockRemaining}s gesperrt`);
      return;
    }
    hapticToggle();
    togglePlay();
  };

  const handleToggleMute = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    hapticToggle();
    toggleMute();
  };

  const handleDragEnd = (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    stopWiggle();

    const percentage = info.offset.x / sliderWidth.current;

    if (percentage > 0.75) {
      animate(x, sliderWidth.current, { type: "spring", stiffness: 400, damping: 25 });
      handleSlideComplete();
    } else {
      animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
      setSliderProgress(0);
    }
  };

  // ============================================
  // State logic
  // ============================================

  const showMiniPlayer = (isPlaying && !isPlayerMinimized) || isLocked;
  const showMinimizedBar = isPlaying && isPlayerMinimized && !isLocked;

  // Don't render during initial streak loading
  if (isStreakLoading) return null;

  // ============================================
  // Render
  // ============================================

  return (
    <>
      <Confetti isActive={showConfetti} />

      <div
        className="fixed bottom-[100px] left-1/2 -translate-x-1/2 z-[60] w-full max-w-md px-3 pointer-events-none"
        style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="relative pointer-events-auto">
          <AnimatePresence mode="popLayout">
            {showMiniPlayer ? (
              <MiniPlayerState
                nowPlaying={nowPlaying}
                isPlaying={isPlaying}
                isRadioLoading={isRadioLoading}
                isMuted={isMuted}
                isLocked={isLocked}
                lockRemaining={lockRemaining}
                earnedTaler={earnedTaler}
                pendingTaler={pendingTaler}
                secondsToNextTier={secondsToNextTier}
                isMaxTier={isMaxTier}
                progress={progress}
                justReachedTier={justReachedTier}
                onExpand={onExpand}
                onTogglePlay={handleTogglePlay}
                onToggleMute={handleToggleMute}
                onMinimize={() => setPlayerMinimized(true)}
              />
            ) : showMinimizedBar ? (
              <MinimizedBarState
                nowPlaying={nowPlaying}
                elapsed={elapsed}
                onRestore={() => setPlayerMinimized(false)}
              />
            ) : (
              <SliderState
                containerRef={containerRef}
                x={x}
                sliderWidth={sliderWidth}
                sliderProgress={sliderProgress}
                hasBonusAvailable={hasBonusAvailable}
                nextBonus={nextBonus}
                currentStreak={currentStreak}
                isClaiming={isClaiming}
                isRadioLoading={isRadioLoading}
                onDragEnd={handleDragEnd}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Live Events Panel */}
      <LiveEventsPanel isOpen={showLiveEvents} onClose={() => setShowLiveEvents(false)} />
    </>
  );
}
