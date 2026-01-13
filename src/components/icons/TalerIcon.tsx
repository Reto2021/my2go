import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TalerIconProps {
  className?: string;
  size?: number | string;
  variant?: 'default' | 'compact';
}

export const TalerIcon = forwardRef<SVGSVGElement, TalerIconProps>(
  function TalerIcon({ className, size, variant = 'default' }, ref) {
    // Auto-detect variant based on className size
    const isCompact = variant === 'compact' || className?.includes('h-3') || className?.includes('h-4') || className?.includes('w-3') || className?.includes('w-4');
    
    if (isCompact) {
      // Simplified coin for small sizes
      return (
        <svg
          ref={ref}
          width={size || 16}
          height={size || 16}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={cn("flex-shrink-0", className)}
        >
          {/* Outer circle */}
          <circle
            cx="12"
            cy="12"
            r="10"
            fill="currentColor"
            opacity="0.9"
          />
          {/* Inner highlight */}
          <circle
            cx="12"
            cy="12"
            r="7.5"
            fill="currentColor"
          />
          {/* 2 symbol */}
          <text
            x="12"
            y="16"
            textAnchor="middle"
            fontSize="11"
            fontWeight="900"
            fontFamily="system-ui, sans-serif"
            fill="hsl(197, 96%, 18%)"
          >
            2
          </text>
        </svg>
      );
    }
    
    // Full detailed icon for larger sizes
    return (
      <svg
        ref={ref}
        width={size || 64}
        height={size || 64}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn("drop-shadow-lg", className)}
      >
        {/* Outer ring */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="hsl(44, 98%, 49%)"
          stroke="hsl(44, 98%, 38%)"
          strokeWidth="2"
        />
        
        {/* Inner circle */}
        <circle
          cx="50"
          cy="50"
          r="38"
          fill="hsl(44, 98%, 54%)"
          stroke="hsl(44, 98%, 42%)"
          strokeWidth="1.5"
        />
        
        {/* Decorative dots */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 50 + 42 * Math.cos(rad);
          const y = 50 + 42 * Math.sin(rad);
          return (
            <circle
              key={angle}
              cx={x}
              cy={y}
              r="2"
              fill="hsl(44, 98%, 35%)"
            />
          );
        })}
        
        {/* 2GO Text */}
        <text
          x="32"
          y="62"
          textAnchor="middle"
          fontSize="38"
          fontWeight="900"
          fontFamily="Arial Black, Impact, sans-serif"
          fill="hsl(197, 96%, 18%)"
          style={{ fontStyle: 'italic' }}
        >
          2
        </text>
        <text
          x="62"
          y="58"
          textAnchor="middle"
          fontSize="20"
          fontWeight="900"
          fontFamily="Arial Black, Impact, sans-serif"
          fill="hsl(197, 96%, 18%)"
          letterSpacing="-1"
        >
          GO
        </text>
      </svg>
    );
  }
);
