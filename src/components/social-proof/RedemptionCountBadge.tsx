import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Ticket, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePartnerRedemptionCount } from '@/hooks/usePartnerRedemptionCount';

interface RedemptionCountBadgePropsWithCount {
  count: number;
  partnerId?: never;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'default' | 'prominent';
}

interface RedemptionCountBadgePropsWithPartnerId {
  partnerId: string;
  count?: never;
  className?: string;
  size?: 'sm' | 'md';
  variant?: 'default' | 'prominent';
}

export type RedemptionCountBadgeProps = 
  | RedemptionCountBadgePropsWithCount 
  | RedemptionCountBadgePropsWithPartnerId;

const sizeClasses = {
  sm: 'text-xs gap-1 px-2 py-0.5',
  md: 'text-sm gap-1.5 px-2.5 py-1',
} as const;

const iconSizes = {
  sm: 'h-3 w-3',
  md: 'h-3.5 w-3.5',
} as const;

// Format count (e.g., 1234 -> 1.2k)
function formatCount(n: number): string {
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
  }
  return n.toString();
}

export const RedemptionCountBadge = memo(
  forwardRef<HTMLDivElement, RedemptionCountBadgeProps>(
    function RedemptionCountBadge(
      { count: propCount, partnerId, className, size = 'sm', variant = 'default' },
      ref
    ) {
      // If partnerId is provided, fetch the count
      const queryResult = usePartnerRedemptionCount(partnerId || '');
      const count = partnerId ? (queryResult.data ?? 0) : propCount;

      if (!count || count === 0) {
        return null;
      }

      if (variant === 'prominent') {
        return (
          <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-success/20 to-accent/20 border border-success/30',
              className
            )}
          >
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-success/20">
              <TrendingUp className="h-4 w-4 text-success" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-foreground">
                {formatCount(count)}
              </span>
              <span className="text-xs text-muted-foreground">
                Gutscheine eingelöst
              </span>
            </div>
          </motion.div>
        );
      }

      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            'inline-flex items-center rounded-full bg-primary/15 text-primary font-medium',
            sizeClasses[size],
            className
          )}
        >
          <Ticket className={iconSizes[size]} />
          <span className="font-semibold">{formatCount(count)}</span>
          <span className="text-primary/70">eingelöst</span>
        </motion.div>
      );
    }
  )
);
