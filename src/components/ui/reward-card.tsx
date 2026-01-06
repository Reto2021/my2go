import { Reward } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Coffee, Ticket, Star, Gift, Coins, ChevronRight, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RewardCardProps {
  reward: Reward;
  className?: string;
  distance?: number; // Distance in km
}

const categoryIcons = {
  experience: Star,
  discount: Ticket,
  product: Gift,
  exclusive: Coffee,
};

const categoryColors = {
  experience: 'bg-accent/15 text-accent',
  discount: 'bg-success/15 text-success',
  product: 'bg-primary/30 text-secondary',
  exclusive: 'bg-secondary/10 text-secondary',
};

export function RewardCard({ reward, className, distance }: RewardCardProps) {
  const Icon = categoryIcons[reward.category] || Gift;
  const colorClass = categoryColors[reward.category] || categoryColors.product;
  const canAfford = reward.cost <= 500; // Mock: assume user has 500 points
  
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };
  
  return (
    <Link
      to={`/rewards/${reward.id}`}
      className={cn('list-item group', className)}
    >
      {/* Icon */}
      <div className={cn(
        'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl',
        colorClass
      )}>
        <Icon className="h-7 w-7" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
            {reward.title}
          </h3>
          {distance !== undefined && (
            <span className="flex items-center gap-0.5 text-xs text-muted-foreground whitespace-nowrap">
              <MapPin className="h-3 w-3" />
              {formatDistance(distance)}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {reward.partnerName}
        </p>
        
        {/* Points Badge */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 text-sm font-bold',
            canAfford ? 'text-accent' : 'text-muted-foreground'
          )}>
            <Coins className="h-3.5 w-3.5" />
            {reward.cost.toLocaleString('de-CH')}
          </span>
          {!canAfford && (
            <span className="text-xs text-muted-foreground">
              noch {(reward.cost - 500).toLocaleString('de-CH')} nötig
            </span>
          )}
        </div>
      </div>
      
      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}

interface RewardCardSkeletonProps {
  className?: string;
}

export function RewardCardSkeleton({ className }: RewardCardSkeletonProps) {
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
