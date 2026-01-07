import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSession, useBrowseMode } from '@/lib/session';
import { useLocation } from '@/lib/location';
import { getRewards, getRewardsNearLocation, getPartners, Reward, Partner } from '@/lib/api';
import { BalanceCard } from '@/components/ui/balance-card';
import { RewardCard } from '@/components/ui/reward-card';
import { PartnerCard } from '@/components/ui/partner-card';
import { PageLoader } from '@/components/ui/loading-spinner';
import {
  Gift, 
  MapPin, 
  ChevronRight, 
  Wallet,
  Music,
  ArrowRight,
  Navigation,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HomePage() {
  const { session, balance, isLoading, loginWithToken } = useSession();
  const isBrowseMode = useBrowseMode();
  const { 
    userLocation, 
    isRequestingLocation, 
    locationError,
    locationPermissionAsked,
    requestLocation, 
    clearLocation,
    setLocationPermissionAsked 
  } = useLocation();
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  
  // Session is now initialized in AppLayout
  
  // Show location prompt if not asked yet (after session is loaded)
  useEffect(() => {
    if (!isLoading && !isBrowseMode && !locationPermissionAsked) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShowLocationPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isBrowseMode, locationPermissionAsked]);
  
  // Load content - with or without location
  useEffect(() => {
    async function loadContent() {
      setIsLoadingContent(true);
      try {
        let rewardsData: Reward[];
        
        if (userLocation) {
          // Load rewards near user's location
          rewardsData = await getRewardsNearLocation(userLocation.lat, userLocation.lng);
        } else {
          // Load all rewards
          rewardsData = await getRewards();
        }
        
        const partnersData = await getPartners();
        setRewards(rewardsData.slice(0, 4));
        setPartners(partnersData.slice(0, 3));
      } catch (error) {
        console.error('Failed to load content:', error);
      } finally {
        setIsLoadingContent(false);
      }
    }
    loadContent();
  }, [userLocation]);
  
  const handleAllowLocation = async () => {
    setShowLocationPrompt(false);
    await requestLocation();
  };
  
  const handleDenyLocation = () => {
    setShowLocationPrompt(false);
    setLocationPermissionAsked();
  };
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (isBrowseMode) {
    return <BrowseModeHome rewards={rewards} partners={partners} isLoading={isLoadingContent} onLogin={() => loginWithToken('demo')} />;
  }
  
  return (
    <>
      {/* Location Permission Prompt */}
      {showLocationPrompt && (
        <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="card-base p-6 max-w-sm w-full text-center shadow-strong animate-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-accent/10">
              <Navigation className="h-8 w-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold mb-2">Gutscheine in deiner Nähe</h2>
            <p className="text-muted-foreground mb-6">
              Erlaube Standortzugriff, um nur Gutscheine von Partnern in deiner Region zu sehen.
            </p>
            <div className="space-y-3">
              <button 
                className="btn-primary w-full"
                onClick={handleAllowLocation}
                disabled={isRequestingLocation}
              >
                {isRequestingLocation ? 'Wird ermittelt...' : 'Standort erlauben'}
              </button>
              <button 
                className="btn-ghost w-full text-muted-foreground"
                onClick={handleDenyLocation}
              >
                Später
              </button>
            </div>
          </div>
        </div>
      )}
      
      <SessionModeHome 
        displayName={session?.displayName} 
        balance={balance!}
        rewards={rewards}
        isLoading={isLoadingContent}
        userLocation={userLocation}
        onClearLocation={clearLocation}
        onRequestLocation={requestLocation}
        isRequestingLocation={isRequestingLocation}
      />
    </>
  );
}

interface BrowseModeHomeProps {
  rewards: Reward[];
  partners: Partner[];
  isLoading: boolean;
  onLogin: () => void;
}

function BrowseModeHome({ rewards, partners, isLoading, onLogin }: BrowseModeHomeProps) {
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
          <div className="animate-in">
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight mb-4">
              Hör 2Go.<br />
              Sammle Taler.<br />
              <span className="text-accent">Lös Gutscheine ein.</span>
            </h1>
            
            <p className="text-secondary/70 text-lg mb-8 max-w-xs leading-relaxed">
              Das Bonusprogramm von Radio 2Go. Bei lokalen Partnern sammeln, exklusive Prämien einlösen.
            </p>
            
            <button 
              onClick={onLogin}
              className="btn-primary group"
            >
              <Wallet className="h-5 w-5" />
              Taler Karte öffnen
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section className="container -mt-16 relative z-20">
        <div className="grid grid-cols-3 gap-3 animate-in-delayed">
          <FeatureChip icon={Music} label="Radio-Taler sammeln" color="accent" to="/code" />
          <FeatureChip icon={Gift} label="Gutscheine holen" color="primary" to="/rewards" />
          <FeatureChip icon={MapPin} label="Partner finden" color="secondary" to="/partner" />
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
              <div key={i} className="h-24 rounded-3xl bg-muted animate-pulse" />
            ))
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
              <div key={i} className="h-24 rounded-3xl bg-muted animate-pulse" />
            ))
          ) : (
            partners.slice(0, 2).map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))
          )}
        </div>
      </section>
      
      {/* Info */}
      <section className="container pb-28">
        <div className="p-5 rounded-2xl bg-secondary/5 border border-secondary/10">
          <p className="text-sm text-muted-foreground text-center">
            2Go Taler sind Bonuspunkte und nicht auszahlbar.
          </p>
        </div>
      </section>
    </div>
  );
}

