import { motion } from "framer-motion";
import { Gift, Star, ShoppingBag, Trophy, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CollectingCell, SponsoredCell } from "@/hooks/useCollectingCard";

interface CollectingGridProps {
  gridSize: number;
  requiredPurchases: number;
  currentPosition: number;
  cells: CollectingCell[];
  sponsoredCells: SponsoredCell[];
  milestones: Array<{ at_purchase: number; type: string; value: number; label?: string }>;
  isCompleted: boolean;
}

export function CollectingGrid({
  gridSize,
  requiredPurchases,
  currentPosition,
  cells,
  sponsoredCells,
  milestones,
  isCompleted,
}: CollectingGridProps) {
  const totalCells = gridSize * gridSize;
  const cellsByPosition = new Map(cells.map((c) => [c.cell_position, c]));
  const sponsoredByPosition = new Map(sponsoredCells.map((s) => [s.cell_position, s]));
  const milestoneByPosition = new Map(milestones.map((m) => [m.at_purchase, m]));

  return (
    <div
      className="grid gap-1.5 w-full max-w-sm mx-auto"
      style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
    >
      {Array.from({ length: totalCells }, (_, i) => {
        const position = i + 1;
        const cell = cellsByPosition.get(position);
        const sponsored = sponsoredByPosition.get(position);
        const milestone = milestoneByPosition.get(position);
        const isActive = position <= requiredPurchases;
        const isVisited = !!cell;
        const isCurrent = position === currentPosition + 1;
        const isGoal = position === requiredPurchases;

        if (!isActive) {
          return (
            <div
              key={i}
              className="aspect-square rounded-lg bg-muted/20"
            />
          );
        }

        return (
          <motion.div
            key={i}
            initial={isVisited ? { scale: 0.8, opacity: 0 } : false}
            animate={{ scale: 1, opacity: 1 }}
            className={cn(
              "aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-[10px] font-medium relative transition-all",
              isVisited
                ? "bg-primary/20 border-primary text-primary"
                : isCurrent
                ? "bg-accent/10 border-accent border-dashed animate-pulse"
                : sponsored
                ? "bg-accent/5 border-accent/40"
                : milestone
                ? "bg-secondary border-secondary-foreground/20"
                : "bg-card border-border",
              isGoal && !isCompleted && "border-accent border-2",
              isGoal && isCompleted && "bg-accent/30 border-accent"
            )}
          >
            {isGoal ? (
              <Trophy className={cn("h-4 w-4", isCompleted ? "text-accent" : "text-muted-foreground")} />
            ) : isVisited ? (
              <ShoppingBag className="h-3.5 w-3.5 text-primary" />
            ) : sponsored ? (
              <Gift className="h-3.5 w-3.5 text-accent" />
            ) : milestone ? (
              <Star className="h-3.5 w-3.5 text-accent" />
            ) : isCurrent ? (
              <span className="text-xs font-bold text-accent">{position}</span>
            ) : (
              <span className="text-xs text-muted-foreground">{position}</span>
            )}

            {/* Cell label */}
            {sponsored && !isVisited && (
              <span className="text-[8px] text-accent truncate max-w-full px-0.5">
                {sponsored.display_text || "Bonus"}
              </span>
            )}
            {milestone && !isVisited && (
              <span className="text-[8px] text-accent truncate max-w-full px-0.5">
                +{milestone.value}T
              </span>
            )}
            {isVisited && cell?.move_type === "vertical" && (
              <span className="absolute top-0.5 right-0.5 text-[7px] text-primary font-bold">NEU</span>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
