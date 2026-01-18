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
        "bg-gradient-to-t from-background/95 via-background/80 to-background/60",
        "backdrop-blur-sm rounded-xl",
        className
      )}
    >
      <div className="p-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 mb-3">
        <Crown className="h-6 w-6 text-white" />
      </div>
      <p className="text-sm font-medium mb-1">Premium Reward</p>
      <p className="text-xs text-muted-foreground mb-3 text-center px-4">
        Schalte diesen Reward mit 2Go Plus frei
      </p>
      <Button 
        size="sm" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onUpgradeClick();
        }}
        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
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
      "bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium",
      className
    )}>
      <Crown className="h-3 w-3" />
      Plus
    </div>
  );
}
