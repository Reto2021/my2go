import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/lib/location';
import { getRewards, getPartnersWithMinRewardCost, Reward, PartnerWithMinCost } from '@/lib/supabase-helpers';
import { prefetchCommonRoutes } from '@/lib/route-prefetch';
import { RewardCard } from '@/components/ui/reward-card';
import { PartnerCard } from '@/components/ui/partner-card';
import { 
  Skeleton, 
  SkeletonRewardCard, 
  SkeletonPartnerCard, 
  SkeletonBalanceCard,
} from '@/components/ui/skeleton';
import { RecentBadgesBar } from '@/components/badges/RecentBadgesBar';
import { TopListenersWidget } from '@/components/social-proof/TopListenersWidget';
import { ActivityTicker } from '@/components/social-proof/LiveActivityFeed';
import { ReferralPromoBanner } from '@/components/home/ReferralPromoBanner';
import { InstallBanner } from '@/components/home/InstallBanner';
import {
  Gift,
  MapPin,
  ChevronRight, 
  Wallet,
  Radio,
  ArrowRight,
  Navigation,
  X,
  Users,
  Coins,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Prefetch common routes after initial load
if (typeof window !== 'undefined') {
  prefetchCommonRoutes();
}

export default function HomePage() {
  const { user, profile, balance, isLoading } = useAuth();
  const navigate = useNavigate();
  const { 
    userLocation, 
    isRequestingLocation, 
    locationPermissionGranted,
    promptDismissedThisSession,
    requestLocation, 
    clearLocation,
    dismissPromptForSession,
    initFromStorage,
  } = useLocation();
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [partners, setPartners] = useState<PartnerWithMinCost[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  
  const isAuthenticated = !!user;
  
  const [locationInitialized, setLocationInitialized] = useState(false);
  
  // Initialize location from storage on mount
  useEffect(() => {
    initFromStorage();
    setLocationInitialized(true);
  }, []);
  
  // Show location prompt if not granted and not dismissed this session
  useEffect(() => {
    // Wait until location state is initialized from storage
    if (!locationInitialized) return;
    
    if (!isLoading && isAuthenticated && !locationPermissionGranted && !promptDismissedThisSession) {
      // Small delay to let the page load first
      const timer = setTimeout(() => setShowLocationPrompt(true), 500);
      return () => clearTimeout(timer);
    }
  }, [locationInitialized, isLoading, isAuthenticated, locationPermissionGranted, promptDismissedThisSession]);
  
  // Load content from Supabase
  useEffect(() => {
    async function loadContent() {
      setIsLoadingContent(true);
      try {
        const [rewardsData, partnersData] = await Promise.all([
          getRewards(),
          getPartnersWithMinRewardCost(),
        ]);
        
        // Sort by distance if user location is available
        let sortedRewards = rewardsData;
        if (userLocation && rewardsData.length > 0) {
          sortedRewards = rewardsData
            .map(reward => {
              const partner = reward.partner;
              if (partner?.lat && partner?.lng) {
                const distance = calculateDistance(
                  userLocation.lat, 
                  userLocation.lng, 
                  partner.lat, 
                  partner.lng
                );
                return { ...reward, distanceKm: distance };
              }
              return { ...reward, distanceKm: 9999 };
            })
            .sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
        }
        
        setRewards(sortedRewards.slice(0, 4));
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
    dismissPromptForSession();
  };
  
  const handleLogin = () => {
    navigate('/auth');
  };
  
  if (isLoading) {
    return <HomePageSkeleton />;
  }
  
  if (!isAuthenticated) {
    return <BrowseModeHome rewards={rewards} partners={partners} isLoading={isLoadingContent} onLogin={handleLogin} />;
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
        displayName={profile?.display_name || profile?.first_name} 
        balance={balance || { taler_balance: 0, lifetime_earned: 0, lifetime_spent: 0 }}
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

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

interface BrowseModeHomeProps {
  rewards: Reward[];
  partners: PartnerWithMinCost[];
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
          {/* Install Banner for guests */}
          <div className="mb-4">
            <InstallBanner />
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

interface FeatureChipProps {
  icon: React.ElementType;
  label: string;
  fullLabel?: string;
  color: 'accent' | 'primary' | 'secondary';
  to: string;
}

function FeatureChip({ icon: Icon, label, fullLabel, color, to }: FeatureChipProps) {
  const colorClasses = {
    accent: 'bg-accent/15 text-accent',
    primary: 'bg-primary/20 text-secondary',
    secondary: 'bg-secondary/10 text-secondary',
  };
  
  return (
    <Link to={to} className="card-glass p-3 sm:p-4 flex flex-col items-center gap-2 sm:gap-3 hover:scale-105 transition-transform">
      <div className={`icon-container-md rounded-2xl ${colorClasses[color]}`}>
        <Icon className="h-5 w-5" />
      </div>
      {/* Short label on mobile, full label on larger screens */}
      <span className="text-xs sm:text-sm font-semibold text-center text-foreground sm:hidden">{label}</span>
      <span className="text-sm font-semibold text-center text-foreground hidden sm:block">{fullLabel || label}</span>
    </Link>
  );
}

interface SessionModeHomeProps {
  displayName?: string | null;
  balance: { taler_balance: number; lifetime_earned: number; lifetime_spent: number };
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
  // Time-based greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Guten Morgen';
    if (hour < 18) return 'Hallo';
    return 'Guten Abend';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header with Greeting + Live Activity */}
      <header className="container pt-4 pb-3">
        <div className="animate-in space-y-2">
          {/* Greeting row */}
          <p className="text-muted-foreground">
            {getGreeting()}, <span className="font-semibold text-foreground">{displayName || 'Hörer'}</span> 👋
          </p>
          
          {/* Live Activity Ticker - Social Proof */}
          <ActivityTicker className="text-xs" />
        </div>
      </header>
      
      {/* Install Banner - for users who haven't installed the PWA */}
      <section className="container pb-3">
        <InstallBanner />
      </section>
      
      {/* Referral Promo Banner - Compact */}
      <section className="container pb-2">
        <ReferralPromoBanner />
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

/**
 * Full-page skeleton for initial HomePage loading
 */
function HomePageSkeleton() {
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
