import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRewards, Reward } from '@/lib/supabase-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, calculateDistance } from '@/lib/location';
import { RewardCard, RewardCardSkeleton } from '@/components/ui/reward-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ActivityTicker } from '@/components/social-proof/LiveActivityFeed';
import { cn } from '@/lib/utils';
import { Gift, Wallet, Info, SlidersHorizontal, X, MapPin, Loader2 } from 'lucide-react';

// Map reward_type to category labels
const categories = [
  { id: 'all', label: 'Alle' },
  { id: 'fixed_discount', label: 'CHF-Rabatt' },
  { id: 'percent_discount', label: '%-Rabatt' },
  { id: 'free_item', label: 'Produkte' },
  { id: 'experience', label: 'Erlebnisse' },
  { id: 'topup_bonus', label: 'Bonus' },
];

const sortOptions = [
  { id: 'popular', label: 'Beliebt' },
  { id: 'newest', label: 'Neueste' },
  { id: 'cheapest', label: 'Günstigste' },
  { id: 'expensive', label: 'Teuerste' },
];

const maxCostOptions = [
  { id: 0, label: 'Alle Preise' },
  { id: 50, label: 'Bis 50 Taler' },
  { id: 100, label: 'Bis 100 Taler' },
  { id: 150, label: 'Bis 150 Taler' },
];

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [maxCost, setMaxCost] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!user;
  
  const { 
    userLocation, 
    isRequestingLocation, 
    requestLocation, 
    clearLocation 
  } = useLocation();
  
  const loadRewards = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const data = await getRewards();
      
      // Add distance if user location is available
      let processedData = data;
      if (userLocation) {
        processedData = data.map(reward => {
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
        }).sort((a, b) => (a.distanceKm || 9999) - (b.distanceKm || 9999));
      }
      
      setRewards(processedData);
    } catch (err) {
      console.error('Failed to load rewards:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadRewards();
  }, [userLocation]);
  
  // Client-side filtering and sorting
  const filteredAndSortedRewards = useMemo(() => {
    let result = [...rewards];
    
    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(r => r.reward_type === activeCategory);
    }
    
    // Filter by max cost
    if (maxCost > 0) {
      result = result.filter(r => r.taler_cost <= maxCost);
    }
    
    // Sort
    switch (sortBy) {
      case 'cheapest':
        result.sort((a, b) => a.taler_cost - b.taler_cost);
        break;
      case 'expensive':
        result.sort((a, b) => b.taler_cost - a.taler_cost);
        break;
      case 'newest':
        // Sort by created_at if available, otherwise reverse
        result.reverse();
        break;
      case 'popular':
      default:
        // Keep original order for popular (or sort by distance if available)
        if (userLocation) {
          result.sort((a, b) => ((a as any).distanceKm || 9999) - ((b as any).distanceKm || 9999));
        }
        break;
    }
    
    return result;
  }, [rewards, maxCost, sortBy, userLocation, activeCategory]);
  
  const hasActiveFilters = maxCost > 0 || sortBy !== 'popular';
  
  const clearFilters = () => {
    setMaxCost(0);
    setSortBy('popular');
  };
  
  const handleLocationToggle = () => {
    if (userLocation) {
      clearLocation();
    } else {
      requestLocation();
    }
  };
  
  const handleLogin = () => {
    navigate('/auth');
  };
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
        <div className="container py-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-display-sm">Gutscheine</h1>
            
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                showFilters || hasActiveFilters
                  ? 'bg-secondary text-secondary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {hasActiveFilters && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground text-xs">
                  {(maxCost > 0 ? 1 : 0) + (sortBy !== 'popular' ? 1 : 0)}
                </span>
              )}
            </button>
          </div>
          
          {/* Live Activity Ticker - Social Proof */}
          <ActivityTicker className="mb-3" />
          
          {/* Location + Category Filter */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-none">
            {/* Location Toggle */}
            <button
              onClick={handleLocationToggle}
              disabled={isRequestingLocation}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
                userLocation
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {isRequestingLocation ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              {userLocation ? 'In der Nähe' : 'Standort'}
            </button>
            
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
                  activeCategory === cat.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          {/* Extended Filters */}
          {showFilters && (
            <div className="mt-4 p-4 rounded-2xl bg-muted/50 space-y-4 animate-in">
              {/* Sort */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sortieren</label>
                <div className="flex flex-wrap gap-2">
                  {sortOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setSortBy(opt.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        sortBy === opt.id
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-background text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Max Cost */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Preis</label>
                <div className="flex flex-wrap gap-2">
                  {maxCostOptions.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setMaxCost(opt.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        maxCost === opt.id
                          ? 'bg-secondary text-secondary-foreground'
                          : 'bg-background text-muted-foreground hover:text-foreground'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Clear Filters */}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                  Filter zurücksetzen
                </button>
              )}
            </div>
          )}
        </div>
      </header>
      
      {/* Browse Mode Banner */}
      {!isAuthenticated && (
        <div className="container pt-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
              <Info className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Zum Einlösen anmelden
              </p>
              <p className="text-xs text-muted-foreground">
                Melde dich an, um Gutscheine einzulösen.
              </p>
            </div>
            <button 
              className="btn-primary py-2 px-4 text-sm flex-shrink-0"
              onClick={handleLogin}
            >
              <Wallet className="h-4 w-4" />
              Anmelden
            </button>
          </div>
        </div>
      )}
      
      {/* Results count */}
      {!isLoading && !error && (
        <div className="container pt-4">
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedRewards.length} {filteredAndSortedRewards.length === 1 ? 'Gutschein' : 'Gutscheine'}
            {hasActiveFilters && ' (gefiltert)'}
          </p>
        </div>
      )}
      
      {/* Content */}
      <div className="container py-4">
        {isLoading ? (
          <div className="space-y-3 stagger-children">
            {Array.from({ length: 5 }).map((_, i) => (
              <RewardCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState 
            title="Gutscheine konnten nicht geladen werden"
            onRetry={loadRewards}
          />
        ) : filteredAndSortedRewards.length === 0 ? (
          <EmptyState
            icon={Gift}
            title="Keine Gutscheine gefunden"
            description={hasActiveFilters 
              ? "Passe die Filter an, um mehr Gutscheine zu sehen."
              : "In dieser Kategorie sind aktuell keine Gutscheine verfügbar."
            }
            action={hasActiveFilters ? {
              label: "Filter zurücksetzen",
              onClick: clearFilters
            } : undefined}
          />
        ) : (
          <ul className="space-y-3 stagger-children list-none p-0 m-0">
            {filteredAndSortedRewards.map(reward => (
              <li key={reward.id}>
                <RewardCard 
                  reward={reward} 
                  distance={userLocation ? (reward as any).distanceKm : undefined}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
