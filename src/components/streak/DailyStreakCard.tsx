import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Gift, Check, Loader2, Snowflake, ShoppingCart, Radio, Volume2 } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { useAuth } from "@/contexts/AuthContext";
import { useRadioStore } from "@/lib/radio-store";
import { Confetti } from "@/components/ui/confetti";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import talerCoin from "@/assets/taler-coin.png";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DailyStreakCard() {
  const { user, balance } = useAuth();
  const { streakStatus, isLoading, claimStreak, isClaiming, purchaseFreeze, isPurchasing } = useStreak();
  const { isPlaying, togglePlay, isLoading: isRadioLoading } = useRadioStore();
  
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedBonus, setClaimedBonus] = useState<number | null>(null);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);
  
  // Countdown state
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const wasPlayingBeforeRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
    };
  }, []);

  // Handle countdown completion
  useEffect(() => {
    if (isCountingDown && countdown <= 0) {
      // Countdown finished - claim the bonus
      setIsCountingDown(false);
      setCountdown(30);
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
      }
      
      // Actually claim the bonus
      claimStreak(undefined, {
        onSuccess: (data) => {
          if (data.success) {
            setClaimedBonus(data.bonus);
            setShowConfetti(true);
            
            if (data.used_freeze) {
              toast.success(`Tagesbonus gerettet! +${data.bonus} Taler`, {
                description: `Pausentag verwendet! Noch ${data.freezes_remaining} übrig.`,
              });
            } else {
              toast.success(`+${data.bonus} Taler erhalten!`, {
                description: `Tag ${data.current_streak} – weiter so!`,
              });
            }
            
            setTimeout(() => {
              setShowConfetti(false);
              setClaimedBonus(null);
            }, 3000);
          }
        },
        onError: () => {
          toast.error("Fehler beim Beanspruchen des Bonus");
        },
      });
    }
  }, [isCountingDown, countdown, claimStreak]);

  // Check if radio stopped during countdown
  useEffect(() => {
    if (isCountingDown && !isPlaying) {
      // Radio was stopped - pause countdown
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      toast.info("Radio pausiert – Countdown gestoppt", {
        description: "Starte das Radio erneut, um den Countdown fortzusetzen.",
      });
    } else if (isCountingDown && isPlaying && !countdownRef.current) {
      // Radio resumed - continue countdown
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      toast.success("Radio läuft wieder – Countdown geht weiter!");
    }
  }, [isPlaying, isCountingDown]);

  if (!user || isLoading) {
    return null;
  }

  if (!streakStatus) {
    return null;
  }

  const handleStartBonusClaim = () => {
    // Store if radio was already playing
    wasPlayingBeforeRef.current = isPlaying;
    
    // Start radio if not playing
    if (!isPlaying && !isRadioLoading) {
      togglePlay();
    }
    
    // Start countdown
    setIsCountingDown(true);
    setCountdown(30);
    
    toast.info("🎵 Radio gestartet!", {
      description: "Höre 30 Sekunden zu, um deinen Bonus zu erhalten.",
    });
    
    // Start countdown timer (will be managed by useEffect when radio starts)
    if (isPlaying) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else {
      // Wait for radio to start, then begin countdown
      const checkPlaying = setInterval(() => {
        const currentIsPlaying = useRadioStore.getState().isPlaying;
        if (currentIsPlaying) {
          clearInterval(checkPlaying);
          countdownRef.current = setInterval(() => {
            setCountdown((prev) => prev - 1);
          }, 1000);
        }
      }, 100);
      
      // Timeout after 10 seconds if radio doesn't start
      setTimeout(() => {
        clearInterval(checkPlaying);
        if (!useRadioStore.getState().isPlaying) {
          setIsCountingDown(false);
          setCountdown(30);
          toast.error("Radio konnte nicht gestartet werden", {
            description: "Bitte versuche es erneut.",
          });
        }
      }, 10000);
    }
  };

  const handleCancelCountdown = () => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    setIsCountingDown(false);
    setCountdown(30);
    
    // Stop radio if it wasn't playing before
    if (!wasPlayingBeforeRef.current && isPlaying) {
      togglePlay();
    }
    
    toast.info("Bonus-Abruf abgebrochen");
  };

  const handlePurchaseFreeze = () => {
    purchaseFreeze(undefined, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success("Pause-Schutz gekauft!", {
            description: `Du hast jetzt ${data.freezes} Pause-Schutz.`,
          });
          setShowFreezeDialog(false);
        } else {
          toast.error(data.error || "Kauf fehlgeschlagen");
        }
      },
      onError: () => {
        toast.error("Fehler beim Kauf");
      },
    });
  };

  const currentStreak = streakStatus.current_streak || 0;
  const canClaim = streakStatus.can_claim;
  const freezes = streakStatus.streak_freezes || 0;
  const freezeCost = streakStatus.freeze_cost || 50;
  const canAffordFreeze = (balance?.taler_balance || 0) >= freezeCost;
  const nextBonus = streakStatus.next_bonus || 5;

  // Generate streak day indicators (show 7 days as weekly goal)
  const days = Array.from({ length: 7 }, (_, i) => {
    const dayNumber = i + 1;
    const isCompleted = dayNumber <= (currentStreak % 7 || (currentStreak > 0 && currentStreak % 7 === 0 ? 7 : 0));
    const isCurrent = dayNumber === ((currentStreak % 7) + 1) && canClaim;
    const bonus = Math.min(5 + dayNumber - 1, 15);
    return { dayNumber, isCompleted, isCurrent, bonus };
  });

  return (
    <>
      <Confetti isActive={showConfetti} />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-card to-amber-500/5 border border-orange-500/20"
        data-onboarding="streak-card"
      >
        {/* Header with inline button */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shrink-0">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-foreground">Täglicher Bonus</h3>
              <p className="text-xs text-muted-foreground truncate">
                {currentStreak > 0 
                  ? `🔥 ${currentStreak} Tag${currentStreak !== 1 ? 'e' : ''} in Folge`
                  : "30s hören = Taler!"
                }
              </p>
            </div>
          </div>
          
          {/* Inline claim button or status badge */}
          {canClaim && !isCountingDown && !claimedBonus ? (
            <motion.button
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={handleStartBonusClaim}
              disabled={isClaiming || isRadioLoading}
              className="shrink-0 px-4 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isClaiming || isRadioLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Radio className="h-4 w-4" />
                  +{nextBonus}
                </>
              )}
            </motion.button>
          ) : claimedBonus ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="shrink-0 px-3 py-1.5 rounded-full bg-green-500/20 text-green-600 text-sm font-medium flex items-center gap-1"
            >
              <Check className="h-4 w-4" />
              +{claimedBonus}
            </motion.div>
          ) : !canClaim && !isCountingDown ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="shrink-0 px-3 py-1.5 rounded-full bg-muted/50 text-muted-foreground text-xs font-medium flex items-center gap-1"
            >
              <Check className="h-3 w-3 text-green-500" />
              Erledigt
            </motion.div>
          ) : null}
        </div>

        {/* Countdown section - only shown during countdown */}
        <AnimatePresence>
          {isCountingDown && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className="p-4 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Volume2 className="h-5 w-5 text-green-500 animate-pulse" />
                    <span className="text-sm font-medium text-green-600">Radio läuft...</span>
                  </div>
                  <button
                    onClick={handleCancelCountdown}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Abbrechen
                  </button>
                </div>
                
                {/* Progress bar */}
                <div className="relative h-3 rounded-full bg-muted/50 overflow-hidden">
                  <motion.div
                    initial={{ width: "0%" }}
                    animate={{ width: `${((30 - countdown) / 30) * 100}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                  />
                </div>
                
                <p className="text-xs text-center text-muted-foreground mt-2">
                  Noch {countdown} Sekunden für +{nextBonus} Taler
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Weekly progress - only shown when actively engaged (countdown, just claimed, or has streak) */}
        <AnimatePresence>
          {(isCountingDown || claimedBonus || currentStreak > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              {/* Weekly Progress Header */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">Deine Woche</span>
                <span className="text-xs text-muted-foreground">
                  Tag {Math.min((currentStreak % 7) + (canClaim ? 1 : 0), 7)} von 7
                </span>
              </div>

              {/* Day indicators with bonus labels */}
              <div className="flex items-end justify-between gap-1">
                {days.map((day, index) => (
                  <motion.div
                    key={day.dayNumber}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    {/* Bonus label on top */}
                    <span className={cn(
                      "text-[10px] font-medium",
                      day.isCompleted ? "text-orange-500" : day.isCurrent ? "text-amber-500" : "text-muted-foreground/50"
                    )}>
                      +{day.bonus}
                    </span>
                    
                    {/* Day box */}
                    <div
                      className={cn(
                        "w-full h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                        day.isCompleted 
                          ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md" 
                          : day.isCurrent
                            ? "bg-orange-500/20 text-orange-500 border-2 border-orange-500 border-dashed animate-pulse"
                            : "bg-muted/50 text-muted-foreground"
                      )}
                    >
                      {day.isCompleted ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <span className="text-[9px]">{day.dayNumber}</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Streak protection info - only show if user has freezes */}
        {freezes > 0 && (
          <div className="mt-3 p-2 rounded-lg bg-sky-500/10 flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-sky-400 shrink-0" />
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-sky-400">{freezes}× Pausentag</span> – falls du mal einen Tag verpasst, bleibt deine Serie trotzdem erhalten.
            </p>
          </div>
        )}
        
        {/* Buy freeze button - only show if no freezes */}
        {freezes === 0 && currentStreak >= 3 && (
          <button
            onClick={() => setShowFreezeDialog(true)}
            className="mt-3 w-full p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <Snowflake className="h-4 w-4 text-sky-400" />
            <span className="text-xs font-medium text-sky-400">Pausentag kaufen (schützt deine Serie)</span>
          </button>
        )}

        {/* Longest streak info */}
        {streakStatus.longest_streak > 7 && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            🏆 Dein Rekord: {streakStatus.longest_streak} Tage in Folge
          </p>
        )}
      </motion.div>

      {/* Freeze Purchase Dialog */}
      <Dialog open={showFreezeDialog} onOpenChange={setShowFreezeDialog}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Snowflake className="h-5 w-5 text-sky-400" />
              Pause-Schutz kaufen
            </DialogTitle>
            <DialogDescription>
              Ein Pause-Schutz schützt deine Bonus-Serie, wenn du einen Tag verpasst. 
              Er wird automatisch verwendet, wenn du nach einer Pause wieder einlöst.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Current freezes */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-sky-500/10 border border-sky-500/20">
              <span className="text-sm text-muted-foreground">Dein Pause-Schutz:</span>
              <span className="font-bold text-sky-400">{freezes}</span>
            </div>
            
            {/* Price */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Preis:</span>
              <div className="flex items-center gap-1">
                <img src={talerCoin} alt="" className="w-4 h-4" />
                <span className="font-bold">{freezeCost} Taler</span>
              </div>
            </div>
            
            {/* Balance */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">Dein Guthaben:</span>
              <div className="flex items-center gap-1">
                <img src={talerCoin} alt="" className="w-4 h-4" />
                <span className={`font-bold ${!canAffordFreeze ? 'text-destructive' : ''}`}>
                  {balance?.taler_balance || 0} Taler
                </span>
              </div>
            </div>
            
            {!canAffordFreeze && (
              <p className="text-xs text-destructive text-center">
                Du brauchst mindestens {freezeCost} Taler für einen Pause-Schutz.
              </p>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFreezeDialog(false)}>
              Abbrechen
            </Button>
            <Button
              onClick={handlePurchaseFreeze}
              disabled={!canAffordFreeze || isPurchasing}
              className="bg-gradient-to-r from-sky-500 to-cyan-500 hover:opacity-90"
            >
              {isPurchasing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Pause-Schutz kaufen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
