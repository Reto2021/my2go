import { Partner } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MapPin, Gift, ChevronRight, Store } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PartnerCardProps {
  partner: Partner;
  className?: string;
  showArrow?: boolean;
}

export function PartnerCard({ partner, className, showArrow = true }: PartnerCardProps) {
  return (
    <Link
      to={`/partner/${partner.id}`}
      className={cn('card-base p-4 flex items-center gap-4 group', className)}
    >
      {/* Logo */}
      <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-primary/20 flex-shrink-0 flex items-center justify-center">
        <Store className="h-7 w-7 text-secondary" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
          {partner.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {partner.category}
        </p>
        
        {/* Rewards count */}
        <div className="flex items-center gap-3 mt-1.5">
          <div className="flex items-center gap-1 text-sm text-accent font-semibold">
            <Gift className="h-3.5 w-3.5" />
            <span>{partner.rewardCount} Rewards</span>
          </div>
          {partner.city && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{partner.city}</span>
            </div>
          )}
        </div>
      </div>
      
      {/* Arrow */}
      {showArrow && (
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      )}
    </Link>
  );
}

export function PartnerCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('card-base p-4', className)}>
      <div className="flex gap-4">
        <div className="h-16 w-16 shrink-0 rounded-2xl bg-muted animate-pulse" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse" />
          <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
        </div>
      </div>
    </div>
  );
}
