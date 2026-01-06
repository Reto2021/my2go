import { Reward } from '@/lib/api';
import { cn } from '@/lib/utils';
import { TalerBadge } from './taler-badge';
import { Coffee, Utensils, Ticket, Star, Gift } from 'lucide-react';
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
  product: 'bg-secondary text-secondary-foreground',
  exclusive: 'bg-primary/10 text-primary',
};

export function RewardCard({ reward, className }: RewardCardProps) {
  const Icon = categoryIcons[reward.category] || Gift;
  
  return (
    <Link
      to={`/rewards/${reward.id}`}
      className={cn(
        'block card-elevated transition-all duration-200 active:scale-[0.98]',
        'hover:shadow-lg',
        className
      )}
    >
      <div className="flex gap-4">
        <div className={cn(
          'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl',
          categoryColors[reward.category]
        )}>
          <Icon className="h-7 w-7" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {reward.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            {reward.partnerName}
          </p>
        </div>
        
        <div className="shrink-0">
          <TalerBadge amount={reward.cost} size="sm" />
        </div>
      </div>
    </Link>
  );
}
