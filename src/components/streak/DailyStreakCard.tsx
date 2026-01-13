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
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Täglicher Bonus</h3>
              <p className="text-xs text-muted-foreground">
                {currentStreak > 0 
                  ? `🔥 ${currentStreak} Tag${currentStreak !== 1 ? 'e' : ''} in Folge`
                  : "Starte heute!"
                }
              </p>
            </div>
          </div>
          
          {/* Streak counter badge */}
          {currentStreak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-500/20"
            >
              <Flame className="h-4 w-4 text-orange-500" />
              <span className="font-bold text-orange-500">{currentStreak}</span>
            </motion.div>
          )}
        </div>
        
        {/* Explanation Box */}
        <div className="p-3 rounded-xl bg-muted/50 mb-4">
          <p className="text-sm text-muted-foreground leading-relaxed">
            <span className="font-semibold text-foreground">So funktioniert's:</span> Klicke auf den Button, 
            höre 30 Sekunden Radio und erhalte deinen Bonus! Je mehr Tage in Folge, desto mehr Taler – von 5 bis 15 pro Tag.
          </p>
        </div>

        {/* Weekly Progress Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">Deine Woche</span>
          <span className="text-xs text-muted-foreground">
            Tag {Math.min((currentStreak % 7) + (canClaim ? 1 : 0), 7)} von 7
          </span>
        </div>

        {/* Day indicators with bonus labels */}
        <div className="flex items-end justify-between gap-1 mb-4">
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
                  "w-full h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all",
                  day.isCompleted 
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md" 
                    : day.isCurrent
                      ? "bg-orange-500/20 text-orange-500 border-2 border-orange-500 border-dashed animate-pulse"
                      : "bg-muted/50 text-muted-foreground"
                )}
              >
                {day.isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-[10px]">Tag {day.dayNumber}</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Claim button, countdown, or status */}
        <AnimatePresence mode="wait">
          {isCountingDown ? (
            // Countdown mode - radio is playing, waiting for 30s
            <motion.div
              key="countdown"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Countdown display */}
              <div className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 flex flex-col items-center gap-2">
                <div className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5 text-green-500 animate-pulse" />
                  <span className="text-sm font-medium text-green-600">Radio läuft...</span>
                </div>
                
                {/* Circular countdown */}
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted/30"
                    />
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      className="text-green-500 transition-all duration-1000"
                      strokeDasharray={176}
                      strokeDashoffset={176 - (176 * (30 - countdown)) / 30}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground">
                    {countdown}
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  Noch {countdown} Sekunden für deinen Bonus
                </p>
              </div>
              
              {/* Cancel button */}
              <button
                onClick={handleCancelCountdown}
                className="w-full py-2 rounded-lg bg-muted/50 text-muted-foreground text-sm hover:bg-muted transition-colors"
              >
                Abbrechen
              </button>
            </motion.div>
          ) : canClaim && !claimedBonus ? (
            <motion.button
              key="claim"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleStartBonusClaim}
              disabled={isClaiming || isRadioLoading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isClaiming || isRadioLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Radio className="h-5 w-5" />
                  Jetzt {nextBonus} Taler abholen
                </>
              )}
            </motion.button>
          ) : claimedBonus ? (
            <motion.div
              key="just-claimed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold flex items-center justify-center gap-2"
            >
              <Gift className="h-5 w-5" />
              +{claimedBonus} Taler erhalten!
            </motion.div>
          ) : (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full py-3 rounded-xl bg-muted/50 text-muted-foreground font-medium flex items-center justify-center gap-2"
            >
              <Check className="h-5 w-5 text-green-500" />
              Heute schon abgeholt – komm morgen wieder!
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
        <DialogContent className="sm:max-w-md">
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
