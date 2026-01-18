import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';

export interface Sponsor {
  id: string;
  name: string;
  logo_url: string | null;
  website: string | null;
}

export interface RewardSponsor {
  id: string;
  reward_id: string;
  sponsor_id: string;
  sponsorship_type: 'financial' | 'provider';
  display_text: string | null;
  sponsor?: Sponsor;
}

interface SponsorBadgeProps {
  sponsor: Sponsor;
  sponsorshipType?: 'financial' | 'provider';
  displayText?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export function SponsorBadge({ 
  sponsor, 
  sponsorshipType = 'financial',
  displayText,
  size = 'sm', 
  className,
  showLabel = true
}: SponsorBadgeProps) {
  const sizeClasses = {
    sm: 'h-5 gap-1 text-[10px] px-1.5 py-0.5',
    md: 'h-7 gap-1.5 text-xs px-2 py-1',
    lg: 'h-9 gap-2 text-sm px-3 py-1.5',
  };
  
  const logoSizes = {
    sm: 'h-3.5 w-3.5',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
  };
  
  const label = displayText || (sponsorshipType === 'provider' ? 'Angeboten von' : 'Gesponsert von');
  
  const content = (
    <div 
      className={cn(
        'inline-flex items-center rounded-full bg-accent/10 border border-accent/20',
        sizeClasses[size],
        className
      )}
    >
      {sponsor.logo_url ? (
        <OptimizedImage 
          src={sponsor.logo_url} 
          alt={sponsor.name}
          className={cn('rounded-full object-cover', logoSizes[size])}
          width={size === 'lg' ? 24 : size === 'md' ? 20 : 14}
          height={size === 'lg' ? 24 : size === 'md' ? 20 : 14}
        />
      ) : (
        <div className={cn(
          'rounded-full bg-accent/20 flex items-center justify-center font-bold text-accent',
          logoSizes[size]
        )}>
          {sponsor.name.charAt(0).toUpperCase()}
        </div>
      )}
      {showLabel && (
        <span className="text-accent-foreground/80 font-medium whitespace-nowrap">
          {label} <span className="font-bold text-accent-foreground">{sponsor.name}</span>
        </span>
      )}
    </div>
  );
  
  if (sponsor.website) {
    return (
      <a 
        href={sponsor.website} 
        target="_blank" 
        rel="noopener noreferrer"
        className="hover:opacity-80 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        {content}
      </a>
    );
  }
  
  return content;
}

// Compact version for reward cards
export function SponsorBadgeCompact({ 
  sponsor, 
  className 
}: { 
  sponsor: Sponsor; 
  className?: string;
}) {
  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 text-[10px] text-accent-foreground/70',
        className
      )}
    >
      {sponsor.logo_url ? (
        <img 
          src={sponsor.logo_url} 
          alt={sponsor.name}
          className="h-3 w-3 rounded-full object-cover"
        />
      ) : (
        <div className="h-3 w-3 rounded-full bg-accent/20 flex items-center justify-center text-[8px] font-bold text-accent">
          {sponsor.name.charAt(0)}
        </div>
      )}
      <span className="truncate max-w-[80px]">{sponsor.name}</span>
    </div>
  );
}
