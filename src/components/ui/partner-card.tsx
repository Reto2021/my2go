import { Partner } from '@/lib/api';
import { cn } from '@/lib/utils';
import { MapPin, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

interface PartnerCardProps {
  partner: Partner;
  className?: string;
}

export function PartnerCard({ partner, className }: PartnerCardProps) {
  return (
    <Link
      to={`/partner/${partner.id}`}
      className={cn(
        'block card-elevated transition-all duration-200 active:scale-[0.98]',
        'hover:shadow-lg',
        className
      )}
    >
      <div className="flex gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-secondary">
          <MapPin className="h-7 w-7 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {partner.name}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {partner.category}
          </p>
          <div className="flex items-center gap-1 mt-1 text-sm text-accent">
            <Gift className="h-3.5 w-3.5" />
            <span>{partner.rewardCount} Rewards</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
