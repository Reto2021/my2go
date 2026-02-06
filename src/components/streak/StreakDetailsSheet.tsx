import { useState } from "react";
import { motion } from "framer-motion";
import { Flame, Check, Snowflake, Trophy, ShoppingCart, Loader2, Wrench } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import talerCoin from "@/assets/taler-coin.png";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface StreakDetailsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StreakDetailsSheet({ open, onOpenChange }: StreakDetailsSheetProps) {
  const { balance, user } = useAuth();
  const { streakStatus, isLoading, purchaseFreeze, isPurchasing } = useStreak();
  const [isRepairing, setIsRepairing] = useState(false);
  
  if (isLoading || !streakStatus) {
    return null;
  }
  
  const currentStreak = streakStatus.current_streak || 0;
  const longestStreak = streakStatus.longest_streak || 0;
  const freezes = streakStatus.streak_freezes || 0;
  const freezeCost = streakStatus.freeze_cost || 50;
  const canAffordFreeze = (balance?.taler_balance || 0) >= freezeCost;
  const canClaim = streakStatus.can_claim;
  
  // Generate streak day indicators (show 7 days as weekly goal)
  const days = Array.from({ length: 7 }, (_, i) => {
    const dayNumber = i + 1;
    const isCompleted = dayNumber <= (currentStreak % 7 || (currentStreak > 0 && currentStreak % 7 === 0 ? 7 : 0));
    const isCurrent = dayNumber === ((currentStreak % 7) + 1) && canClaim;
    const bonus = Math.min(5 + dayNumber - 1, 15);
    return { dayNumber, isCompleted, isCurrent, bonus };
  });
  
  const handlePurchaseFreeze = () => {
    purchaseFreeze(undefined, {
      onSuccess: (data) => {
        if (data.success) {
          toast.success("Pausentag gekauft!", {
            description: `Du hast jetzt ${data.freezes} Pausentag(e).`,
          });
        } else {
          toast.error(data.error || "Kauf fehlgeschlagen");
        }
      },
      onError: () => {
        toast.error("Fehler beim Kauf");
      },
    });
  };

  const handleFreeRepair = async () => {
    if (!user) return;
    setIsRepairing(true);
    try {
      const { data, error } = await supabase.rpc('use_free_streak_repair', { _user_id: user.id });
      if (error) throw error;
      const result = data as unknown as { success: boolean; error?: string; message?: string };
      if (result.success) {
        toast.success("Serie repariert! 🔧", { description: result.message });
      } else {
        toast.error(result.error || "Reparatur fehlgeschlagen");
      }
    } catch {
      toast.error("Fehler bei der Reparatur");
    } finally {
      setIsRepairing(false);
    }
  };

  const showRepairOption = currentStreak === 0 && longestStreak > 0;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto pb-safe">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
              <Flame className="h-5 w-5 text-white" />
            </div>
            <span>Deine Bonus-Serie</span>
          </SheetTitle>
          <SheetDescription>
            Hole dir jeden Tag deinen Bonus für steigende Belohnungen!
          </SheetDescription>
        </SheetHeader>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-orange-500/20">
            <p className="text-xs text-muted-foreground mb-1">Aktuelle Serie</p>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold text-orange-500">{currentStreak}</span>
              <span className="text-sm text-muted-foreground">Tage</span>
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-muted/50 border border-border">
            <p className="text-xs text-muted-foreground mb-1">Längste Serie</p>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{longestStreak}</span>
              <span className="text-sm text-muted-foreground">Tage</span>
            </div>
          </div>
        </div>
        
        {/* Weekly Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Deine Woche</span>
            <span className="text-xs text-muted-foreground">
              Tag {Math.min((currentStreak % 7) + (canClaim ? 1 : 0), 7)} von 7
            </span>
          </div>
          
          <div className="flex items-end justify-between gap-1.5">
            {days.map((day, index) => (
              <motion.div
                key={day.dayNumber}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="flex-1 flex flex-col items-center gap-1.5"
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
                    "w-full h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all",
                    day.isCompleted 
                      ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md" 
                      : day.isCurrent
                        ? "bg-orange-500/20 text-orange-500 border-2 border-orange-500 border-dashed animate-pulse"
                        : "bg-muted text-muted-foreground"
                  )}
                >
                  {day.isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span>{day.dayNumber}</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Free Streak Repair */}
        {showRepairOption && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-green-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2">
              <Wrench className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-600">Serie reparieren</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold">GRATIS</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              1x pro Monat kannst du deine Serie kostenlos wiederherstellen.
            </p>
            <Button
              onClick={handleFreeRepair}
              disabled={isRepairing}
              size="sm"
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {isRepairing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
              Gratis reparieren
            </Button>
          </div>
        )}

        {/* Streak Protection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <Snowflake className="h-4 w-4 text-sky-400" />
            Pausentage
          </h4>
          
          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Verfügbar:</span>
              <span className="font-bold text-sky-400">{freezes}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Ein Pausentag schützt deine Serie, wenn du einen Tag verpasst. Er wird automatisch verwendet.
            </p>
          </div>
          
          {freezes < 3 && (
            <Button
              onClick={handlePurchaseFreeze}
              disabled={!canAffordFreeze || isPurchasing}
              variant="outline"
              className="w-full border-sky-500/30 text-sky-400 hover:bg-sky-500/10"
            >
              {isPurchasing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShoppingCart className="h-4 w-4 mr-2" />
              )}
              Pausentag kaufen
              <span className="ml-auto flex items-center gap-1">
                <img src={talerCoin} alt="" className="w-4 h-4" />
                {freezeCost}
              </span>
            </Button>
          )}
          
          {!canAffordFreeze && freezes < 3 && (
            <p className="text-xs text-center text-muted-foreground">
              Du benötigst {freezeCost} Taler (aktuell: {balance?.taler_balance || 0})
            </p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}