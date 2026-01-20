import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendIndicator } from './TrendIndicator';
import { motion } from 'framer-motion';

interface LiveKPICardProps {
  title: string;
  value: number | string;
  subtitle?: string;
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
    bg: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5',
    border: 'border-blue-500/20',
    icon: 'text-blue-500 bg-blue-500/10',
    hover: 'hover:border-blue-500/40',
  },
};

export function LiveKPICard({
  title,
  value,
  subtitle,
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mt-0.5">
            {title}
          </p>
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
