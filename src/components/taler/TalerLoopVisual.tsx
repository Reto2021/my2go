import { motion } from 'framer-motion';
import { Radio, ShoppingBag, MapPin, Gift, ArrowRight } from 'lucide-react';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { cn } from '@/lib/utils';

interface TalerLoopVisualProps {
  variant?: 'compact' | 'expanded';
  className?: string;
  showValues?: boolean;
}

const LOOP_STEPS = [
  {
    id: 'radio',
    icon: Radio,
    title: 'Hör zu',
    subtitle: 'Taler verdienen',
    value: '1 Taler/Min',
    color: 'text-accent',
    bgColor: 'bg-accent/15',
  },
  {
    id: 'shop',
    icon: ShoppingBag,
    title: 'Kauf ein',
    subtitle: 'bei Partnern',
    value: '10 Taler/10 CHF',
    color: 'text-primary',
    bgColor: 'bg-primary/15',
  },
  {
    id: 'visit',
    icon: MapPin,
    title: 'Besuche',
    subtitle: 'Partner',
    value: '5 Taler/Besuch',
    color: 'text-secondary',
    bgColor: 'bg-secondary/15',
  },
  {
    id: 'redeem',
    icon: Gift,
    title: 'Geniess',
    subtitle: 'vor Ort',
    value: 'Gutscheine',
    color: 'text-success',
    bgColor: 'bg-success/15',
  },
];

export function TalerLoopVisual({ 
  variant = 'compact', 
  className,
  showValues = false 
}: TalerLoopVisualProps) {
  if (variant === 'expanded') {
    return (
      <div className={cn('space-y-4', className)}>
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-2">
            <TalerIcon className="h-4 w-4" />
            So funktioniert's
          </div>
           <h3 className="text-lg font-bold text-foreground">
            Lokal einkaufen. Taler sammeln. Prämien geniessen.
          </h3>
        </div>

        {/* Loop Visualization */}
        <div className="relative">
          {/* Connection Line (circular) */}
          <div className="absolute inset-4 rounded-full border-2 border-dashed border-muted-foreground/20" />
          
          {/* Steps Grid */}
          <div className="grid grid-cols-2 gap-4 relative z-10">
            {LOOP_STEPS.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center text-center p-4 rounded-2xl bg-card border border-border"
              >
                <div className={cn(
                  'w-14 h-14 rounded-2xl flex items-center justify-center mb-3',
                  step.bgColor
                )}>
                  <step.icon className={cn('h-7 w-7', step.color)} />
                </div>
                <h4 className="font-bold text-foreground text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.subtitle}</p>
                {showValues && (
                  <span className="text-xs font-medium text-accent mt-1">{step.value}</span>
                )}
              </motion.div>
            ))}
          </div>
          
          {/* Center Taler Icon */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full bg-gradient-to-br from-accent to-primary flex items-center justify-center shadow-lg shadow-accent/30"
            >
              <TalerIcon className="h-8 w-8 text-white" />
            </motion.div>
          </div>
        </div>
        
        {/* Bottom CTA hint */}
        <p className="text-center text-sm text-muted-foreground">
          Alle Wege führen zu <span className="font-semibold text-foreground">mehr Taler</span>
        </p>
      </div>
    );
  }

  // Compact variant - horizontal flow
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="flex items-center gap-2 min-w-max py-2 px-1">
        {LOOP_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center gap-2">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                step.bgColor
              )}>
                <step.icon className={cn('h-6 w-6', step.color)} />
              </div>
              <span className="text-[10px] font-medium text-muted-foreground mt-1 whitespace-nowrap">
                {step.title}
              </span>
            </motion.div>
            
            {index < LOOP_STEPS.length - 1 && (
              <ArrowRight className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            )}
          </div>
        ))}
        
        {/* Loop back arrow */}
        <div className="flex items-center gap-2 ml-2 opacity-50">
          <ArrowRight className="h-4 w-4 text-accent rotate-180" />
          <span className="text-[10px] text-muted-foreground">repeat</span>
        </div>
      </div>
    </div>
  );
}
