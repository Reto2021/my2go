import { Partner } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MapPin, Gift, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PartnerCardProps {
  partner: Partner;
  className?: string;
  showArrow?: boolean;
}

export function PartnerCard({ partner, className, showArrow = false }: PartnerCardProps) {
  return (
    <Link
      to={`/partner/${partner.id}`}
      className={cn('card-interactive p-4', className)}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
          <MapPin className="h-6 w-6 text-primary" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {partner.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate mb-1">
            {partner.category}
          </p>
          <div className="flex items-center gap-1 text-sm text-accent font-medium">
            <Gift className="h-3.5 w-3.5" />
            <span>{partner.rewardCount} Rewards</span>
          </div>
        </div>
        
        {showArrow && (
          <div className="shrink-0 flex items-center">
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>
    </Link>
  );
}

export function PartnerCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card-base p-4', className)}>
      <div className="flex gap-4">
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-muted animate-pulse-soft" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted animate-pulse-soft" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse-soft" />
          <div className="h-4 w-1/3 rounded bg-muted animate-pulse-soft" />
        </div>
      </div>
    </div>
  );
}
