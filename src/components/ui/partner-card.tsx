import { Partner } from '@/lib/supabase-helpers';
import { cn } from '@/lib/utils';
import { MapPin, ChevronRight, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleReviewBadge } from '@/components/partner/GoogleReviewBadge';
import { RedemptionCountBadge } from '@/components/social-proof/RedemptionCountBadge';
import { usePartnerRedemptionCount } from '@/hooks/usePartnerRedemptionCount';

interface PartnerCardProps {
  partner: Partner;
  className?: string;
  showArrow?: boolean;
  redemptionCount?: number;
}

export function PartnerCard({ partner, className, showArrow = true, redemptionCount }: PartnerCardProps) {
  // Use provided count or fetch it
  const { data: fetchedCount } = usePartnerRedemptionCount(partner.id);
  const displayCount = redemptionCount ?? fetchedCount ?? 0;

  // Build full address from components
  const address = [partner.address_street, partner.address_number]
    .filter(Boolean)
    .join(' ');
    
  return (
    <Link
      to={`/partner/${partner.slug}`}
      className={cn('card-base p-4 flex items-center gap-4 group', className)}
    >
      {/* Logo */}
      <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-primary/20 flex-shrink-0 flex items-center justify-center">
        {partner.logo_url ? (
          <img 
            src={partner.logo_url} 
            alt={partner.name} 
            className="h-full w-full object-cover"
          />
        ) : (
          <Store className="h-7 w-7 text-secondary" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
          {partner.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {partner.category || 'Partner'}
        </p>
        
        {/* Location info & Reviews */}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {partner.city && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{partner.city}</span>
            </div>
          )}
          {partner.google_rating && (
            <GoogleReviewBadge
              rating={partner.google_rating}
              reviewCount={partner.google_review_count}
              googlePlaceId={partner.google_place_id}
              size="sm"
            />
          )}
          {displayCount > 0 && (
            <RedemptionCountBadge count={displayCount} size="sm" />
          )}
          {partner.is_featured && (
            <span className="text-xs font-semibold text-accent">Featured</span>
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
