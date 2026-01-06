import { TalerBalance } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Coins, TrendingUp, Clock } from 'lucide-react';

interface BalanceCardProps {
  balance: TalerBalance;
  displayName?: string;
  className?: string;
}

export function BalanceCard({ balance, displayName, className }: BalanceCardProps) {
  return (
    <div className={cn(
      'relative overflow-hidden rounded-3xl p-6',
      'bg-gradient-to-br from-primary via-primary to-primary/90',
      'text-primary-foreground',
      className
    )}>
      {/* Background decoration */}
      <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
      <div className="absolute -bottom-4 -left-4 h-24 w-24 rounded-full bg-accent/10 blur-xl" />
      
      <div className="relative">
        {displayName && (
          <p className="text-sm opacity-80 mb-1">
            Hallo {displayName}!
          </p>
        )}
        
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent">
            <Coins className="h-6 w-6 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm opacity-80">Dein Guthaben</p>
            <p className="text-3xl font-bold">
              {balance.current.toLocaleString('de-CH')} <span className="text-lg font-normal">Taler</span>
            </p>
          </div>
        </div>
        
        <div className="flex gap-6 text-sm">
          {balance.pending > 0 && (
            <div className="flex items-center gap-1.5 opacity-80">
              <Clock className="h-4 w-4" />
              <span>+{balance.pending} ausstehend</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 opacity-80">
            <TrendingUp className="h-4 w-4" />
            <span>{balance.lifetime.toLocaleString('de-CH')} gesamt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
