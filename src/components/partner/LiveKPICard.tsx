import { LucideIcon, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendIndicator } from './TrendIndicator';
import { motion } from 'framer-motion';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface LiveKPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  tooltip?: string;
  icon: LucideIcon;
  color: 'primary' | 'success' | 'warning' | 'accent' | 'info';
  trend?: {
    current: number;
    previous: number;
    label?: string;
  };
  format?: 'number' | 'currency' | 'rating';
  onClick?: () => void;
  className?: string;
}

const colorStyles = {
  primary: {
    bg: 'bg-gradient-to-br from-primary/20 to-primary/5',
    border: 'border-primary/20',
    icon: 'text-primary bg-primary/10',
    hover: 'hover:border-primary/40',
  },
  success: {
    bg: 'bg-gradient-to-br from-success/20 to-success/5',
    border: 'border-success/20',
    icon: 'text-success bg-success/10',
    hover: 'hover:border-success/40',
  },
  warning: {
    bg: 'bg-gradient-to-br from-warning/20 to-warning/5',
    border: 'border-warning/20',
    icon: 'text-warning bg-warning/10',
    hover: 'hover:border-warning/40',
  },
  accent: {
    bg: 'bg-gradient-to-br from-accent/20 to-accent/5',
    border: 'border-accent/20',
    icon: 'text-accent bg-accent/10',
    hover: 'hover:border-accent/40',
  },
  info: {
    bg: 'bg-gradient-to-br from-muted to-muted/50',
    border: 'border-muted',
    icon: 'text-muted-foreground bg-muted',
    hover: 'hover:border-muted-foreground/40',
  },
};

export function LiveKPICard({
  title,
  value,
  subtitle,
  tooltip,
  icon: Icon,
  color,
  trend,
  format = 'number',
  onClick,
  className,
}: LiveKPICardProps) {
  const styles = colorStyles[color];
  
  const formattedValue = () => {
    if (typeof value === 'string') return value;
    if (format === 'currency') return `${value.toLocaleString('de-CH')} CHF`;
    if (format === 'rating') return value.toFixed(1);
    return value.toLocaleString('de-CH');
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 transition-all',
        styles.bg,
        styles.border,
        onClick && 'cursor-pointer',
        onClick && styles.hover,
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className={cn('p-2.5 rounded-xl flex-shrink-0', styles.icon)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <motion.p 
              key={String(value)}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-bold truncate"
            >
              {formattedValue()}
            </motion.p>
            {trend && (
              <TrendIndicator 
                current={trend.current} 
                previous={trend.previous}
                format="percent"
              />
            )}
          </div>
          <div className="flex items-center gap-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
              {title}
            </p>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="p-0.5 text-muted-foreground/50 hover:text-muted-foreground">
                    <HelpCircle className="h-3 w-3" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  <p>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>
      </div>
      
      {subtitle && (
        <p className="text-[10px] text-muted-foreground/70 mt-2">{subtitle}</p>
      )}
      
      {trend?.label && (
        <p className="text-[10px] text-muted-foreground/70 mt-1">
          vs. {trend.label}
        </p>
      )}
    </motion.div>
  );
}
