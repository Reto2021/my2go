import { TalerBalance } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Coins, Clock, TrendingUp } from 'lucide-react';

interface BalanceCardProps {
  balance: TalerBalance;
  className?: string;
}

export function BalanceCard({ balance, className }: BalanceCardProps) {
  return (
    <div className={cn(
      'balance-display shine',
      className
    )}>
      {/* Main Balance */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-xl bg-accent flex items-center justify-center">
            <Coins className="h-4 w-4 text-accent-foreground" />
          </div>
          <span className="text-sm font-medium text-secondary-foreground/70">
            Dein Guthaben
          </span>
        </div>
        
        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-5xl font-extrabold tabular-nums tracking-tight">
            {balance.current.toLocaleString('de-CH')}
          </span>
          <span className="text-xl font-semibold text-secondary-foreground/70">
            Taler
          </span>
        </div>
        
        {/* Stats Row */}
        <div className="flex gap-6">
          {balance.pending > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs text-secondary-foreground/60">Ausstehend</p>
                <p className="text-sm font-bold tabular-nums">
                  +{balance.pending.toLocaleString('de-CH')}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-secondary-foreground/60">Gesammelt</p>
              <p className="text-sm font-bold tabular-nums">
                {balance.lifetime.toLocaleString('de-CH')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
