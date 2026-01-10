import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, Gift, Check, Loader2, Snowflake, ShoppingCart } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { useAuth } from "@/contexts/AuthContext";
import { Confetti } from "@/components/ui/confetti";
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
  const [showConfetti, setShowConfetti] = useState(false);
  const [claimedBonus, setClaimedBonus] = useState<number | null>(null);
  const [showFreezeDialog, setShowFreezeDialog] = useState(false);

  if (!user || isLoading) {
    return null;
  }

  if (!streakStatus) {
    return null;
  }

  const handleClaim = () => {
    claimStreak(undefined, {
      onSuccess: (data) => {
        if (data.success) {
          setClaimedBonus(data.bonus);
          setShowConfetti(true);
          
          if (data.used_freeze) {
            toast.success(`Tagesbonus gerettet! +${data.bonus} Taler`, {
              description: `Pause-Schutz verwendet! Noch ${data.freezes_remaining} übrig.`,
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

  // Generate streak day indicators (show 7 days)
  const days = Array.from({ length: 7 }, (_, i) => {
    const dayNumber = i + 1;
    const isCompleted = dayNumber <= currentStreak;
    const isCurrent = dayNumber === currentStreak + 1 && canClaim;
    const bonus = Math.min(5 + (dayNumber - 1), 15);
    return { dayNumber, isCompleted, isCurrent, bonus };
  });

  return (
    <>
      <Confetti isActive={showConfetti} />
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 via-card to-amber-500/5 border border-orange-500/20"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Tagesbonus</h3>
              <p className="text-xs text-muted-foreground">
                {currentStreak > 0 
                  ? `${currentStreak} Tag${currentStreak !== 1 ? 'e' : ''} in Folge!`
                  : "Starte deine Serie!"
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Freeze counter */}
            <motion.button
              onClick={() => setShowFreezeDialog(true)}
              className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-sky-500/20 hover:bg-sky-500/30 transition-colors"
              title="Pause-Schutz kaufen"
            >
              <Snowflake className="h-3.5 w-3.5 text-sky-400" />
              <span className="text-xs font-bold text-sky-400">{freezes}</span>
            </motion.button>
            
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
        </div>

        {/* Day indicators */}
        <div className="flex items-center justify-between gap-1 mb-4">
          {days.map((day, index) => (
            <motion.div
              key={day.dayNumber}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex-1"
            >
              <div
                className={`
                  relative h-10 rounded-lg flex items-center justify-center text-xs font-bold transition-all
                  ${day.isCompleted 
                    ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md" 
                    : day.isCurrent
                      ? "bg-orange-500/20 text-orange-500 border-2 border-orange-500 border-dashed animate-pulse"
                      : "bg-muted/50 text-muted-foreground"
                  }
                `}
              >
                {day.isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span>{day.dayNumber}</span>
                )}
                
                {/* Bonus indicator for current claimable day */}
                {day.isCurrent && (
                  <motion.div
                    initial={{ y: 5, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-0.5 text-[10px] font-semibold text-amber-500 whitespace-nowrap"
                  >
                    <img src={talerCoin} alt="" className="w-3 h-3" />
                    +{day.bonus}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Claim button or status */}
        <AnimatePresence mode="wait">
          {canClaim ? (
            <motion.button
              key="claim"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {isClaiming ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : claimedBonus ? (
                <>
                  <Gift className="h-5 w-5" />
                  +{claimedBonus} Taler erhalten!
                </>
              ) : (
                <>
                  <Zap className="h-5 w-5" />
                  Heute beanspruchen (+{streakStatus.next_bonus} Taler)
                </>
              )}
            </motion.button>
          ) : (
            <motion.div
              key="claimed"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="w-full py-3 rounded-xl bg-muted/50 text-muted-foreground font-medium flex items-center justify-center gap-2"
            >
              <Check className="h-5 w-5 text-green-500" />
              Heute bereits beansprucht
            </motion.div>
          )}
        </AnimatePresence>

        {/* Longest streak info */}
        {streakStatus.longest_streak > 0 && (
          <p className="text-xs text-center text-muted-foreground mt-3">
            Längste Serie: {streakStatus.longest_streak} Tage
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
