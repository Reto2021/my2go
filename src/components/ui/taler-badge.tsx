import { cn } from '@/lib/utils';
import { Coins } from 'lucide-react';

interface TalerBadgeProps {
  amount: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function TalerBadge({ amount, size = 'md', className }: TalerBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1 gap-1',
    md: 'text-sm px-3 py-1.5 gap-1.5',
    lg: 'text-base px-4 py-2 gap-2',
  };
  
  const iconSize = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  return (
    <span className={cn(
      'inline-flex items-center rounded-full font-semibold',
      'bg-accent/15 text-accent',
      sizeClasses[size],
      className
    )}>
      <Coins className={iconSize[size]} />
      {amount.toLocaleString('de-CH')}
    </span>
  );
}
