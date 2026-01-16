import { forwardRef } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GoogleReviewBadgeProps {
  rating?: number | null;
  reviewCount?: number | null;
  googlePlaceId?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'gap-1 text-xs',
  md: 'gap-1.5 text-sm',
  lg: 'gap-2 text-base',
} as const;

const starSizes = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
} as const;

/**
 * Displays a Google Review rating badge with stars.
 * Links to Google Maps reviews if googlePlaceId is provided.
 */
export const GoogleReviewBadge = forwardRef<HTMLDivElement, GoogleReviewBadgeProps>(
  function GoogleReviewBadge(
    {
      rating,
      reviewCount,
      googlePlaceId,
      size = 'md',
      showLabel = false,
      className,
    },
    ref
  ) {
    // Don't render if no rating data
    if (!rating || rating <= 0) return null;

    const googleMapsUrl = googlePlaceId
      ? `https://search.google.com/local/reviews?placeid=${googlePlaceId}`
      : undefined;

    const badgeContent = (
      <div
        ref={!googleMapsUrl ? ref : undefined}
        className={cn(
          'inline-flex items-center font-medium',
          sizeClasses[size],
          className
        )}
      >
        <div className="flex items-center">
          <Star className={cn(starSizes[size], 'text-amber-400 fill-amber-400')} />
        </div>
        <span className="font-bold text-foreground">{rating.toFixed(1)}</span>
        {reviewCount && reviewCount > 0 && (
          <span className="text-muted-foreground">({reviewCount})</span>
        )}
        {showLabel && (
          <span className="text-muted-foreground ml-1">Google</span>
        )}
      </div>
    );

    if (googleMapsUrl) {
      return (
        <div ref={ref}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {badgeContent}
          </a>
        </div>
      );
    }

    return badgeContent;
  }
);

interface GoogleReviewCardProps {
  rating?: number | null;
  reviewCount?: number | null;
  googlePlaceId?: string | null;
  className?: string;
}

/**
 * Displays a larger Google Review card with full stars visualization.
 */
export const GoogleReviewCard = forwardRef<HTMLDivElement, GoogleReviewCardProps>(
  function GoogleReviewCard({ rating, reviewCount, googlePlaceId, className }, ref) {
    // Don't render if no rating data
    if (!rating || rating <= 0) return null;

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating - fullStars >= 0.5;

    const googleMapsUrl = googlePlaceId
      ? `https://search.google.com/local/reviews?placeid=${googlePlaceId}`
      : undefined;

    const cardContent = (
      <div
        ref={!googleMapsUrl ? ref : undefined}
        className={cn(
          'flex items-center gap-3 p-3 rounded-xl bg-muted/50',
          className
        )}
      >
        {/* Google Logo */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm flex-shrink-0">
          <svg viewBox="0 0 24 24" className="h-6 w-6">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        </div>

        {/* Rating Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Stars */}
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-4 w-4',
                    i < fullStars
                      ? 'text-amber-400 fill-amber-400'
                      : i === fullStars && hasHalfStar
                        ? 'text-amber-400 fill-amber-400/50'
                        : 'text-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            <span className="font-bold">{rating.toFixed(1)}</span>
          </div>
          {reviewCount && reviewCount > 0 && (
            <p className="text-xs text-muted-foreground">
              {reviewCount} Bewertungen auf Google
            </p>
          )}
        </div>
      </div>
    );

    if (googleMapsUrl) {
      return (
        <div ref={ref}>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block hover:opacity-90 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            {cardContent}
          </a>
        </div>
      );
    }

    return cardContent;
  }
);
