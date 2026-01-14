import { useState, useRef, useEffect } from "react";
import { motion, useMotionValue, animate, PanInfo } from "framer-motion";
import { Flame, Play, Lock, VolumeX, Volume2, Loader2, ChevronRight, Radio } from "lucide-react";
import { useRadioStore } from "@/lib/radio-store";
import { useStreak } from "@/hooks/useStreak";
import { Confetti } from "@/components/ui/confetti";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { hapticToggle } from "@/lib/haptics";

interface FloatingPlaySliderProps {
  onStreakDetailsOpen?: () => void;
}

export function FloatingPlaySlider({ onStreakDetailsOpen }: FloatingPlaySliderProps) {
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
  
  const x = useMotionValue(0);
  
  // Streak data
  const canClaim = streakStatus?.can_claim ?? false;
  const nextBonus = streakStatus?.next_bonus || 5;
  const currentStreak = streakStatus?.current_streak || 0;
  
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
      // No bonus to claim, just reset slider and show feedback
      toast.success("Radio 2Go läuft!", {
        description: "Dein Tages-Bonus wurde bereits abgeholt.",
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
          toast.success("Player entsperrt!");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    toast.info("🔒 Player für 65s gesperrt", {
      description: "Mute erlaubt, Pause nicht.",
    });
  };
  
  // Handle toggle play
  const handleTogglePlay = () => {
    if (isLocked) {
      toast.warning(`Noch ${lockRemaining}s gesperrt`);
      return;
    }
    hapticToggle();
    togglePlay();
  };
  
  // Handle mute
  const handleToggleMute = () => {
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
  
  // Always show slider, but with different states
  const showSlider = !isLocked && !isPlaying;
  const hasBonusAvailable = canClaim && !hasClaimedToday;
  
  // Don't render only during initial streak loading
  if (isStreakLoading) return null;
  
  return (
    <>
      <Confetti isActive={showConfetti} />
      
      {/* Inline flow element - not fixed, lives in content hierarchy */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ 
          y: 0, 
          opacity: 1,
          boxShadow: showSlider && hasBonusAvailable
            ? [
                '0 4px 20px rgba(0,0,0,0.2), 0 0 0 0 rgba(255, 170, 0, 0.25)',
                '0 4px 20px rgba(0,0,0,0.2), 0 0 6px 3px rgba(255, 170, 0, 0)',
                '0 4px 20px rgba(0,0,0,0.2), 0 0 0 0 rgba(255, 170, 0, 0.25)',
              ]
            : '0 4px 20px rgba(0,0,0,0.2)',
        }}
        exit={{ y: 20, opacity: 0 }}
        transition={{
          y: { duration: 0.3 },
          opacity: { duration: 0.3 },
          boxShadow: showSlider && hasBonusAvailable ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 },
        }}
        className="rounded-2xl bg-secondary shadow-strong overflow-hidden relative"
      >
        {/* Shine effect - only when bonus available */}
        {showSlider && hasBonusAvailable && (
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
        
        {/* Lock progress bar */}
        {isLocked && (
          <div className="h-1 bg-white/10">
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: `${(lockRemaining / 65) * 100}%` }}
              transition={{ duration: 1, ease: "linear" }}
              className="h-full bg-gradient-to-r from-accent to-amber-400"
            />
          </div>
        )}
        
        <div className="p-2.5">
          {/* Slider Mode */}
          {showSlider ? (
            <div 
              ref={containerRef}
              className="relative h-14 rounded-xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {/* Double gold shimmer effect across entire track */}
              {sliderProgress === 0 && (
                <>
                  {/* First shimmer - gold, wide */}
                  <motion.div
                    className="absolute inset-y-0 w-28 -skew-x-12 pointer-events-none z-[5]"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 180, 0, 0.6) 40%, rgba(255, 220, 80, 0.8) 50%, rgba(255, 180, 0, 0.6) 60%, transparent 100%)',
                    }}
                    animate={{ 
                      x: [0, 320],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      ease: "easeInOut",
                    }}
                  />
                  {/* Second shimmer - gold, thinner, delayed */}
                  <motion.div
                    className="absolute inset-y-0 w-16 -skew-x-12 pointer-events-none z-[5]"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255, 200, 50, 0.5) 50%, transparent 100%)',
                    }}
                    animate={{ 
                      x: [0, 320],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      delay: 0.25,
                      ease: "easeInOut",
                    }}
                  />
                </>
              )}
              
              {/* Track glow */}
              <motion.div
                className="absolute inset-y-1 left-1 bg-gradient-to-r from-accent/20 to-transparent rounded-lg"
                style={{ 
                  width: `${Math.max(56, sliderProgress * 85)}%`,
                  opacity: 0.4 + sliderProgress * 0.6,
                }}
              />
              
              {/* Center text */}
              <motion.div
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                style={{ opacity: 1 - sliderProgress * 1.5 }}
              >
                <div className="flex items-center gap-2 text-white/60">
                  <span className="text-sm font-semibold">
                    {hasBonusAvailable 
                      ? `2Go hören +${nextBonus} Taler holen`
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
              
              {/* Reward badge - shows bonus or just radio icon */}
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
                  <motion.div
                    animate={{
                      scale: hasBonusAvailable && sliderProgress > 0.3 ? [1, 1.15, 1] : 1,
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: hasBonusAvailable && sliderProgress > 0.3 ? Infinity : 0,
                      ease: "easeInOut",
                    }}
                    className="relative"
                  >
                    {hasBonusAvailable && sliderProgress > 0.4 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 0.5, scale: 1.4 }}
                        className="absolute inset-0 bg-white rounded-full blur-sm"
                      />
                    )}
                    <Radio className="h-3.5 w-3.5 relative z-10" />
                  </motion.div>
                  {hasBonusAvailable && (
                    <span className="text-sm font-bold">+{nextBonus}</span>
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
          ) : (
            /* Mini Player Mode */
            <div className="flex items-center gap-2.5">
              {/* Play/Pause */}
              <button
                onClick={handleTogglePlay}
                disabled={isRadioLoading || isLocked}
                className={cn(
                  "h-12 w-12 rounded-xl flex items-center justify-center shrink-0 transition-all",
                  isPlaying 
                    ? "bg-accent text-accent-foreground" 
                    : "bg-accent text-accent-foreground",
                  isLocked && "opacity-80"
                )}
                style={{
                  boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                }}
              >
                {isRadioLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isLocked ? (
                  <div className="relative">
                    <Lock className="h-4 w-4" />
                    <span className="absolute -bottom-0.5 -right-1.5 text-[8px] font-bold bg-white text-secondary rounded-full w-4 h-4 flex items-center justify-center">
                      {lockRemaining}
                    </span>
                  </div>
                ) : isPlaying ? (
                  <div className="flex items-center gap-0.5">
                    <div className="w-1 h-4 bg-current rounded-sm" />
                    <div className="w-1 h-4 bg-current rounded-sm" />
                  </div>
                ) : (
                  <Play className="h-5 w-5 ml-0.5 fill-current" />
                )}
              </button>
              
              {/* Status text */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {isLocked 
                    ? `Gesperrt – ${lockRemaining}s`
                    : isPlaying 
                      ? 'Radio 2Go läuft' 
                      : 'Radio starten'
                  }
                </p>
                <p className="text-xs text-white/50 truncate">
                  {isLocked ? 'Session wird gezählt' : 'Taler verdienen'}
                </p>
              </div>
              
              {/* Mute Button */}
              {(isPlaying || isLocked) && (
                <button
                  onClick={handleToggleMute}
                  className={cn(
                    "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                    isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70"
                  )}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              )}
              
              {/* Streak indicator */}
              {!isLocked && hasClaimedToday && currentStreak > 0 && (
                <button
                  onClick={onStreakDetailsOpen}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white/10 flex items-center gap-1"
                >
                  <Flame className="h-3.5 w-3.5 text-orange-400" />
                  <span className="text-sm font-bold text-white">{currentStreak}</span>
                </button>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}