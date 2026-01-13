import { Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface TalerIconProps {
  className?: string;
  size?: number;
}

export const TalerIcon = forwardRef<SVGSVGElement, TalerIconProps>(
  function TalerIcon({ className, size }, ref) {
    return (
      <Coins 
        ref={ref}
        className={cn("flex-shrink-0", className)} 
        size={size}
      />
    );
  }
);
