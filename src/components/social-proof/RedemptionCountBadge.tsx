import { motion } from 'framer-motion';
import { Ticket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RedemptionCountBadgeProps {
  count: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function RedemptionCountBadge({ count, className, size = 'sm' }: RedemptionCountBadgeProps) {
  if (count === 0) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs gap-1 px-2 py-0.5',
    md: 'text-sm gap-1.5 px-2.5 py-1',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  };

  // Format count (e.g., 1234 -> 1.2k)
  const formatCount = (n: number): string => {
    if (n >= 1000) {
      return `${(n / 1000).toFixed(1).replace('.0', '')}k`;
    }
    return n.toString();
  };

  return (
    <motion.div
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
