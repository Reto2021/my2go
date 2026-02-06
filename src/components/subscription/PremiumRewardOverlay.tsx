import { Lock, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PremiumRewardOverlayProps {
  onUpgradeClick: () => void;
  className?: string;
}

export function PremiumRewardOverlay({ onUpgradeClick, className }: PremiumRewardOverlayProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "absolute inset-0 z-10 flex flex-col items-center justify-center",
        "bg-background/90 backdrop-blur-sm rounded-xl",
        className
      )}
    >
      <div className="p-2.5 rounded-full bg-accent mb-2">
        <Crown className="h-5 w-5 text-accent-foreground" />
      </div>
      <p className="text-sm font-bold text-foreground mb-0.5">Premium Reward</p>
      <p className="text-xs text-muted-foreground mb-2 text-center px-4">
        Schalte diesen Reward mit 2Go Plus frei
      </p>
      <Button 
        size="sm" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUpgradeClick();
        }}
        className="bg-accent hover:bg-accent/90 text-accent-foreground font-bold text-xs px-4"
      >
        <Lock className="h-3 w-3 mr-1" />
        2Go Plus
      </Button>
    </motion.div>
  );
}

interface PremiumBadgeProps {
  className?: string;
}

export function PremiumBadge({ className }: PremiumBadgeProps) {
  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
      "bg-accent text-accent-foreground text-xs font-bold",
      className
    )}>
      <Crown className="h-3 w-3" />
      Plus
    </div>
  );
}
