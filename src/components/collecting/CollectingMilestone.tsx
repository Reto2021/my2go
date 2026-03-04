import { motion } from "framer-motion";
import { Star, Trophy, Gift } from "lucide-react";
import { cn } from "@/lib/utils";

interface CollectingMilestoneProps {
  milestones: Array<{ at_purchase: number; type: string; value: number; label?: string }>;
  currentPurchases: number;
  requiredPurchases: number;
}

export function CollectingMilestone({ milestones, currentPurchases, requiredPurchases }: CollectingMilestoneProps) {
  if (!milestones.length) return null;

  return (
    <div className="flex items-center gap-1 w-full max-w-sm mx-auto overflow-x-auto py-2">
      {milestones
        .sort((a, b) => a.at_purchase - b.at_purchase)
        .map((m, i) => {
          const reached = currentPurchases >= m.at_purchase;
          return (
            <motion.div
              key={i}
              initial={{ scale: 0.9 }}
              animate={reached ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg min-w-[56px]",
                reached ? "bg-accent/15" : "bg-muted/30"
              )}
            >
              {m.at_purchase === requiredPurchases ? (
                <Trophy className={cn("h-4 w-4", reached ? "text-accent" : "text-muted-foreground")} />
              ) : (
                <Star className={cn("h-3.5 w-3.5", reached ? "text-accent" : "text-muted-foreground")} />
              )}
              <span className={cn("text-[10px] font-bold", reached ? "text-accent" : "text-muted-foreground")}>
                {m.label || `${m.at_purchase}.`}
              </span>
              <span className={cn("text-[9px]", reached ? "text-accent" : "text-muted-foreground/60")}>
                +{m.value}T
              </span>
            </motion.div>
          );
        })}
    </div>
  );
}
