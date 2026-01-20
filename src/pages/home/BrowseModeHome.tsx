import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RewardCard } from '@/components/ui/reward-card';
import { PartnerCard } from '@/components/ui/partner-card';
import { SkeletonRewardCard, SkeletonPartnerCard } from '@/components/ui/skeleton';
import { InstallBanner } from '@/components/home/InstallBanner';
import { LiveHeaderButton } from '@/components/radio/LiveEventsPanel';
import { FeaturedSponsorsBar } from '@/components/sponsors/FeaturedSponsorsBar';
import { GuestSignupSheet } from '@/components/funnel/GuestSignupSheet';
import { FirstTalerCelebration } from '@/components/taler/FirstTalerCelebration';
import { useLiveEventsStore } from '@/lib/live-events-store';
import { useRadioStore } from '@/lib/radio-store';
import { useGuestRadioRewards } from '@/hooks/useGuestRadioRewards';
import { Gift, ChevronRight, Play, Pause, ArrowRight, Loader2, MapPin, Coins } from 'lucide-react';
import { BrowseModeHomeProps, FeatureChipProps, colorClasses } from './types';
import { cn } from '@/lib/utils';

export function BrowseModeHome({ rewards, partners, isLoading, onLogin }: BrowseModeHomeProps) {
  const { hasLiveEvents, fetchEvents, subscribeToRealtime } = useLiveEventsStore();
  const { isPlaying, isLoading: isRadioLoading, togglePlay, nowPlaying, setPlayerExpanded } = useRadioStore();
  
  // Guest rewards tracking
  const {
    totalEarned,
    currentSessionDuration,
    shouldShowSignup,
    showFirstTalerCelebration,
    firstTalerAmount,
    closeFirstTalerCelebration,
    markSignupShown,
  } = useGuestRadioRewards();

  useEffect(() => {
    fetchEvents();
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
  }, [fetchEvents, subscribeToRealtime]);

  const handleLiveClick = () => {
    onLogin();
  };
  
  const listeningMinutes = Math.floor(currentSessionDuration / 60);
  
  return (
    <div className="min-h-screen bg-background -mt-20">
      {/* Hero Section - Simplified 3-Second Pitch */}
      <section className="hero-section text-secondary pt-20">
        {/* City Skyline */}
        <div className="skyline-container">
          <div className="skyline-distant" />
          <div className="skyline-mid" />
          <div className="skyline-front" />
        </div>
        
        {/* Clouds */}
        <div className="clouds-container">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
        </div>
        
        <div className="container relative z-10 pt-6 pb-28">
          {/* Header row */}
          <div className="flex items-center justify-between mb-6">
            <InstallBanner />
            <LiveHeaderButton 
              onClick={handleLiveClick}
              hasLiveEvents={hasLiveEvents}
            />
          </div>
          
          <div className="animate-in text-center">
            {/* Clear 3-Second Pitch */}
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-6">
              <span className="block">Hör Radio.</span>
              <span className="block">Sammle Taler.</span>
              <span className="relative inline-block mt-1">
                <span className="absolute -inset-x-3 -inset-y-1 bg-accent rounded-lg -rotate-1" />
                <span className="relative text-secondary font-black">Geniess vor Ort.</span>
              </span>
            </h1>
            
            {/* Prominent Play Button */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <button 
                onClick={() => {
                  // First expand the player to prevent flickering, then toggle play
                  if (!isPlaying) {
                    setPlayerExpanded(true);
                    // Small delay to let the expansion animation start before audio loads
                    requestAnimationFrame(() => {
                      togglePlay();
                    });
                  } else {
                    togglePlay();
                  }
                }}
                disabled={isRadioLoading}
                className={cn(
                  "relative w-24 h-24 rounded-full flex items-center justify-center",
                  "bg-accent shadow-2xl shadow-accent/40",
                  "hover:scale-105 active:scale-95 transition-all duration-200",
                  "ring-4 ring-accent/30 ring-offset-4 ring-offset-primary/20",
                  isPlaying && "animate-pulse"
                )}
              >
                {isRadioLoading ? (
                  <Loader2 className="h-10 w-10 text-secondary animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-10 w-10 text-secondary ml-0" />
                ) : (
                  <Play className="h-10 w-10 text-secondary ml-1" />
                )}
              </button>
              
              {/* Now Playing or Call to Action */}
              <div className="text-center">
                {isPlaying && nowPlaying ? (
                  <p className="text-secondary/80 text-sm font-medium">
                    <span className="inline-block w-2 h-2 bg-accent rounded-full mr-2 animate-pulse" />
                    {nowPlaying.artist} – {nowPlaying.title}
                  </p>
                ) : (
                  <p className="text-secondary/70 text-lg font-semibold">
                    Jetzt Radio 2Go hören
                  </p>
                )}
                
                {/* Guest Taler Earned Badge */}
                {totalEarned > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/20 text-accent">
                    <Coins className="h-4 w-4" />
                    <span className="font-bold">{totalEarned} Taler</span>
                    <span className="text-secondary/70 text-sm">gesammelt!</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Secondary CTA */}
            <button 
              onClick={onLogin}
              className="btn-primary group"
            >
              {totalEarned > 0 ? 'Taler sichern & anmelden' : 'Kostenlos anmelden & Taler sammeln'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
      
      {/* How it Works - Visual Steps */}
      <section className="container -mt-12 relative z-20">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="card-glass p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-semibold text-lg">1</div>
            <span className="text-xs sm:text-sm font-semibold text-foreground">Hören</span>
          </div>
          <div className="card-glass p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-lg">2</div>
            <span className="text-xs sm:text-sm font-semibold text-foreground">Sammeln</span>
          </div>
          <div className="card-glass p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-semibold text-lg">3</div>
            <span className="text-xs sm:text-sm font-semibold text-foreground">Geniessen</span>
          </div>
        </div>
      </section>
      
      {/* Rewards Preview */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Beliebte Gutscheine</h2>
          <Link to="/rewards" className="section-link">
            Alle anzeigen <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <SkeletonRewardCard key={i} />
            ))
          ) : rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Gutscheine verfügbar
            </div>
          ) : (
            rewards.slice(0, 3).map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))
          )}
        </div>
      </section>
      
      {/* Partners Preview */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">Lokale Partner entdecken</h2>
          <Link to="/partner" className="section-link">
            Alle anzeigen <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <SkeletonPartnerCard key={i} />
            ))
          ) : partners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Keine Partner verfügbar
            </div>
          ) : (
            partners.slice(0, 2).map(partner => (
              <PartnerCard key={partner.id} partner={partner} minTalerCost={partner.minRewardCost} />
            ))
          )}
        </div>
      </section>
      
      {/* Partner Section */}
      <section className="container pb-8">
        <div className="p-5 rounded-2xl bg-accent/10 border border-accent/20">
          <h3 className="font-bold text-secondary text-center mb-2">Für Geschäftspartner</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Werde Teil des My 2Go Netzwerks und erreiche neue Kunden.
          </p>
          <div className="flex gap-3 justify-center">
            <Link 
              to="/go" 
              className="btn-primary text-sm py-2.5 px-5"
            >
              Partner werden
            </Link>
            <Link 
              to="/auth?partner=true" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-secondary/20 text-secondary font-semibold text-sm hover:bg-secondary/5 transition-colors"
            >
              Partner Login
            </Link>
          </div>
        </div>
      </section>
      
      {/* Featured Platinum Sponsors */}
      <FeaturedSponsorsBar />
      
      {/* Info / Footer */}
      <section className="container pb-32">
        <div className="p-6 rounded-2xl bg-secondary/5 border border-secondary/10">
          <p className="text-sm text-muted-foreground text-center mb-3">
            2Go Taler sind Bonuspunkte und nicht auszahlbar.
          </p>
          <div className="flex justify-center gap-4 text-xs text-muted-foreground/70">
            <Link to="/impressum" className="hover:text-foreground transition-colors">Impressum</Link>
            <Link to="/datenschutz" className="hover:text-foreground transition-colors">Datenschutz</Link>
            <Link to="/agb" className="hover:text-foreground transition-colors">AGB</Link>
          </div>
        </div>
      </section>
      
      {/* Guest Signup Prompt Sheet - after 5 min listening */}
      <GuestSignupSheet
        isOpen={shouldShowSignup}
        onClose={markSignupShown}
        earnedTaler={totalEarned}
        listeningMinutes={listeningMinutes}
      />
      
      {/* First Taler Celebration */}
      <FirstTalerCelebration
        isOpen={showFirstTalerCelebration}
        onClose={closeFirstTalerCelebration}
        talerAmount={firstTalerAmount}
        isGuest={true}
      />
    </div>
  );
}
