import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RewardCard } from '@/components/ui/reward-card';
import { SkeletonRewardCard } from '@/components/ui/skeleton';
import { RecentBadgesBar } from '@/components/badges/RecentBadgesBar';
import { TopListenersWidget } from '@/components/social-proof/TopListenersWidget';
import { ActivityTicker } from '@/components/social-proof/LiveActivityFeed';
import { ReferralGameCard } from '@/components/home/ReferralGameCard';
import { InstallBanner } from '@/components/home/InstallBanner';
import { NewPartnerBanner } from '@/components/home/NewPartnerBanner';
import { LiveHeaderButton, LiveEventsPanel } from '@/components/radio/LiveEventsPanel';
import { useLiveEventsStore } from '@/lib/live-events-store';
import { ChevronRight, Navigation, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SessionModeHomeProps } from './types';

export function SessionModeHome({ 
  displayName, 
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
  
  useEffect(() => {
    fetchEvents();
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
  }, [fetchEvents, subscribeToRealtime]);
  
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Hallo';
    return 'Guten Abend';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header with Greeting + Live Activity + Live Button */}
      <header className="container pt-4 pb-3">
        <div className="animate-in space-y-2">
          {/* Greeting row with Live button */}
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {getGreeting()}, <span className="font-semibold text-foreground">{displayName || 'Hörer'}</span> 👋
            </p>
            <LiveHeaderButton 
              onClick={() => setShowLiveEvents(true)}
              hasLiveEvents={hasLiveEvents}
            />
          </div>
          
          {/* Live Activity Ticker - Social Proof */}
          <ActivityTicker className="text-xs" />
        </div>
      </header>
      
      {/* Live Events Panel */}
      <LiveEventsPanel 
        isOpen={showLiveEvents} 
        onClose={() => setShowLiveEvents(false)} 
      />
      
      {/* Install Banner - for users who haven't installed the PWA */}
      <section className="container pb-3">
        <InstallBanner />
      </section>
      
      {/* New Partner Banner - Show when new partners are in user's area */}
      <section className="container pb-3">
        <NewPartnerBanner />
      </section>
      
      {/* Referral Game Card - Gamified */}
      <section className="container pb-4">
        <ReferralGameCard />
      </section>
      
      {/* Rewards - Primary Content */}
      <section className="container section" data-onboarding="rewards-section">
        <div className="section-header">
          <h2 className="section-title">
            {userLocation ? 'In deiner Nähe' : 'Gutscheine für dich'}
          </h2>
          <Link to="/rewards" className="section-link">
            Alle <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* Location Status Chip */}
        {userLocation ? (
          <button
            onClick={onClearLocation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-3"
          >
            <Navigation className="h-3.5 w-3.5" />
            Standort aktiv
            <X className="h-3 w-3 ml-1" />
          </button>
        ) : (
          <button
            onClick={onRequestLocation}
            disabled={isRequestingLocation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground mb-3 hover:bg-muted/80 transition-colors"
          >
            <Navigation className={cn("h-3.5 w-3.5", isRequestingLocation && "animate-pulse")} />
            {isRequestingLocation ? 'Suche...' : 'Standort aktivieren'}
          </button>
        )}
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRewardCard key={i} />
            ))
          ) : rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Keine Gutscheine verfügbar.</p>
            </div>
          ) : (
            rewards.map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))
          )}
        </div>
      </section>
      
      {/* Recent Badges - Compact */}
      <section className="container pb-4">
        <RecentBadgesBar />
      </section>
      
      {/* Social Proof - Compact */}
      <section className="container pb-4">
        <TopListenersWidget />
      </section>
    </div>
  );
}