interface FeatureChipProps {
  icon: React.ElementType;
  label: string;
  color: 'accent' | 'primary' | 'secondary';
  to: string;
}

function FeatureChip({ icon: Icon, label, color, to }: FeatureChipProps) {
  const colorClasses = {
    accent: 'bg-accent/15 text-accent',
    primary: 'bg-primary/20 text-secondary',
    secondary: 'bg-secondary/10 text-secondary',
  };
  
  return (
    <Link to={to} className="card-glass p-4 flex flex-col items-center gap-3 hover:scale-105 transition-transform">
      <div className={`icon-container-md rounded-2xl ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <span className="text-xs font-semibold text-center text-foreground">{label}</span>
    </Link>
  );
}

interface SessionModeHomeProps {
  displayName?: string;
  balance: { current: number; pending: number; lifetime: number };
  rewards: Reward[];
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  onClearLocation: () => void;
  onRequestLocation: () => Promise<void>;
  isRequestingLocation: boolean;
}

function SessionModeHome({ 
  displayName, 
  balance, 
  rewards, 
  isLoading, 
  userLocation,
  onClearLocation,
  onRequestLocation,
  isRequestingLocation
}: SessionModeHomeProps) {
  return (
    <div className="min-h-screen pb-28 bg-background">
      {/* Header - greeting only, menu is in RadioHeader */}
      {displayName && (
        <header className="container pt-6 pb-4">
          <p className="text-muted-foreground animate-in">
            Hallo, <span className="font-semibold text-foreground">{displayName}</span> 👋
          </p>
        </header>
      )}
      
      {/* Balance Card */}
      <section className="container py-4">
        <div className="animate-in">
          <BalanceCard balance={balance} />
        </div>
      </section>
      
      {/* Quick Actions */}
      <section className="container section">
        <h2 className="section-title mb-5">Schnellzugriff</h2>
        <div className="grid grid-cols-3 gap-3 stagger-children">
          <QuickAction to="/code" icon={Music} label="Radio-Taler sammeln" color="accent" />
          <QuickAction to="/rewards" icon={Gift} label="Gutscheine" color="primary" />
          <QuickAction to="/partner" icon={MapPin} label="Partner" color="secondary" />
        </div>
      </section>
      
      {/* Rewards */}
      <section className="container section">
        <div className="section-header">
          <h2 className="section-title">
            {userLocation ? 'In deiner Nähe' : 'Für dich'}
          </h2>
          <Link to="/rewards" className="section-link">
            Alle <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* Location Status Chip */}
        {userLocation ? (
          <button
            onClick={onClearLocation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-accent/10 text-accent mb-4"
          >
            <Navigation className="h-3.5 w-3.5" />
            Standort aktiv
            <X className="h-3 w-3 ml-1" />
          </button>
        ) : (
          <button
            onClick={onRequestLocation}
            disabled={isRequestingLocation}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground mb-4 hover:bg-muted/80 transition-colors"
          >
            <Navigation className={cn("h-3.5 w-3.5", isRequestingLocation && "animate-pulse")} />
            {isRequestingLocation ? 'Suche...' : 'Standort aktivieren'}
          </button>
        )}
        
        <div className="space-y-3 stagger-children">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-muted animate-pulse" />
            ))
          ) : rewards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
            <p>Keine Gutscheine in deiner Nähe gefunden.</p>
              <button 
                onClick={onClearLocation}
                className="text-accent font-semibold mt-2"
              >
                Alle Gutscheine anzeigen
              </button>
            </div>
          ) : (
            rewards.map(reward => (
              <RewardCard key={reward.id} reward={reward} />
            ))
          )}
        </div>
      </section>
    </div>
  );
}

interface QuickActionProps {
  to: string;
  icon: React.ElementType;
  label: string;
  color: 'accent' | 'primary' | 'secondary';
}

function QuickAction({ to, icon: Icon, label, color }: QuickActionProps) {
  const colorClasses = {
    accent: 'bg-accent/15 text-accent',
    primary: 'bg-primary/30 text-secondary',
    secondary: 'bg-secondary/10 text-secondary',
  };
  
  return (
    <Link to={to} className="quick-action">
      <div className={`icon-container-lg rounded-2xl ${colorClasses[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <span className="text-sm font-semibold text-center">{label}</span>
    </Link>
  );
}
