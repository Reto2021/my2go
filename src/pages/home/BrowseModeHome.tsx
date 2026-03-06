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
import { TriggerSlider } from '@/components/home/TriggerSlider';
import { HeroAnimations } from '@/components/ui/HeroAnimations';
import { HeroDynamic } from '@/components/ui/HeroDynamic';
import { CampaignBanner } from '@/components/home/CampaignBanner';
import { CollectingCardBanner } from '@/components/home/CollectingCardBanner';
import { NewPartnerBanner } from '@/components/home/NewPartnerBanner';
import { ReferralPromoBanner } from '@/components/home/ReferralPromoBanner';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

import { useLiveEventsStore } from '@/lib/live-events-store';
import { useGuestRadioRewards } from '@/hooks/useGuestRadioRewards';
import { Gift, ChevronRight, ArrowRight, Coins, MapPin, Store } from 'lucide-react';
import { BrowseModeHomeProps } from './types';

export function BrowseModeHome({ rewards, partners, isLoading, onLogin }: BrowseModeHomeProps) {
  const { hasLiveEvents, fetchEvents, subscribeToRealtime } = useLiveEventsStore();
  const { timeOfDay, textColor } = useTimeOfDay();
  const showBirds = timeOfDay !== 'night';
  const isDarkText = textColor === 'dark';
  const heroTextClass = isDarkText ? 'text-gray-900' : 'text-white';
  const heroTextShadow = isDarkText 
    ? 'none' 
    : '0 1px 2px rgba(0,0,0,0.5)';
  
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
      {/* Hero Section – Dynamic: 4 Jahreszeiten × 4 Tageszeiten + Wetter */}
      <section className="relative overflow-hidden text-foreground pt-20" style={{ minHeight: '55vh' }}>
        <HeroDynamic />
        {showBirds && <HeroAnimations />}
        
        <div className="container relative z-10 pt-6 pb-24">
          <div className="flex items-center justify-between mb-6">
            <InstallBanner />
            <LiveHeaderButton onClick={handleLiveClick} hasLiveEvents={hasLiveEvents} />
          </div>
          
          <div className="animate-in text-center">
            <h1 className={`text-4xl sm:text-5xl font-black leading-tight tracking-tight mb-6 ${heroTextClass}`} style={{ textShadow: heroTextShadow }}>
              <span className="block">Lebe lokal.</span>
              <span className="block">Werde belohnt.</span>
              <TriggerSlider />
            </h1>
            
            {/* Primary CTAs – Partner & Gutscheine */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
              <Link 
                to="/partner" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-accent text-accent-foreground font-bold text-base shadow-xl shadow-accent/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <MapPin className="h-5 w-5" />
                Partner entdecken
              </Link>
              <Link 
                to="/rewards" 
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl backdrop-blur-sm font-bold text-base active:scale-[0.98] transition-all ${isDarkText ? 'bg-gray-900/15 text-gray-900 border border-gray-900/20 hover:bg-gray-900/25' : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'}`}
              >
                <Gift className="h-5 w-5" />
                Gutscheine ansehen
              </Link>
            </div>
            
            {totalEarned > 0 && (
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full mt-2 mx-auto w-fit ${isDarkText ? 'bg-gray-900/15 text-gray-900' : 'bg-white/20 text-white'}`}>
                <Coins className="h-4 w-4" />
                <span className="font-bold">{totalEarned} Taler</span>
                <span className={`text-sm ${isDarkText ? 'text-gray-900/70' : 'text-white/70'}`}>gesammelt!</span>
              </div>
            )}
            
            <button onClick={onLogin} className={`mt-4 text-sm font-semibold underline underline-offset-4 transition-colors ${isDarkText ? 'text-gray-900/70 decoration-gray-900/30 hover:text-gray-900' : 'text-white/80 decoration-white/40 hover:text-white'}`} style={{ textShadow: heroTextShadow }}>
              {totalEarned > 0 ? 'Taler sichern & anmelden' : 'Kostenlos anmelden'}
            </button>
          </div>
        </div>
      </section>
      
      {/* How it Works */}
      <section className="container -mt-12 relative z-20">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="card-glass p-4 flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Store className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-xs sm:text-sm font-semibold text-gray-800">Einkaufen</span>
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

      {/* 1. Campaign Banner */}
      <div className="mt-6">
        <CampaignBanner />
      </div>

      {/* Collecting Card Banner */}
      <CollectingCardBanner />
      
      {/* 2. New Partners */}
      <section className="container pb-3">
        <NewPartnerBanner />
      </section>

      {/* 3. Top Rewards Preview */}
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
      
      {/* 4. Partners Preview */}
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
          <h3 className="font-bold text-accent text-center mb-2">Für Geschäftspartner</h3>
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
      
    </div>
  );
}