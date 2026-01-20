import { usePartnerTier } from '@/hooks/usePartnerTier';
import { cn } from '@/lib/utils';

interface PoweredByBadgeProps {
  partnerId: string;
  className?: string;
  variant?: 'default' | 'minimal';
}

export function PoweredByBadge({ partnerId, className, variant = 'default' }: PoweredByBadgeProps) {
  const { showsPoweredByBadge, isLoading } = usePartnerTier(partnerId);

  // Don't show for partner tier or while loading
  if (isLoading || !showsPoweredByBadge) return null;

  if (variant === 'minimal') {
    return (
      <div className={cn("text-xs text-muted-foreground", className)}>
        Powered by 2Go Media AG
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-1.5 rounded-full",
      "bg-muted/50 border border-border/50",
      "text-xs text-muted-foreground",
      className
    )}>
      <div className="h-4 w-4 rounded bg-primary/20 flex items-center justify-center">
        <span className="text-[8px] font-bold text-primary">2G</span>
      </div>
      <span>Powered by 2Go Media AG</span>
    </div>
  );
}
