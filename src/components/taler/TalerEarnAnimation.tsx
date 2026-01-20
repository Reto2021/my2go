import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { cn } from '@/lib/utils';

interface TalerEarnEvent {
  id: string;
  amount: number;
  source: 'radio' | 'visit' | 'purchase' | 'bonus' | 'code';
  timestamp: number;
}

interface TalerEarnAnimationProps {
  className?: string;
}

// Store for triggering animations from anywhere
type Listener = (event: TalerEarnEvent) => void;
const listeners = new Set<Listener>();

export function triggerTalerAnimation(amount: number, source: TalerEarnEvent['source'] = 'bonus') {
  const event: TalerEarnEvent = {
    id: `${Date.now()}-${Math.random()}`,
    amount,
    source,
    timestamp: Date.now(),
  };
  listeners.forEach(listener => listener(event));
}

const SOURCE_LABELS: Record<TalerEarnEvent['source'], string> = {
  radio: 'Radio',
  visit: 'Besuch',
  purchase: 'Einkauf',
  bonus: 'Bonus',
  code: 'Code',
};

export function TalerEarnAnimation({ className }: TalerEarnAnimationProps) {
  const [events, setEvents] = useState<TalerEarnEvent[]>([]);

  const handleEvent = useCallback((event: TalerEarnEvent) => {
    setEvents(prev => [...prev, event]);
    
    // Remove after animation completes
    setTimeout(() => {
      setEvents(prev => prev.filter(e => e.id !== event.id));
    }, 2500);
  }, []);

  useEffect(() => {
    listeners.add(handleEvent);
    return () => {
      listeners.delete(handleEvent);
    };
  }, [handleEvent]);

  return (
    <div className={cn('fixed top-20 right-4 z-50 pointer-events-none', className)}>
      <AnimatePresence mode="popLayout">
        {events.map((event) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            transition={{ 
              type: 'spring', 
              stiffness: 300, 
              damping: 25
            }}
            className="mb-2"
          >
            <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gradient-to-r from-accent to-accent/80 text-accent-foreground shadow-lg shadow-accent/30">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
              >
                <TalerIcon className="h-6 w-6" />
              </motion.div>
              
              <div className="flex flex-col">
                <motion.span
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="font-bold text-lg leading-none"
                >
                  +{event.amount} Taler
                </motion.span>
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.8 }}
                  transition={{ delay: 0.25 }}
                  className="text-xs opacity-80"
                >
                  {SOURCE_LABELS[event.source]}
                </motion.span>
              </div>
              
              {/* Sparkle effects */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.5, 0] }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full"
              />
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1, 0] }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="absolute top-1 right-3 w-2 h-2 bg-white/70 rounded-full"
              />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

// Compact inline variant for use in cards/lists
export function TalerEarnBadge({ 
  amount, 
  source,
  className 
}: { 
  amount: number; 
  source: TalerEarnEvent['source'];
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full',
        'bg-accent/15 text-accent font-semibold text-sm',
        className
      )}
    >
      <TalerIcon className="h-4 w-4" />
      <span>+{amount}</span>
      <span className="text-xs opacity-70">{SOURCE_LABELS[source]}</span>
    </motion.div>
  );
}
