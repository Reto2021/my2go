import { Skeleton, SkeletonRewardCard, SkeletonBalanceCard } from '@/components/ui/skeleton';

export function HomePageSkeleton() {
  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Greeting skeleton */}
      <header className="container pt-6 pb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded" />
          <Skeleton className="h-5 w-24 rounded" />
        </div>
      </header>
      
      {/* Balance Card & Widgets */}
      <section className="container py-4 space-y-3">
        <SkeletonBalanceCard />
        
        {/* Streak Card skeleton */}
        <div className="card-base p-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-14 w-14 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32 rounded" />
              <Skeleton className="h-4 w-48 rounded" />
            </div>
          </div>
        </div>
        
        {/* Recent badges skeleton */}
        <div className="flex gap-2 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-12 rounded-full flex-shrink-0" />
          ))}
        </div>
      </section>
      
      {/* Quick Actions skeleton */}
      <section className="container section">
        <Skeleton className="h-5 w-28 rounded mb-5" />
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton className="h-12 w-12 rounded-2xl" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
          ))}
        </div>
      </section>
      
      {/* Rewards skeleton */}
      <section className="container section">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-5 w-24 rounded" />
          <Skeleton className="h-4 w-12 rounded" />
        </div>
        <Skeleton className="h-7 w-28 rounded-full mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonRewardCard key={i} />
          ))}
        </div>
      </section>
    </div>
  );
}
