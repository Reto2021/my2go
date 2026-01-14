import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface TalerIconProps {
  className?: string;
  size?: number;
}

/**
 * TalerIcon - Default color is secondary (dark teal) for good contrast on light backgrounds.
 * Override with text-accent, text-white, etc. where needed.
 */
export const TalerIcon = forwardRef<SVGSVGElement, TalerIconProps>(
  function TalerIcon({ className, size }, ref) {
    return (
      <Coins 
        ref={ref}
        className={cn("flex-shrink-0 text-secondary", className)} 
        size={size}
      />
    );
  }
);
