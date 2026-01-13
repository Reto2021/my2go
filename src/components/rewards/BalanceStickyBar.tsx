import { motion } from 'framer-motion';
import { Coins, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
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
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center">
          <Wallet className="h-5 w-5 text-accent" />
        </div>
        <div>
          <p className="text-xs text-secondary-foreground/70">Dein Guthaben</p>
          <div className="flex items-center gap-1.5">
            <Coins className="h-4 w-4 text-accent" />
            <span className="text-lg font-bold tabular-nums">
              {talerBalance.toLocaleString('de-CH')}
            </span>
            <span className="text-sm text-secondary-foreground/70">Taler</span>
          </div>
        </div>
      </div>
      
      <Link
        to="/my-redemptions"
        className="px-3 py-1.5 rounded-xl bg-accent/20 text-accent text-xs font-semibold hover:bg-accent/30 transition-colors"
      >
        Meine Einlösungen
      </Link>
    </motion.div>
  );
}
