import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RewardCard } from '@/components/ui/reward-card';
import { PartnerCard } from '@/components/ui/partner-card';
import { SkeletonRewardCard, SkeletonPartnerCard } from '@/components/ui/skeleton';
import { InstallBanner } from '@/components/home/InstallBanner';
import { LiveHeaderButton } from '@/components/radio/LiveEventsPanel';
import { FeaturedSponsorsBar } from '@/components/sponsors/FeaturedSponsorsBar';
import { GuestSignupSheet } from '@/components/funnel/GuestSignupSheet';
import { FirstTalerCelebration } from '@/components/taler/FirstTalerCelebration';
import { TriggerSlider } from '@/components/home/TriggerSlider';
import { DriveSearchSheet } from '@/components/drive/DriveSearchSheet';
import { useLiveEventsStore } from '@/lib/live-events-store';
import { useRadioStore } from '@/lib/radio-store';
import { useGuestRadioRewards } from '@/hooks/useGuestRadioRewards';
import { Gift, ChevronRight, Play, Pause, ArrowRight, Loader2, Coins, Radio, Navigation } from 'lucide-react';
import { BrowseModeHomeProps } from './types';
import { cn } from '@/lib/utils';

export function BrowseModeHome({ rewards, partners, isLoading, onLogin }: BrowseModeHomeProps) {
  const { hasLiveEvents, fetchEvents, subscribeToRealtime } = useLiveEventsStore();
  const { isPlaying, isLoading: isRadioLoading, togglePlay, nowPlaying, setPlayerExpanded } = useRadioStore();
  const [showDriveSearch, setShowDriveSearch] = useState(false);
  
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
      {/* Hero Section */}
      <section className="hero-section text-white pt-20">
        <div className="skyline-container">
          <div className="skyline-distant" />
          <div className="skyline-mid" />
          <div className="skyline-front" />
        </div>
        <div className="clouds-container">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
        </div>
        
        <div className="container relative z-10 pt-6 pb-28">
          <div className="flex items-center justify-between mb-6">
            <InstallBanner />
            <LiveHeaderButton onClick={handleLiveClick} hasLiveEvents={hasLiveEvents} />
          </div>
          
          <div className="animate-in text-center">
            <h1 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-6">
              <span className="block relative">
                Hör Radio.
                <span className="absolute -top-1 -right-2 sm:-right-4 px-1.5 py-0.5 text-[10px] sm:text-xs font-bold bg-accent text-accent-foreground rounded-full whitespace-nowrap rotate-3 shadow-lg">
                  Neu: Alle 🇨🇭 Sender
                </span>
              </span>
              <span className="block">Sammle Taler.</span>
              <TriggerSlider />
            </h1>
            
            {/* Dual Play + Route Buttons */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="flex items-center gap-6">
                {/* Play Button */}
                <button 
                  onClick={() => {
                    togglePlay();
                    if (!isPlaying) setPlayerExpanded(true);
                  }}
                  disabled={isRadioLoading}
                  className={cn(
                    "relative w-20 h-20 rounded-full flex items-center justify-center",
                    "bg-accent shadow-2xl shadow-accent/40",
                    "hover:scale-105 active:scale-95 transition-all duration-200",
                    "ring-4 ring-accent/30 ring-offset-2 ring-offset-primary/20",
                    isPlaying && "animate-pulse"
                  )}
                >
                  {isRadioLoading ? (
                    <Loader2 className="h-8 w-8 text-accent-foreground animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-8 w-8 text-accent-foreground" />
                  ) : (
                    <Play className="h-8 w-8 text-accent-foreground ml-1" />
                  )}
                  <span className="absolute -bottom-5 text-[10px] font-bold text-white/70 uppercase tracking-wider">Play</span>
                </button>

                {/* Route Button */}
                <button
                  onClick={() => setShowDriveSearch(true)}
                  className={cn(
                    "relative w-20 h-20 rounded-full flex items-center justify-center",
                    "bg-white/15 backdrop-blur-sm border-2 border-white/30",
                    "hover:scale-105 hover:bg-white/25 active:scale-95 transition-all duration-200",
                    "shadow-xl"
                  )}
                >
                  <Navigation className="h-8 w-8 text-white" />
                  <span className="absolute -bottom-5 text-[10px] font-bold text-white/70 uppercase tracking-wider">Route</span>
                </button>
              </div>
              
              <div className="text-center mt-4">
                {isPlaying && nowPlaying ? (
                  <p className="text-white/80 text-sm font-medium">
                    <span className="inline-block w-2 h-2 bg-accent rounded-full mr-2 animate-pulse" />
                    {nowPlaying.artist} – {nowPlaying.title}
                  </p>
                ) : (
                  <p className="text-white/80 text-lg font-semibold">
                    Hören &amp; Navigieren
                  </p>
                )}
                
                {totalEarned > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 text-white mt-2 mx-auto w-fit">
                    <Coins className="h-4 w-4" />
                    <span className="font-bold">{totalEarned} Taler</span>
                    <span className="text-white/70 text-sm">gesammelt!</span>
                  </div>
                )}
              </div>
            </div>
            
            <button onClick={onLogin} className="btn-primary group">
              {totalEarned > 0 ? 'Taler sichern & anmelden' : 'Kostenlos anmelden & Taler sammeln'}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
      
      {/* How it Works */}
      <section className="container -mt-12 relative z-20">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="card-glass p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Radio className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-800">Hören</span>
          </div>
          <div className="card-glass p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Coins className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-800">Sammeln</span>
          </div>
          <div className="card-glass p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Gift className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-800">Geniessen</span>
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
            Array.from({ length: 3 }).map((_, i) => <SkeletonRewardCard key={i} />)
          ) : rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Keine Gutscheine verfügbar</div>
          ) : (
            rewards.slice(0, 3).map(reward => <RewardCard key={reward.id} reward={reward} />)
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
            Array.from({ length: 2 }).map((_, i) => <SkeletonPartnerCard key={i} />)
          ) : partners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Keine Partner verfügbar</div>
          ) : (
            partners.slice(0, 2).map(partner => <PartnerCard key={partner.id} partner={partner} minTalerCost={partner.minRewardCost} />)
          )}
        </div>
      </section>
      
      {/* Partner Section */}
      <section className="container pb-8">
        <div className="p-5 rounded-2xl bg-primary/10 border border-primary/20">
          <h3 className="font-bold text-primary text-center mb-2">Für Geschäftspartner</h3>
          <p className="text-sm text-muted-foreground text-center mb-4">
            Werde Teil des My 2Go Netzwerks und erreiche neue Kunden.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/go" className="btn-primary text-sm py-2.5 px-5">Partner werden</Link>
            <Link to="/auth?partner=true" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border-2 border-foreground/30 text-foreground font-semibold text-sm hover:bg-foreground/10 transition-colors">
              Partner Login
            </Link>
          </div>
        </div>
      </section>
      
      <FeaturedSponsorsBar />
      
      <section className="container pb-32">
        <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
          <p className="text-sm text-muted-foreground/80 text-center mb-3 flex items-center justify-center gap-1.5">
            We <span className="text-destructive">♥</span> to be your #2
          </p>
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
      
      <GuestSignupSheet isOpen={shouldShowSignup} onClose={markSignupShown} earnedTaler={totalEarned} listeningMinutes={listeningMinutes} />
      <FirstTalerCelebration isOpen={showFirstTalerCelebration} onClose={closeFirstTalerCelebration} talerAmount={firstTalerAmount} isGuest={true} />
      <DriveSearchSheet open={showDriveSearch} onOpenChange={setShowDriveSearch} />
    </div>
  );
}
