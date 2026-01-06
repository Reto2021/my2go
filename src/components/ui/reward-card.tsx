import { Reward } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Coffee, Ticket, Star, Gift } from 'lucide-react';
import { Link } from 'react-router-dom';

interface RewardCardProps {
  reward: Reward;
  className?: string;
}

const categoryIcons = {
  experience: Star,
  discount: Ticket,
  product: Gift,
  exclusive: Coffee,
};

const categoryColors = {
  experience: 'bg-accent/10 text-accent',
  discount: 'bg-success/10 text-success',
  product: 'bg-primary/10 text-primary',
  exclusive: 'bg-primary/10 text-primary',
};

export function RewardCard({ reward, className }: RewardCardProps) {
  const Icon = categoryIcons[reward.category] || Gift;
  const colorClass = categoryColors[reward.category] || categoryColors.product;
  
  return (
    <Link
      to={`/rewards/${reward.id}`}
      className={cn('card-interactive p-4', className)}
    >
      <div className="flex gap-4">
        {/* Icon */}
        <div className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
          colorClass
        )}>
          <Icon className="h-6 w-6" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {reward.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {reward.partnerName}
          </p>
        </div>
        
        {/* Cost Badge */}
        <div className="shrink-0 flex items-center">
          <span className="badge-accent">
            {reward.cost.toLocaleString('de-CH')} T
          </span>
        </div>
      </div>
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
        <div className="h-14 w-14 shrink-0 rounded-2xl bg-muted animate-pulse-soft" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-3/4 rounded bg-muted animate-pulse-soft" />
          <div className="h-4 w-1/2 rounded bg-muted animate-pulse-soft" />
        </div>
        <div className="h-6 w-16 rounded-full bg-muted animate-pulse-soft" />
      </div>
    </div>
  );
}
