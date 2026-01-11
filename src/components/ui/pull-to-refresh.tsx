import { useState, useRef, useCallback, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);
  
  const canPull = useCallback(() => {
    if (disabled || isRefreshing) return false;
    // Only allow pull when at top of page
    return window.scrollY <= 0;
  }, [disabled, isRefreshing]);
  
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canPull()) return;
    startYRef.current = e.touches[0].clientY;
    currentYRef.current = e.touches[0].clientY;
    setIsPulling(true);
  }, [canPull]);
  
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || !canPull()) return;
    
    currentYRef.current = e.touches[0].clientY;
    const diff = currentYRef.current - startYRef.current;
    
    // Only pull down, not up
    if (diff > 0) {
      // Apply resistance - the further you pull, the harder it gets
      const resistance = Math.min(diff * 0.4, threshold * 1.5);
      setPullDistance(resistance);
      
      // Prevent scroll when pulling
      if (window.scrollY <= 0 && diff > 10) {
        e.preventDefault();
      }
    }
  }, [isPulling, canPull, threshold]);
  
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Keep indicator visible during refresh
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      // Animate back to 0
      setPullDistance(0);
    }
    
    startYRef.current = 0;
    currentYRef.current = 0;
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);
  
  const progress = Math.min(pullDistance / threshold, 1);
  const isReady = progress >= 1;
  
  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className={cn(
          "absolute left-0 right-0 flex items-center justify-center overflow-hidden transition-opacity duration-200 pointer-events-none z-50",
          (pullDistance > 0 || isRefreshing) ? "opacity-100" : "opacity-0"
        )}
        style={{
          top: -60,
          height: 60,
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
            isReady || isRefreshing
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-muted text-muted-foreground"
          )}
          style={{
            transform: `scale(${0.6 + progress * 0.4}) rotate(${progress * 180}deg)`,
            transition: isPulling ? 'background-color 0.2s, color 0.2s' : 'all 0.3s ease-out',
          }}
        >
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ArrowDown 
              className={cn(
                "h-5 w-5 transition-transform",
                isReady && "rotate-180"
              )} 
            />
          )}
        </div>
      </div>
      
      {/* Content with transform */}
      <div
        style={{
          transform: `translateY(${pullDistance}px)`,
          transition: isPulling ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
      
      {/* Pull hint text */}
      {pullDistance > 20 && !isRefreshing && (
        <div
          className="absolute left-0 right-0 text-center text-xs text-muted-foreground pointer-events-none z-50"
          style={{
            top: pullDistance - 20,
            opacity: Math.min((pullDistance - 20) / 30, 1),
            transition: isPulling ? 'none' : 'all 0.3s ease-out',
          }}
        >
          {isReady ? 'Loslassen zum Aktualisieren' : 'Ziehen zum Aktualisieren'}
        </div>
      )}
    </div>
  );
}
