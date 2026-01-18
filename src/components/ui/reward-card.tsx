import { memo } from 'react';
import { Reward } from '@/lib/supabase-helpers';
import { useBalance } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Coffee, Ticket, Star, Gift, Coins, ChevronRight, MapPin, Percent, Sparkles, Check, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { SponsorBadgeCompact, type RewardSponsor } from '@/components/sponsors/SponsorBadge';

interface RewardCardProps {
  reward: Reward;
  className?: string;
  distance?: number; // Distance in km
  sponsors?: RewardSponsor[]; // Sponsors for this reward
}

// Map reward_type to icons and colors
const typeConfig = {
  experience: { icon: Star, colorClass: 'bg-accent/15 text-accent' },
  fixed_discount: { icon: Ticket, colorClass: 'bg-success/15 text-success' },
  percent_discount: { icon: Percent, colorClass: 'bg-success/15 text-success' },
  free_item: { icon: Gift, colorClass: 'bg-primary/30 text-secondary' },
  topup_bonus: { icon: Sparkles, colorClass: 'bg-secondary/10 text-secondary' },
  two_for_one: { icon: Users, colorClass: 'bg-accent/15 text-accent' },
};

export const RewardCard = memo(function RewardCard({ reward, className, distance, sponsors }: RewardCardProps) {
  const { balance } = useBalance();
  const config = typeConfig[reward.reward_type] || typeConfig.free_item;
  const Icon = config.icon;
  const colorClass = config.colorClass;
  
  const userBalance = balance?.taler_balance ?? 0;
  const canAfford = reward.taler_cost <= userBalance;
  
  const formatDistance = (km: number) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };
  
  // Get partner name from nested partner object
  const partnerName = reward.partner?.name || 'Partner';
  
  // Get first sponsor if available
  const firstSponsor = sponsors?.[0]?.sponsor;
  
  return (
    <Link
      to={`/rewards/${reward.id}`}
      className={cn('card-base p-4 flex items-center gap-4 group relative overflow-hidden', className)}
    >
      {/* "Jetzt einlösbar" Badge - Top Right */}
      {canAfford && userBalance > 0 && (
        <div className="absolute -top-0 -right-0 z-10">
          <div className="bg-success text-success-foreground text-xs font-bold px-2.5 py-1.5 rounded-bl-xl flex items-center gap-1">
            <Check className="h-3.5 w-3.5" />
            Jetzt einlösbar
          </div>
        </div>
      )}
      
      {/* Icon */}
      <div className={cn(
        'flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105',
        colorClass,
        canAfford && 'ring-2 ring-success/30'
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
            <span className="flex items-center gap-0.5 text-sm text-foreground/70 whitespace-nowrap">
              <MapPin className="h-3.5 w-3.5" />
              {formatDistance(distance)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <p className="text-sm text-foreground/70 line-clamp-1">
            {partnerName}
          </p>
          {(reward as any).max_per_user === 1 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-accent/15 text-accent border-0">
              Einmalig
            </Badge>
          )}
          {firstSponsor && (
            <SponsorBadgeCompact sponsor={firstSponsor} />
          )}
        </div>
        
        {/* Points Badge */}
        <div className="flex items-center gap-2 mt-1.5">
          <span className={cn(
            'inline-flex items-center gap-1 text-sm font-bold',
            canAfford ? 'text-success' : 'text-muted-foreground'
          )}>
            <Coins className="h-3.5 w-3.5" />
            {reward.taler_cost.toLocaleString('de-CH')}
          </span>
          {!canAfford && userBalance > 0 && (
            <span className="text-sm text-foreground/60">
              noch {(reward.taler_cost - userBalance).toLocaleString('de-CH')} nötig
            </span>
          )}
        </div>
      </div>
      
      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
});

// Re-export the content-aware skeleton
export { SkeletonRewardCard as RewardCardSkeleton } from '@/components/ui/skeleton';
