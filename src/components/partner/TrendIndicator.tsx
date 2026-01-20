import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TrendIndicatorProps {
  current: number;
  previous: number;
  format?: 'number' | 'percent';
  inverted?: boolean; // For metrics where down is good
  showIcon?: boolean;
  className?: string;
}

export function TrendIndicator({
  current,
  previous,
  format = 'number',
  inverted = false,
  showIcon = true,
  className,
}: TrendIndicatorProps) {
  if (previous === 0 && current === 0) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-xs text-muted-foreground', className)}>
        {showIcon && <Minus className="h-3 w-3" />}
        <span>—</span>
      </span>
    );
  }
  
  const change = previous === 0 
    ? (current > 0 ? 100 : 0)
    : ((current - previous) / previous) * 100;
  
  const isPositive = change > 0;
  const isNeutral = change === 0;
  const isGood = inverted ? !isPositive : isPositive;
  
  const Icon = isNeutral ? Minus : (isPositive ? TrendingUp : TrendingDown);
  
  const colorClass = isNeutral 
    ? 'text-muted-foreground'
    : isGood 
      ? 'text-success' 
      : 'text-destructive';
  
  const displayValue = format === 'percent'
    ? `${change > 0 ? '+' : ''}${change.toFixed(0)}%`
    : `${change > 0 ? '+' : ''}${Math.abs(current - previous)}`;
  
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium', colorClass, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      <span>{displayValue}</span>
    </span>
  );
}
