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
        stroke="hsl(44, 98%, 40%)"
        strokeWidth="2"
      />
      
      {/* Inner circle */}
      <circle
        cx="50"
        cy="50"
        r="38"
        fill="hsl(44, 98%, 55%)"
        stroke="hsl(44, 98%, 45%)"
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
        x="50"
        y="56"
        textAnchor="middle"
        fontSize="24"
        fontWeight="bold"
        fontFamily="system-ui, -apple-system, sans-serif"
        fill="hsl(197, 96%, 18%)"
      >
        2GO
      </text>
      
      {/* Shine effect */}
      <ellipse
        cx="38"
        cy="32"
        rx="12"
        ry="6"
        fill="white"
        opacity="0.3"
      />
    </svg>
  );
}
