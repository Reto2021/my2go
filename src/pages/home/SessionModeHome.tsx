import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ComebackBanner } from '@/components/home/ComebackBanner';
import { WeeklyWrappedBanner } from '@/components/wrapped/WeeklyWrappedBanner';
import { CampaignBanner } from '@/components/home/CampaignBanner';
import { useGeoProximityAlerts } from '@/hooks/useGeoProximityAlerts';
import { RecommendedRewardsSection } from '@/components/rewards/RecommendedRewardsSection';
import { useComebackBonus } from '@/hooks/useComebackBonus';
import { RewardCard } from '@/components/ui/reward-card';
import { SkeletonRewardCard } from '@/components/ui/skeleton';
import { BalanceCard } from '@/components/ui/balance-card';
import { RecentBadgesBar } from '@/components/badges/RecentBadgesBar';
import { TopListenersWidget } from '@/components/social-proof/TopListenersWidget';
import { ActivityTicker } from '@/components/social-proof/LiveActivityFeed';
import { ReferralGameCard } from '@/components/home/ReferralGameCard';
import { InstallBanner } from '@/components/home/InstallBanner';
import { NewPartnerBanner } from '@/components/home/NewPartnerBanner';
import { LiveHeaderButton, LiveEventsPanel } from '@/components/radio/LiveEventsPanel';
import { FeaturedSponsorsBar } from '@/components/sponsors/FeaturedSponsorsBar';
import { PlusBanner } from '@/components/subscription/PlusBanner';
import { PlusExpiryBanner } from '@/components/subscription/PlusExpiryBanner';
import { DriveSearchSheet } from '@/components/drive/DriveSearchSheet';
import { HeroDynamic } from '@/components/ui/HeroDynamic';
import { HeroAnimations } from '@/components/ui/HeroAnimations';
import { useLiveEventsStore } from '@/lib/live-events-store';
import { ChevronRight, Navigation as NavigationIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SessionModeHomeProps } from './types';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

export function SessionModeHome({
  displayName, 
  userId,
  balance, 
  rewards, 
  isLoading, 
  userLocation,
  onClearLocation,
  onRequestLocation,
  isRequestingLocation
}: SessionModeHomeProps) {
  const { hasLiveEvents, fetchEvents, subscribeToRealtime } = useLiveEventsStore();
  const [showLiveEvents, setShowLiveEvents] = useState(false);
  const [showDriveSearch, setShowDriveSearch] = useState(false);
  useGeoProximityAlerts();
  
  const { showComebackBanner, isClaiming, claimBonus, dismissBanner } = useComebackBonus();
  const { greeting, timeOfDay } = useTimeOfDay();
  const showBirds = timeOfDay !== 'night';
  
  useEffect(() => {
    fetchEvents();
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
  }, [fetchEvents, subscribeToRealtime]);

  return (
    <div className="min-h-screen bg-background -mt-20">
      {/* Compact Dynamic Hero Header */}
      <section className="relative overflow-hidden pt-20" style={{ minHeight: '32vh' }}>
        <HeroDynamic />
        {showBirds && <HeroAnimations />}

        {/* Bottom gradient fade into background */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-24 z-[4] pointer-events-none"
          style={{ background: 'linear-gradient(to top, hsl(var(--background)), transparent)' }}
        />
        
        {/* Greeting + Balance overlay */}
        <div className="container relative z-10 pt-6 pb-6 flex flex-col justify-end" style={{ minHeight: '12vh' }}>
          <div className="animate-in space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-white drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.3)' }}>
                {greeting}, <span className="font-bold">{displayName || 'Entdecker'}</span> 👋
              </p>
              <LiveHeaderButton onClick={() => setShowLiveEvents(true)} hasLiveEvents={hasLiveEvents} />
            </div>
            <div className="drop-shadow-lg" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.6), 0 0 20px rgba(0,0,0,0.3)' }}>
              <ActivityTicker className="text-xs text-white/80" />
            </div>
          </div>
        </div>
      </section>

      <LiveEventsPanel isOpen={showLiveEvents} onClose={() => setShowLiveEvents(false)} />

      {/* Balance Card – overlaps hero slightly */}
      {balance && (
        <section className="container -mt-4 relative z-20 pb-4">
          <BalanceCard balance={balance} userId={userId} />
        </section>
      )}

      {/* 1. Seasonal Campaign Banner */}
      <CampaignBanner />

      {/* 2. New Partners */}
      <section className="container pb-3">
        <NewPartnerBanner />
      </section>

      {/* Drive Mode Quick Action */}
      <section className="container pb-3">
        <button
          onClick={() => setShowDriveSearch(true)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-accent/10 border border-accent/20 hover:bg-accent/15 transition-colors"
        >
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shrink-0">
            <NavigationIcon className="h-5 w-5 text-accent-foreground" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="font-semibold text-sm">Wohin geht's?</p>
            <p className="text-xs text-muted-foreground">Partner in der Nähe finden 📍</p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </button>
      </section>
      
      <section className="container pb-3">
        <InstallBanner />
      </section>
      
      {showComebackBanner && (
        <section className="container pb-3">
          <ComebackBanner 
            isVisible={showComebackBanner} 
            isClaiming={isClaiming} 
            onClaim={claimBonus} 
            onDismiss={dismissBanner} 
          />
        </section>
      )}
      
      <section className="container pb-3">
        <PlusBanner />
      </section>
      
      <section className="container pb-3">
        <PlusExpiryBanner />
      </section>
      
      <section className="container pb-3">
        <WeeklyWrappedBanner />
      </section>

      <section className="container pb-4">
        <ReferralGameCard />
      </section>
      
      <RecommendedRewardsSection />
      
      <section className="container section" data-onboarding="rewards-section">
        <div className="section-header">
          <h2 className="section-title">{userLocation ? 'In deiner Nähe' : 'Gutscheine für dich'}</h2>
          <Link to="/rewards" className="section-link">Alle <ChevronRight className="h-4 w-4" /></Link>
        </div>
        
        {userLocation ? (
          <button onClick={onClearLocation} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-3">
            <NavigationIcon className="h-3.5 w-3.5" />
            Standort aktiv
            <X className="h-3 w-3 ml-1" />
          </button>
        ) : (
          <button onClick={onRequestLocation} disabled={isRequestingLocation} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground mb-3 hover:bg-muted/80 transition-colors">
            <NavigationIcon className={cn("h-3.5 w-3.5", isRequestingLocation && "animate-pulse")} />
            {isRequestingLocation ? 'Suche...' : 'Standort aktivieren'}
          </button>
        )}
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <SkeletonRewardCard key={i} />)
          ) : rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground"><p>Keine Gutscheine verfügbar.</p></div>
          ) : (
            rewards.map(reward => <RewardCard key={reward.id} reward={reward} />)
          )}
        </div>
      </section>
      
      <section className="container pb-4">
        <RecentBadgesBar />
      </section>
      
      <section className="container pb-4">
        <TopListenersWidget />
      </section>
      
      <FeaturedSponsorsBar />
      
      <DriveSearchSheet open={showDriveSearch} onOpenChange={setShowDriveSearch} />
    </div>
  );
}
