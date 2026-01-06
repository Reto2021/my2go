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
      'relative overflow-hidden rounded-3xl p-6',
      'hero-gradient text-primary-foreground',
      className
    )}>
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      <div className="relative">
        {/* Balance Display */}
        <div className="flex items-start gap-4 mb-6">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent shadow-glow-accent">
            <Coins className="h-7 w-7 text-accent-foreground" />
          </div>
          <div>
            <p className="text-sm text-primary-foreground/70 mb-1">Dein Guthaben</p>
            <p className="text-display tabular-nums">
              {balance.current.toLocaleString('de-CH')}
              <span className="text-lg font-normal opacity-80 ml-2">Taler</span>
            </p>
          </div>
        </div>
        
        {/* Stats Row */}
        <div className="flex gap-6 text-sm">
          {balance.pending > 0 && (
            <div className="flex items-center gap-2 text-primary-foreground/70">
              <Clock className="h-4 w-4" />
              <span>+{balance.pending} ausstehend</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-primary-foreground/70">
            <TrendingUp className="h-4 w-4" />
            <span>{balance.lifetime.toLocaleString('de-CH')} gesamt</span>
          </div>
        </div>
      </div>
    </div>
  );
}
