import { cn } from '@/lib/utils';

interface TalerIconProps {
  className?: string;
  size?: number | string;
}

export function TalerIcon({ className, size = 64 }: TalerIconProps) {
  return (
    <svg
      width={size}
      height={size}
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
      
      {/* 2GO Text - Radio 2Go style: large bold "2" with smaller "GO" */}
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
