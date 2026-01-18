import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RewardCard } from '@/components/ui/reward-card';
import { PartnerCard } from '@/components/ui/partner-card';
import { SkeletonRewardCard, SkeletonPartnerCard } from '@/components/ui/skeleton';
import { InstallBanner } from '@/components/home/InstallBanner';
import { LiveHeaderButton } from '@/components/radio/LiveEventsPanel';
import { FeaturedSponsorsBar } from '@/components/sponsors/FeaturedSponsorsBar';
import { useLiveEventsStore } from '@/lib/live-events-store';
import { Gift, ChevronRight, Radio, ArrowRight, Wallet, Coins } from 'lucide-react';
import { BrowseModeHomeProps, FeatureChipProps, colorClasses } from './types';

function FeatureChip({ icon: Icon, label, fullLabel, color, to }: FeatureChipProps) {
  return (
    <Link to={to} className="card-glass p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 hover:scale-105 transition-transform">
      <div className={`icon-container-md rounded-2xl ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs sm:text-sm font-semibold text-center text-foreground sm:hidden">{label}</span>
      <span className="text-sm font-semibold text-center text-foreground hidden sm:block">{fullLabel || label}</span>
    </Link>
  );
}

export function BrowseModeHome({ rewards, partners, isLoading, onLogin }: BrowseModeHomeProps) {
  const { hasLiveEvents, fetchEvents, subscribeToRealtime } = useLiveEventsStore();

  useEffect(() => {
    fetchEvents();
    const unsubscribe = subscribeToRealtime();
    return () => unsubscribe();
  }, [fetchEvents, subscribeToRealtime]);

  const handleLiveClick = () => {
    onLogin();
  };
  
  return (
    <div className="min-h-screen bg-background -mt-20">
      {/* Hero Section with Skyline */}
      <section className="hero-section text-secondary pt-20">
        {/* City Skyline */}
        <div className="skyline-container">
          <div className="skyline-distant" />
          <div className="skyline-mid" />
          <div className="skyline-front" />
        </div>
        
        {/* Clouds at various heights */}
        <div className="clouds-container">
          <div className="cloud cloud-1" />
          <div className="cloud cloud-2" />
          <div className="cloud cloud-3" />
          <div className="cloud cloud-4" />
          <div className="cloud cloud-5" />
          <div className="cloud cloud-6" />
          <div className="cloud cloud-7" />
          <div className="cloud cloud-8" />
        </div>
        
        <div className="container relative z-10 pt-6 pb-32">
          {/* Header row with Install Banner and Live Button */}
          <div className="flex items-center justify-between mb-4">
            <InstallBanner />
            <LiveHeaderButton 
              onClick={handleLiveClick}
              hasLiveEvents={hasLiveEvents}
            />
          </div>
          
          <div className="animate-in">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
              Hör 2Go.<br />
              Sammle Taler.<br />
              <span className="relative inline-block">
                <span className="absolute -inset-x-2 -inset-y-0.5 bg-accent rounded-[2px_6px_4px_8px] -rotate-[0.5deg] animate-brush-stroke" />
                <span className="relative text-secondary font-extrabold px-1">Lös Gutscheine ein.</span>
              </span>
            </h1>
            
            <p className="text-secondary/70 text-lg mb-8 max-w-xs leading-relaxed">
              Hör Radio 2Go, sammle 2Go Taler und löse exklusive Gutscheine bei lokalen Partnern ein.
            </p>
            
            <button 
              onClick={onLogin}
              className="btn-primary group"
            >
              <Wallet className="h-5 w-5" />
              Jetzt kostenlos starten
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Features - Compact for mobile */}
      <section className="container -mt-16 relative z-20">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 animate-in-delayed">
          <FeatureChip icon={Radio} label="Hören" fullLabel="Radio hören" color="accent" to="/auth" />
          <FeatureChip icon={Coins} label="Sammeln" fullLabel="Taler sammeln" color="primary" to="/rewards" />
          <FeatureChip icon={Gift} label="Einlösen" fullLabel="Gutscheine einlösen" color="secondary" to="/partner" />
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
    </div>
  );
}
