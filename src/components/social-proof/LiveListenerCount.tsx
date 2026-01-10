import { motion } from 'framer-motion';
import { Radio, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLiveListeners } from '@/hooks/useLiveListeners';

interface LiveListenerCountProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function LiveListenerCount({ className, showLabel = true, size = 'md' }: LiveListenerCountProps) {
  const { count, isConnected } = useLiveListeners();

  // Always show at least 1 when connected and playing
  const displayCount = Math.max(1, count);

  if (!isConnected) {
    return null;
  }

  const sizeClasses = {
    sm: 'text-xs gap-1.5 px-2 py-1',
    md: 'text-sm gap-2 px-3 py-1.5',
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3.5 w-3.5',
  };

  const pulseSize = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center rounded-full bg-accent/15 text-accent font-medium',
        sizeClasses[size],
        className
      )}
    >
      {/* Pulsing indicator */}
      <span className="relative flex">
        <span 
          className={cn(
            'absolute inline-flex rounded-full bg-accent opacity-75 animate-ping',
            pulseSize[size]
          )}
        />
        <span 
          className={cn(
            'relative inline-flex rounded-full bg-accent',
            pulseSize[size]
          )}
        />
      </span>

      {/* Listener count with animation */}
      <motion.span
        key={displayCount}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="font-bold tabular-nums"
      >
        {displayCount}
      </motion.span>

      {showLabel && (
        <span className="text-accent/80">
          {displayCount === 1 ? 'Hörer' : 'Hörer'}
        </span>
      )}

      <Radio className={cn(iconSizes[size], 'text-accent')} />
    </motion.div>
  );
}
