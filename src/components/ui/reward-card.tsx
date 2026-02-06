import { memo, useState } from 'react';
import { Reward } from '@/lib/supabase-helpers';
import { useBalance } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Coffee, Ticket, Star, Gift, Coins, ChevronRight, MapPin, Percent, Sparkles, Check, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { SponsorBadgeCompact, type RewardSponsor } from '@/components/sponsors/SponsorBadge';
import { useSubscription, isPremiumReward, isGatedReward } from '@/hooks/useSubscription';
import { PremiumRewardOverlay, PremiumBadge } from '@/components/subscription/PremiumRewardOverlay';
import { PlusUpgradeSheet } from '@/components/subscription/PlusUpgradeSheet';

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
  free_item: { icon: Gift, colorClass: 'bg-primary/30 text-primary-foreground' },
  topup_bonus: { icon: Sparkles, colorClass: 'bg-primary/20 text-primary-foreground' },
  two_for_one: { icon: Users, colorClass: 'bg-accent/15 text-accent' },
};

export const RewardCard = memo(function RewardCard({ reward, className, distance, sponsors }: RewardCardProps) {
  const { balance } = useBalance();
  const { isSubscribed, isTrial, isLoading: subLoading } = useSubscription();
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);
  
  const config = typeConfig[reward.reward_type] || typeConfig.free_item;
  const Icon = config.icon;
  const colorClass = config.colorClass;
  
  // Plus members get 50% discount on Taler cost
  const isPlusUser = isSubscribed || isTrial;
  const discountedCost = isPlusUser ? Math.floor(reward.taler_cost * 0.5) : reward.taler_cost;
  const originalCost = reward.taler_cost;
  const hasDiscount = isPlusUser && discountedCost < originalCost;
  
  const userBalance = balance?.taler_balance ?? 0;
  const canAfford = discountedCost <= userBalance; // Use discounted cost for affordability check
  
  // Check if this is a premium reward and user doesn't have subscription
  const isPremium = isPremiumReward(reward.reward_type);
  const isGated = isGatedReward(reward.reward_type, reward.taler_cost);
  const showPremiumOverlay = (isPremium || (isGated && !isPlusUser)) && !isSubscribed && !subLoading;
  
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
    <>
      <Link
        to={showPremiumOverlay ? '#' : `/rewards/${reward.id}`}
        onClick={(e) => {
          if (showPremiumOverlay) {
            e.preventDefault();
            setShowUpgradeSheet(true);
          }
        }}
        className={cn(
          'card-base p-4 flex items-center gap-4 group relative overflow-hidden',
          showPremiumOverlay && 'cursor-pointer',
          className
        )}
      >
        {/* Premium Overlay for non-subscribers */}
        {showPremiumOverlay && (
          <PremiumRewardOverlay onUpgradeClick={() => setShowUpgradeSheet(true)} />
        )}
        
        {/* Premium Badge - Top Left */}
        {isPremium && !showPremiumOverlay && (
          <div className="absolute top-2 left-2 z-10">
            <PremiumBadge />
          </div>
        )}
        
        {/* "Jetzt einlösbar" Badge - Top Right */}
        {canAfford && userBalance > 0 && !showPremiumOverlay && (
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
          canAfford && !showPremiumOverlay && 'ring-2 ring-success/30',
          showPremiumOverlay && 'blur-[2px]'
        )}>
          <Icon className="h-7 w-7" />
        </div>
        
        {/* Content */}
        <div className={cn("flex-1 min-w-0", showPremiumOverlay && 'blur-[2px]')}>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
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
          
          {/* Points Badge with Plus Discount */}
          <div className="flex items-center gap-2 mt-1.5">
            <span className={cn(
              'inline-flex items-center gap-1 text-sm font-bold',
              canAfford && !showPremiumOverlay ? 'text-success' : 'text-muted-foreground'
            )}>
              <Coins className="h-3.5 w-3.5" />
              {hasDiscount ? (
                <>
                  <span className="line-through text-muted-foreground/60 font-normal text-xs">
                    {originalCost.toLocaleString('de-CH')}
                  </span>
                  <span className="text-success">{discountedCost.toLocaleString('de-CH')}</span>
                </>
              ) : (
                discountedCost.toLocaleString('de-CH')
              )}
            </span>
            {!canAfford && userBalance > 0 && !showPremiumOverlay && (
              <span className="text-sm text-foreground/60">
                noch {(discountedCost - userBalance).toLocaleString('de-CH')} nötig
              </span>
            )}
          </div>
        </div>
        
        {/* Arrow */}
        <ChevronRight className={cn(
          "h-5 w-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-0.5 transition-all flex-shrink-0",
          showPremiumOverlay && 'blur-[2px]'
        )} />
      </Link>
      
      <PlusUpgradeSheet 
        open={showUpgradeSheet} 
        onOpenChange={setShowUpgradeSheet}
        trigger="reward"
      />
    </>
  );
});

// Re-export the content-aware skeleton
export { SkeletonRewardCard as RewardCardSkeleton } from '@/components/ui/skeleton';
