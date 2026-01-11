import { cn } from "@/lib/utils";

/**
 * Base Skeleton component with shimmer animation
 */
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full",
        "before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent",
        className
      )} 
      {...props} 
    />
  );
}

/**
 * Skeleton for text lines with varying widths
 */
function SkeletonText({ 
  lines = 1, 
  className,
  widths = ["100%"]
}: { 
  lines?: number;
  className?: string;
  widths?: string[];
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          className="h-4 rounded" 
          style={{ width: widths[i % widths.length] }}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for circular avatars
 */
function SkeletonAvatar({ 
  size = "md",
  className 
}: { 
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };
  
  return (
    <Skeleton 
      className={cn("rounded-full", sizeClasses[size], className)} 
    />
  );
}

/**
 * Skeleton for icon containers
 */
function SkeletonIcon({ 
  size = "md",
  rounded = "xl",
  className 
}: { 
  size?: "sm" | "md" | "lg";
  rounded?: "md" | "lg" | "xl" | "2xl" | "full";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };
  
  return (
    <Skeleton 
      className={cn(sizeClasses[size], `rounded-${rounded}`, className)} 
    />
  );
}

/**
 * Skeleton for badge/pill elements
 */
function SkeletonBadge({ className }: { className?: string }) {
  return (
    <Skeleton className={cn("h-5 w-16 rounded-full", className)} />
  );
}

/**
 * Skeleton for buttons
 */
function SkeletonButton({ 
  size = "md",
  className 
}: { 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "h-8 w-20",
    md: "h-10 w-24",
    lg: "h-12 w-32",
  };
  
  return (
    <Skeleton 
      className={cn("rounded-lg", sizeClasses[size], className)} 
    />
  );
}

/**
 * Card skeleton matching RewardCard layout
 */
function SkeletonRewardCard({ className }: { className?: string }) {
  return (
    <div className={cn("card-base p-4", className)}>
      <div className="flex items-center gap-4">
        {/* Icon container */}
        <SkeletonIcon size="lg" rounded="2xl" />
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Title + distance */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-3/5 rounded" />
            <Skeleton className="h-4 w-12 rounded" />
          </div>
          
          {/* Partner name */}
          <Skeleton className="h-4 w-2/5 rounded" />
          
          {/* Points badge */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-3 w-24 rounded" />
          </div>
        </div>
        
        {/* Arrow */}
        <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
      </div>
    </div>
  );
}

/**
 * Card skeleton matching PartnerCard layout
 */
function SkeletonPartnerCard({ className }: { className?: string }) {
  return (
    <div className={cn("card-base p-4", className)}>
      <div className="flex items-center gap-4">
        {/* Logo */}
        <SkeletonIcon size="lg" rounded="2xl" />
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Name */}
          <Skeleton className="h-5 w-3/5 rounded" />
          
          {/* Category */}
          <Skeleton className="h-4 w-1/3 rounded" />
          
          {/* Location & badges */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-4 w-12 rounded-full" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
        </div>
        
        {/* Arrow */}
        <Skeleton className="h-5 w-5 rounded flex-shrink-0" />
      </div>
    </div>
  );
}

/**
 * Profile header skeleton
 */
function SkeletonProfile({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center space-y-4", className)}>
      {/* Avatar */}
      <SkeletonAvatar size="xl" className="h-24 w-24" />
      
      {/* Name */}
      <Skeleton className="h-6 w-32 rounded" />
      
      {/* Email */}
      <Skeleton className="h-4 w-48 rounded" />
    </div>
  );
}

/**
 * Leaderboard row skeleton
 */
function SkeletonLeaderboardRow({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-card border border-border", className)}>
      {/* Rank */}
      <Skeleton className="w-8 h-8 rounded-full" />
      
      {/* Avatar */}
      <Skeleton className="w-10 h-10 rounded-full" />
      
      {/* Name */}
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-24 rounded" />
      </div>
      
      {/* Points */}
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  );
}

/**
 * Leaderboard podium skeleton for top 3
 */
function SkeletonLeaderboardPodium({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end justify-center gap-2 py-4", className)}>
      {/* 2nd place */}
      <div className="flex flex-col items-center">
        <Skeleton className="w-12 h-12 rounded-full mb-2" />
        <Skeleton className="h-3 w-16 rounded mb-1" />
        <Skeleton className="h-3 w-10 rounded mb-2" />
        <Skeleton className="w-20 h-16 rounded-t-lg" />
      </div>
      
      {/* 1st place */}
      <div className="flex flex-col items-center">
        <Skeleton className="w-16 h-16 rounded-full mb-2" />
        <Skeleton className="h-3 w-16 rounded mb-1" />
        <Skeleton className="h-3 w-10 rounded mb-2" />
        <Skeleton className="w-20 h-24 rounded-t-lg" />
      </div>
      
      {/* 3rd place */}
      <div className="flex flex-col items-center">
        <Skeleton className="w-12 h-12 rounded-full mb-2" />
        <Skeleton className="h-3 w-16 rounded mb-1" />
        <Skeleton className="h-3 w-10 rounded mb-2" />
        <Skeleton className="w-20 h-12 rounded-t-lg" />
      </div>
    </div>
  );
}

/**
 * Balance card skeleton
 */
function SkeletonBalanceCard({ className }: { className?: string }) {
  return (
    <div className={cn("card-base p-6", className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20 rounded" />
          <Skeleton className="h-10 w-32 rounded" />
          <Skeleton className="h-3 w-24 rounded" />
        </div>
        <Skeleton className="h-14 w-14 rounded-2xl" />
      </div>
    </div>
  );
}

/**
 * List item skeleton (generic)
 */
function SkeletonListItem({ 
  showAvatar = true,
  showMeta = true,
  className 
}: { 
  showAvatar?: boolean;
  showMeta?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3 p-3", className)}>
      {showAvatar && <SkeletonAvatar size="md" />}
      
      <div className="flex-1 min-w-0 space-y-2">
        <Skeleton className="h-4 w-3/4 rounded" />
        {showMeta && <Skeleton className="h-3 w-1/2 rounded" />}
      </div>
      
      <Skeleton className="h-5 w-5 rounded" />
    </div>
  );
}

/**
 * Stats card skeleton
 */
function SkeletonStatsCard({ className }: { className?: string }) {
  return (
    <div className={cn("card-base p-4 text-center", className)}>
      <Skeleton className="h-8 w-16 rounded mx-auto mb-2" />
      <Skeleton className="h-3 w-20 rounded mx-auto" />
    </div>
  );
}

/**
 * Badge skeleton for gamification badges
 */
function SkeletonBadgeCard({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center p-4", className)}>
      <Skeleton className="h-16 w-16 rounded-full mb-3" />
      <Skeleton className="h-4 w-20 rounded mb-1" />
      <Skeleton className="h-3 w-24 rounded" />
    </div>
  );
}

export { 
  Skeleton,
  SkeletonText,
  SkeletonAvatar,
  SkeletonIcon,
  SkeletonBadge,
  SkeletonButton,
  SkeletonRewardCard,
  SkeletonPartnerCard,
  SkeletonProfile,
  SkeletonLeaderboardRow,
  SkeletonLeaderboardPodium,
  SkeletonBalanceCard,
  SkeletonListItem,
  SkeletonStatsCard,
  SkeletonBadgeCard,
};
