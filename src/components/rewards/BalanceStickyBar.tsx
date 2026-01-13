import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';
import { useBalance, useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface BalanceStickyBarProps {
  className?: string;
}

export function BalanceStickyBar({ className }: BalanceStickyBarProps) {
  const { user } = useAuth();
  const { balance } = useBalance();
  
  // Don't show for non-authenticated users
  if (!user) return null;
  
  const talerBalance = balance?.taler_balance ?? 0;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "flex items-center justify-between p-3 rounded-2xl bg-secondary text-secondary-foreground",
        className
      )}
    >
      <span className="text-sm text-secondary-foreground/70">Dein Guthaben</span>
      <div className="flex items-center gap-1.5">
        <Coins className="h-4 w-4 text-accent" />
        <span className="text-lg font-bold tabular-nums">
          {talerBalance.toLocaleString('de-CH')}
        </span>
        <span className="text-sm text-secondary-foreground/70">Taler</span>
      </div>
    </motion.div>
  );
}
