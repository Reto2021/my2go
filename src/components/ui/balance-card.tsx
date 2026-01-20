import { Link } from 'react-router-dom';
import { UserBalance } from '@/lib/supabase-helpers';
import { cn } from '@/lib/utils';
import { Coins, Clock, TrendingUp, BarChart3, ChevronRight, AlertTriangle } from 'lucide-react';
import { useTalerBatches, formatExpiryDate, daysUntilExpiry } from '@/hooks/useTalerBatches';

interface BalanceCardProps {
  balance: UserBalance;
  userId?: string | null;
  className?: string;
}

export function BalanceCard({ balance, userId, className }: BalanceCardProps) {
  const { totalExpiringSoon, nextExpiryDate, nextExpiryAmount, isLoading } = useTalerBatches(userId || null);
  
  const daysLeft = nextExpiryDate ? daysUntilExpiry(nextExpiryDate) : null;
  const showExpiryWarning = totalExpiringSoon > 0 && daysLeft !== null && daysLeft <= 30;

  return (
    <div 
      className={cn('balance-display shine', className)}
      data-onboarding="balance-card"
    >
      {/* Main Balance */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
              <Coins className="h-4 w-4 text-accent-foreground" />
            </div>
            <span className="text-sm font-medium text-secondary-foreground/70">
              Dein Guthaben
            </span>
          </div>
          
          {/* Stats Link */}
          <Link 
            to="/my-stats"
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition-colors text-xs font-medium"
          >
            <BarChart3 className="h-3.5 w-3.5" />
            Stats
            <ChevronRight className="h-3 w-3 opacity-70" />
          </Link>
        </div>
        
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-5xl font-extrabold tabular-nums tracking-tight">
            {balance.taler_balance.toLocaleString('de-CH')}
          </span>
          <span className="text-xl font-semibold text-secondary-foreground/70">
            Taler
          </span>
        </div>

        {/* Expiry Warning Banner */}
        {showExpiryWarning && !isLoading && (
          <div className="mb-4 p-2.5 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-300 shrink-0" />
            <p className="text-xs text-amber-100">
              <span className="font-semibold">{totalExpiringSoon} Taler</span> verfallen am{' '}
              <span className="font-semibold">{formatExpiryDate(nextExpiryDate!)}</span>
              {daysLeft <= 7 && (
                <span className="ml-1 text-amber-300">
                  (noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'})
                </span>
              )}
            </p>
          </div>
        )}
        
        {/* Stats Row */}
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-secondary-foreground/60">Gesammelt</p>
              <p className="text-sm font-bold tabular-nums">
                {balance.lifetime_earned.toLocaleString('de-CH')}
              </p>
            </div>
          </div>
          
          {balance.lifetime_spent > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-secondary-foreground/60">Eingelöst</p>
                <p className="text-sm font-bold tabular-nums">
                  {balance.lifetime_spent.toLocaleString('de-CH')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
