import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, useTransform, animate, PanInfo } from "framer-motion";
import { Flame, Play, Lock, VolumeX, Volume2, Loader2, Check, ChevronRight } from "lucide-react";
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
  const [isSliding, setIsSliding] = useState(false);
  
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sliderWidth = useRef(0);
  
  // Motion values for drag
  const x = useMotionValue(0);
  const progress = useTransform(x, [0, sliderWidth.current], [0, 1]);
  
  // Streak data
  const canClaim = streakStatus?.can_claim ?? false;
  const nextBonus = streakStatus?.next_bonus || 5;
  const currentStreak = streakStatus?.current_streak || 0;
  
  // Calculate slider width on mount
  useEffect(() => {
    if (containerRef.current) {
      // 80px for handle width, some padding
      sliderWidth.current = containerRef.current.offsetWidth - 80;
    }
  }, []);
  
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
    setIsSliding(false);
    
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
        // Reset slider
        animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
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
  
  // Handle drag
  const handleDrag = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsSliding(true);
    const newX = Math.max(0, Math.min(info.offset.x, sliderWidth.current));
    x.set(newX);
  };
  
  // Handle drag end
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const percentage = info.offset.x / sliderWidth.current;
    
    if (percentage > 0.85) {
      // Slide complete
      animate(x, sliderWidth.current, { type: "spring", stiffness: 500, damping: 30 });
      handleSlideComplete();
    } else {
      // Reset
      setIsSliding(false);
      animate(x, 0, { type: "spring", stiffness: 500, damping: 30 });
    }
  };
  
  // If already claimed or playing, show different UI
  const showSlider = canClaim && !isLocked && !hasClaimedToday;
  
  return (
    <>
      <Confetti isActive={showConfetti} />
      
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-secondary via-secondary to-primary/30 animate-in">
        {/* Animated background */}
        <div className="absolute inset-0 opacity-30">
          <div 
            className="absolute inset-0 animate-gradient-shift"
            style={{
              background: 'conic-gradient(from 0deg, transparent, hsl(44 98% 49% / 0.3), transparent)',
              width: '200%',
              height: '200%',
              top: '-50%',
              left: '-50%',
            }}
          />
        </div>
        
        {/* Lock progress bar */}
        {isLocked && (
          <div className="relative h-1.5 bg-white/10">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${(lockRemaining / 65) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-500 to-amber-500"
            />
          </div>
        )}
        
        <div className="relative z-10 p-4">
          {/* Slider Mode - Show when can claim */}
          {showSlider ? (
            <div 
              ref={containerRef}
              className="relative h-16 rounded-2xl bg-white/10 overflow-hidden"
            >
              {/* Track background with gradient hint */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="flex items-center gap-2 text-white/60"
                  animate={{ opacity: isSliding ? 0 : 1 }}
                >
                  <span className="text-sm font-medium">Slide zum Starten</span>
                  <ChevronRight className="h-4 w-4 animate-bounce-x" />
                </motion.div>
              </div>
              
              {/* Reward indicator on right */}
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <motion.div
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold flex items-center gap-1.5"
                  animate={{ 
                    scale: isSliding ? 1.05 : 1,
                    boxShadow: isSliding ? "0 0 20px rgba(249, 115, 22, 0.5)" : "none"
                  }}
                >
                  <span>+{nextBonus}</span>
                </motion.div>
              </div>
              
              {/* Draggable handle */}
              <motion.div
                drag="x"
                dragConstraints={{ left: 0, right: sliderWidth.current }}
                dragElastic={0}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                style={{ x }}
                className="absolute left-1 top-1 bottom-1 w-16 cursor-grab active:cursor-grabbing"
              >
                <div className={cn(
                  "w-full h-full rounded-xl flex items-center justify-center transition-all shadow-lg",
                  "bg-accent text-accent-foreground",
                  isSliding && "scale-105"
                )}>
                  {isClaiming || isRadioLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <div className="flex items-center gap-1">
                      <Flame className="h-5 w-5 text-orange-400" />
                      <Play className="h-5 w-5 ml-0.5" />
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          ) : (
            /* Normal Player Mode - When locked or already claimed */
            <div className="flex items-center gap-4">
              {/* Play/Pause Button */}
              <button
                onClick={handleTogglePlay}
                disabled={isRadioLoading || isLocked}
                className={cn(
                  "h-16 w-16 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all shadow-lg relative",
                  isPlaying 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-accent text-accent-foreground animate-pulse-play",
                  isLocked && "opacity-80"
                )}
                aria-label={isPlaying ? 'Pause' : 'Radio starten'}
              >
                {isRadioLoading ? (
                  <div className="h-6 w-6 border-3 border-current/30 border-t-current rounded-full animate-spin" />
                ) : isLocked ? (
                  <div className="relative">
                    <Lock className="h-6 w-6" />
                    <span className="absolute -bottom-1 -right-1 text-[10px] font-bold bg-orange-500 text-white rounded-full w-5 h-5 flex items-center justify-center">
                      {lockRemaining}
                    </span>
                  </div>
                ) : isPlaying ? (
                  <div className="h-7 w-7 flex items-center justify-center gap-1">
                    <div className="w-1.5 h-6 bg-current rounded-sm" />
                    <div className="w-1.5 h-6 bg-current rounded-sm" />
                  </div>
                ) : (
                  <Play className="h-7 w-7 ml-1" />
                )}
              </button>
              
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-secondary-foreground leading-tight">
                  {isLocked 
                    ? `Gesperrt – noch ${lockRemaining}s`
                    : isPlaying 
                      ? 'Du hörst Radio 2Go' 
                      : 'Radio hören & Taler sammeln'
                  }
                </h2>
                <p className="text-sm text-secondary-foreground/70 mt-0.5">
                  {isLocked
                    ? 'Session wird für Statistik gezählt'
                    : isPlaying 
                      ? 'Hör weiter und verdiene Taler'
                      : 'Starte jetzt und verdiene 2Go Taler'
                  }
                </p>
              </div>
              
              {/* Mute Button - Always available */}
              {(isPlaying || isLocked) && (
                <button
                  onClick={handleToggleMute}
                  className={cn(
                    "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                    isMuted 
                      ? "bg-red-500/20 text-red-400" 
                      : "bg-white/10 text-white hover:bg-white/20"
                  )}
                  aria-label={isMuted ? 'Ton an' : 'Stumm'}
                >
                  {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </button>
              )}
              
              {/* Streak indicator - clickable for details */}
              {!isLocked && hasClaimedToday && currentStreak > 0 && (
                <button
                  onClick={onStreakDetailsOpen}
                  className="shrink-0 px-3 py-2 rounded-xl bg-orange-500/20 flex items-center gap-1.5 hover:bg-orange-500/30 transition-colors"
                >
                  <Flame className="h-4 w-4 text-orange-400" />
                  <span className="font-bold text-orange-400">{currentStreak}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}