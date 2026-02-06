import { memo } from 'react';
import { Partner } from '@/lib/supabase-helpers';
import { cn } from '@/lib/utils';
import { MapPin, ChevronRight, Store, Coins } from 'lucide-react';
import { Link } from 'react-router-dom';
import { GoogleReviewBadge } from '@/components/partner/GoogleReviewBadge';
import { RedemptionCountBadge } from '@/components/social-proof/RedemptionCountBadge';
import { usePartnerRedemptionCount } from '@/hooks/usePartnerRedemptionCount';
import { OptimizedImage } from '@/components/ui/optimized-image';

interface PartnerCardProps {
  partner: Partner;
  className?: string;
  showArrow?: boolean;
  redemptionCount?: number;
  minTalerCost?: number;
  campaignBadge?: string | null;
}

export const PartnerCard = memo(function PartnerCard({ 
  partner, 
  className, 
  showArrow = true, 
  redemptionCount, 
  minTalerCost,
  campaignBadge
}: PartnerCardProps) {
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
      className={cn('card-base p-4 flex items-center gap-4 group relative', className)}
    >
      {/* "Ab X Taler" Badge - Top Right */}
      {minTalerCost !== undefined && minTalerCost > 0 && (
        <div className="absolute -top-0 -right-0 z-10">
          <div className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-bl-xl flex items-center gap-1">
            <Coins className="h-3 w-3" />
            Ab {minTalerCost}
          </div>
        </div>
      )}
      
      {/* Logo */}
      <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
        {partner.logo_url ? (
          <OptimizedImage
            src={partner.logo_url}
            alt={partner.name}
            width={64}
            height={64}
            className="h-full w-full rounded-2xl"
          />
        ) : (
          <Store className="h-7 w-7 text-foreground/70" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
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
          {campaignBadge && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-accent/15 text-accent whitespace-nowrap">
              {campaignBadge}
            </span>
          )}
        </div>
      </div>
      
      {/* Arrow */}
      {showArrow && (
        <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      )}
    </Link>
  );
});

// Re-export the content-aware skeleton
export { SkeletonPartnerCard as PartnerCardSkeleton } from '@/components/ui/skeleton';
