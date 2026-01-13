import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Flame, Play, Lock, VolumeX, Volume2, Loader2, ChevronRight, Radio } from "lucide-react";
import { useRadioStore } from "@/lib/radio-store";
import { useStreak } from "@/hooks/useStreak";
import { Confetti } from "@/components/ui/confetti";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { hapticToggle } from "@/lib/haptics";

interface PlaySliderProps {
  onStreakDetailsOpen?: () => void;
}

export function PlaySlider({ onStreakDetailsOpen }: PlaySliderProps) {
  const { isPlaying, togglePlay, toggleMute, isMuted, isLoading: isRadioLoading } = useRadioStore();
  const { streakStatus, isLoading: isStreakLoading, claimStreak, isClaiming } = useStreak();
  
  const [isLocked, setIsLocked] = useState(false);
  const [lockRemaining, setLockRemaining] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [hasClaimedToday, setHasClaimedToday] = useState(false);
  const [sliderProgress, setSliderProgress] = useState(0);
  
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderWidth = useRef(0);
  
  // Motion values for drag
  const x = useMotionValue(0);
  
  // Streak data
  const canClaim = streakStatus?.can_claim ?? false;
  const nextBonus = streakStatus?.next_bonus || 5;
  const currentStreak = streakStatus?.current_streak || 0;
  
  // Calculate slider width on mount and resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        sliderWidth.current = containerRef.current.offsetWidth - 72; // 64px handle + 8px padding
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
  
  // Update hasClaimedToday when streak status changes
  useEffect(() => {
    if (streakStatus && !streakStatus.can_claim) {
      setHasClaimedToday(true);
    }
  }, [streakStatus]);
  
  // Handle slide complete
  const handleSlideComplete = () => {
    if (!canClaim || isLocked || isClaiming) return;
    
    hapticToggle();
    
    // Start radio if not playing
    if (!isPlaying && !isRadioLoading) {
      togglePlay();
    }
    
    // Immediately give bonus
    claimStreak(undefined, {
      onSuccess: (data) => {
        if (data.success) {
          setShowConfetti(true);
          setHasClaimedToday(true);
          toast.success(`+${data.bonus} Taler erhalten!`, {
            description: `Tag ${data.current_streak} – weiter so!`,
          });
          setTimeout(() => setShowConfetti(false), 3000);
          
          // Start 65 second lock
          startLock();
        }
      },
      onError: () => {
        toast.error("Fehler beim Beanspruchen des Bonus");
        animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
        setSliderProgress(0);
      },
    });
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
          toast.success("Player entsperrt!", {
            description: "Du kannst jetzt wieder pausieren.",
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    toast.info("🔒 Player für 65 Sekunden gesperrt", {
      description: "Du kannst lautlos stellen, aber nicht pausieren.",
    });
  };
  
  // Handle toggle play (respecting lock)
  const handleTogglePlay = () => {
    if (isLocked) {
      toast.warning("Player ist noch gesperrt", {
        description: `Noch ${lockRemaining} Sekunden für die Statistik.`,
      });
      return;
    }
    hapticToggle();
    togglePlay();
  };
  
  // Handle mute (always allowed)
  const handleToggleMute = () => {
    hapticToggle();
    toggleMute();
  };
  
  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const percentage = info.offset.x / sliderWidth.current;
    
    if (percentage > 0.75) {
      // Slide complete - snap to end
      animate(x, sliderWidth.current, { type: "spring", stiffness: 400, damping: 25 });
      handleSlideComplete();
    } else {
      // Reset with spring animation
      animate(x, 0, { type: "spring", stiffness: 400, damping: 25 });
      setSliderProgress(0);
    }
  };
  
  // If already claimed or playing, show different UI
  const showSlider = canClaim && !isLocked && !hasClaimedToday;
  
  return (
    <>
      <Confetti isActive={showConfetti} />
      
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-secondary to-secondary/90 shadow-strong">
        {/* Animated background glow */}
        <div className="absolute inset-0 opacity-40">
          <div 
            className="absolute inset-0 animate-gradient-shift"
            style={{
              background: 'conic-gradient(from 0deg, transparent, hsl(var(--accent) / 0.3), transparent)',
              width: '200%',
              height: '200%',
              top: '-50%',
              left: '-50%',
            }}
          />
        </div>
        
        {/* Lock progress bar */}
        {isLocked && (
          <div className="relative h-1 bg-white/10">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${(lockRemaining / 65) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-amber-400"
            />
          </div>
        )}
        
        <div className="relative z-10 p-3">
          {/* Premium Slider Mode */}
          {showSlider ? (
            <div 
              ref={containerRef}
              className="relative h-16 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              {/* Track glow effect following slider */}
              <motion.div
                className="absolute inset-y-1 left-1 bg-gradient-to-r from-accent/20 via-accent/10 to-transparent rounded-xl"
                style={{ 
                  width: `${Math.max(60, sliderProgress * 85)}%`,
                  opacity: 0.4 + sliderProgress * 0.6,
                }}
              />
              
              {/* Center text - fades as you slide */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ opacity: 1 - sliderProgress * 1.5 }}
              >
                <div className="flex items-center gap-2 text-white/60">
                  <span className="text-sm font-medium tracking-wide">Slide zum Starten</span>
                  <motion.div
                    animate={{ x: [0, 6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Reward badge on right - inside the track */}
              <div className="absolute right-1.5 top-1 bottom-1 flex items-center pointer-events-none">
                <motion.div
                  className="px-3 py-2 rounded-xl font-bold text-secondary flex items-center gap-1.5"
                  animate={{
                    scale: 1 + sliderProgress * 0.15,
                  }}
                  style={{
                    background: `linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(38 95% 45%) 100%)`,
                    boxShadow: sliderProgress > 0.5 
                      ? `0 0 ${16 + sliderProgress * 16}px hsl(44 98% 49% / ${0.3 + sliderProgress * 0.4})`
                      : '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  <Radio className="h-4 w-4" />
                  <span className="text-base font-bold">+{nextBonus}</span>
                </motion.div>
              </div>
              
              {/* Draggable handle - Premium glass design */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: sliderWidth.current }}
                dragElastic={0.05}
                onDragEnd={handleDragEnd}
                style={{ x }}
                whileDrag={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="absolute left-1 top-1 bottom-1 w-16 cursor-grab active:cursor-grabbing z-10"
              >
                <div 
                  className="w-full h-full rounded-xl flex items-center justify-center shadow-lg transition-shadow"
                  style={{
                    background: 'linear-gradient(135deg, hsl(var(--accent)) 0%, hsl(38 95% 45%) 100%)',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.3)',
                  }}
                >
                  {isClaiming || isRadioLoading ? (
                    <Loader2 className="h-6 w-6 text-secondary animate-spin" />
                  ) : (
                    <div className="flex items-center gap-0.5">
                      <Play className="h-6 w-6 text-secondary fill-secondary" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Normal Player Mode */
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={handleTogglePlay}
                disabled={isRadioLoading || isLocked}
                className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-lg relative",
                  isPlaying 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-accent text-accent-foreground animate-pulse-play",
                  isLocked && "opacity-80"
                )}
                style={{
                  boxShadow: '0 4px 16px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
                aria-label={isPlaying ? 'Pause' : 'Radio starten'}
              >
                {isRadioLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLocked ? (
                  <div className="relative">
                    <Lock className="h-5 w-5" />
                    <span className="absolute -bottom-1 -right-2 text-[9px] font-bold bg-white text-secondary rounded-full w-5 h-5 flex items-center justify-center shadow">
                      {lockRemaining}
                    </span>
                  </div>
                ) : isPlaying ? (
                  <div className="h-6 w-6 flex items-center justify-center gap-1">
                    <div className="w-1.5 h-5 bg-current rounded-sm" />
                    <div className="w-1.5 h-5 bg-current rounded-sm" />
                  </div>
                ) : (
                  <Play className="h-6 w-6 ml-0.5 fill-current" />
                )}
              </button>
              
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white leading-tight">
                  {isLocked 
                    ? `Gesperrt – ${lockRemaining}s`
                    : isPlaying 
                      ? 'Du hörst Radio 2Go' 
                      : 'Radio hören'
                  }
                </h2>
                <p className="text-sm text-white/60 mt-0.5">
                  {isLocked
                    ? 'Session wird gezählt'
                    : isPlaying 
                      ? 'Hör weiter & verdiene Taler'
                      : 'Starte & verdiene Taler'
                  }
                </p>
              </div>
              
              {/* Mute Button */}
              {(isPlaying || isLocked) && (
                <button
                  onClick={handleToggleMute}
                  className={cn(
                    "h-11 w-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                    isMuted 
                      ? "bg-red-500/20 text-red-400" 
                      : "bg-white/10 text-white/80 hover:bg-white/20"
                  )}
                  aria-label={isMuted ? 'Ton an' : 'Stumm'}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              )}
              
              {/* Streak indicator */}
              {!isLocked && hasClaimedToday && currentStreak > 0 && (
                <button
                  onClick={onStreakDetailsOpen}
                  className="shrink-0 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 transition-colors flex items-center gap-1.5"
                >
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="font-bold text-white">{currentStreak}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}