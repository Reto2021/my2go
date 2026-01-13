import { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getRewards, Reward } from '@/lib/supabase-helpers';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, calculateDistance } from '@/lib/location';
import { supabase } from '@/integrations/supabase/client';
import { RewardCard, RewardCardSkeleton } from '@/components/ui/reward-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { ActivityTicker } from '@/components/social-proof/LiveActivityFeed';
import { OfflineDataBadge } from '@/components/ui/offline-data-badge';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { BalanceStickyBar } from '@/components/rewards/BalanceStickyBar';
import { useOfflineRewards } from '@/hooks/useOfflineData';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { 
  Gift, 
  Wallet, 
  Info, 
  SlidersHorizontal, 
  X, 
  MapPin, 
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  QrCode,
  Coins,
  Ticket,
  Sparkles,
  Radio,
  Navigation,
  Building2,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

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

// Redemption types
interface Redemption {
  id: string;
  redemption_code: string;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  taler_spent: number;
  created_at: string;
  expires_at: string;
  redeemed_at: string | null;
  reward: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
  } | null;
  partner: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

const statusConfig = {
  pending: {
    label: 'Offen',
    description: 'Beim Partner vorzeigen',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/30',
  },
  used: {
    label: 'Verwendet',
    description: 'Erfolgreich eingelöst',
    icon: CheckCircle,
    className: 'bg-success/15 text-success border-success/30',
  },
  expired: {
    label: 'Abgelaufen',
    description: 'Gültigkeit überschritten',
    icon: AlertCircle,
    className: 'bg-muted text-muted-foreground border-border',
  },
  cancelled: {
    label: 'Storniert',
    description: 'Wurde zurückgezogen',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
  },
};

export default function RewardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'aktiviert' ? 'aktiviert' : 'entdecken';
  
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [maxCost, setMaxCost] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Redemptions state
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);
  const [redemptionFilter, setRedemptionFilter] = useState<'all' | 'pending' | 'used' | 'expired'>('all');
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAuthenticated = !!user;
  
  const { 
    userLocation, 
    isRequestingLocation, 
    requestLocation, 
    clearLocation 
  } = useLocation();
  
  // Offline-capable rewards data
  const fetchRewards = useCallback(async () => {
    const data = await getRewards();
    return data;
  }, []);
  
  const {
    data: rewards,
    isLoading,
    isFromCache,
    error,
    lastUpdated,
    refetch: loadRewards
  } = useOfflineRewards<Reward[]>(fetchRewards);
  
  const rewardsList = rewards || [];
  
  // Fetch available cities from rewards data
  useEffect(() => {
    if (rewardsList.length > 0) {
      const cities = [...new Set(rewardsList
        .map(r => r.partner?.city)
        .filter((city): city is string => !!city)
      )].sort();
      setAvailableCities(cities);
    }
  }, [rewardsList]);
  
  // Fetch redemptions when tab is aktiviert and user is authenticated
  useEffect(() => {
    if (activeTab === 'aktiviert' && isAuthenticated && user) {
      fetchRedemptions();
    }
  }, [activeTab, isAuthenticated, user]);
  
  const fetchRedemptions = async () => {
    if (!user) return;
    setRedemptionsLoading(true);
    try {
      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          id,
          redemption_code,
          status,
          taler_spent,
          created_at,
          expires_at,
          redeemed_at,
          reward:rewards(id, title, description, image_url),
          partner:partners(id, name, logo_url)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRedemptions((data as unknown as Redemption[]) || []);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setRedemptionsLoading(false);
    }
  };
  
  // Add distance to rewards if user location is available
  const rewardsWithDistance = useMemo(() => {
    if (!userLocation) return rewardsList;
    
    return rewardsList.map(reward => {
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
  }, [rewardsList, userLocation]);
  
  // Client-side filtering and sorting for rewards
  const filteredAndSortedRewards = useMemo(() => {
    let result = [...rewardsWithDistance];
    
    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter(r => r.reward_type === activeCategory);
    }
    
    // Filter by city
    if (selectedCity !== 'all') {
      result = result.filter(r => r.partner?.city === selectedCity);
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
        result.reverse();
        break;
      case 'popular':
      default:
        // Keep distance-based order if available
        if (userLocation) {
          result.sort((a, b) => ((a as any).distanceKm || 9999) - ((b as any).distanceKm || 9999));
        }
        break;
    }
    
    return result;
  }, [rewardsWithDistance, maxCost, sortBy, userLocation, activeCategory, selectedCity]);
  
  // Redemption helpers
  const getEffectiveStatus = (r: Redemption) => {
    const isExpired = new Date(r.expires_at).getTime() < Date.now();
    return (r.status === 'pending' && isExpired) ? 'expired' : r.status;
  };

  const filteredRedemptions = redemptions.filter((r) => {
    if (redemptionFilter === 'all') return true;
    return getEffectiveStatus(r) === redemptionFilter;
  });

  const redemptionStats = {
    pending: redemptions.filter((r) => getEffectiveStatus(r) === 'pending').length,
    used: redemptions.filter((r) => getEffectiveStatus(r) === 'used').length,
    expired: redemptions.filter((r) => getEffectiveStatus(r) === 'expired').length,
    totalSpent: redemptions.filter((r) => getEffectiveStatus(r) === 'used').reduce((sum, r) => sum + r.taler_spent, 0),
  };
  
  const hasActiveFilters = maxCost > 0 || sortBy !== 'popular' || selectedCity !== 'all';
  
  const clearFilters = () => {
    setMaxCost(0);
    setSortBy('popular');
    setSelectedCity('all');
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
  
  const handleRefresh = useCallback(async () => {
    if (activeTab === 'entdecken') {
      await loadRewards();
    } else {
      await fetchRedemptions();
    }
  }, [loadRewards, activeTab]);
  
  const setTab = (tab: 'entdecken' | 'aktiviert') => {
    if (tab === 'entdecken') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams, { replace: true });
  };
  
  // Count pending redemptions for badge
  const pendingCount = redemptionStats.pending;
  
  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
        <div className="container py-4">
          {/* Balance Sticky Bar - Shows current Taler */}
          <BalanceStickyBar className="mb-4" />
          
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-display-sm">Gutscheine</h1>
              {activeTab === 'entdecken' && (
                <OfflineDataBadge 
                  isFromCache={isFromCache}
                  lastUpdated={lastUpdated}
                  onRefresh={loadRewards}
                />
              )}
            </div>
            
            {/* Filter Toggle - Only show on entdecken tab */}
            {activeTab === 'entdecken' && (
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
                    {(maxCost > 0 ? 1 : 0) + (sortBy !== 'popular' ? 1 : 0) + (selectedCity !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>
            )}
          </div>
          
          {/* Tab Switcher */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('entdecken')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all',
                activeTab === 'entdecken'
                  ? 'bg-secondary text-secondary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Sparkles className="h-4 w-4" />
              Entdecken
            </button>
            <button
              onClick={() => setTab('aktiviert')}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all',
                activeTab === 'aktiviert'
                  ? 'bg-secondary text-secondary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Ticket className="h-4 w-4" />
              Aktiviert
              {pendingCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-accent text-secondary text-xs font-bold px-1">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>
          
          {/* Tab-specific content */}
          {activeTab === 'entdecken' && (
            <>
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
              
              {/* Filter Sheet (Bottom Drawer) */}
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh] overflow-y-auto">
                  <SheetHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="h-5 w-5" />
                        Filter
                      </SheetTitle>
                      {hasActiveFilters && (
                        <button
                          onClick={clearFilters}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <X className="h-4 w-4" />
                          Zurücksetzen
                        </button>
                      )}
                    </div>
                  </SheetHeader>
                  
                  <div className="space-y-6 pb-8">
                    {/* Radio 2Go Branding Hint */}
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
                      <Radio className="h-4 w-4 text-secondary" />
                      <p className="text-xs text-secondary font-medium">
                        Radio 2Go hören lohnt sich! Sammle Taler & löse Gutscheine ein.
                      </p>
                    </div>
                    
                    {/* City Filter */}
                    {availableCities.length > 0 && (
                      <div className="space-y-3">
                        <label className="text-sm font-semibold flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          Ort
                        </label>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setSelectedCity('all')}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                              selectedCity === 'all'
                                ? 'bg-secondary text-secondary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                          >
                            {selectedCity === 'all' && <Check className="h-3.5 w-3.5" />}
                            Alle Orte
                          </button>
                          {availableCities.map(city => (
                            <button
                              key={city}
                              onClick={() => setSelectedCity(city)}
                              className={cn(
                                'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                                selectedCity === city
                                  ? 'bg-secondary text-secondary-foreground'
                                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                              )}
                            >
                              {selectedCity === city && <Check className="h-3.5 w-3.5" />}
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Sort */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Sortieren</label>
                      <div className="flex flex-wrap gap-2">
                        {sortOptions.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setSortBy(opt.id)}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                              sortBy === opt.id
                                ? 'bg-secondary text-secondary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                          >
                            {sortBy === opt.id && <Check className="h-3.5 w-3.5" />}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Max Cost */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold">Preis</label>
                      <div className="flex flex-wrap gap-2">
                        {maxCostOptions.map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => setMaxCost(opt.id)}
                            className={cn(
                              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
                              maxCost === opt.id
                                ? 'bg-secondary text-secondary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            )}
                          >
                            {maxCost === opt.id && <Check className="h-3.5 w-3.5" />}
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Apply Button */}
                    <Button 
                      onClick={() => setShowFilters(false)}
                      className="w-full"
                      size="lg"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      {filteredAndSortedRewards.length} Gutscheine anzeigen
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </>
          )}
          
          {activeTab === 'aktiviert' && isAuthenticated && (
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-[280px] text-center">
                    <p className="text-sm">
                      Aktiviere einen Gutschein mit deinen Taler. Zeige den Code beim Partner vor – nach Bestätigung wird er als <span className="text-success font-medium">verwendet</span> markiert.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <span className="text-sm text-muted-foreground">
                Aktivierte Gutscheine und deren Status
              </span>
            </div>
          )}
        </div>
      </header>
      
      {/* Browse Mode Banner */}
      {!isAuthenticated && activeTab === 'entdecken' && (
        <div className="container pt-4">
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 flex-shrink-0">
              <Radio className="h-5 w-5 text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                Radio 2Go hören & Taler sammeln
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
      
      {/* Login required for Aktiviert tab */}
      {!isAuthenticated && activeTab === 'aktiviert' && (
        <div className="container py-8">
          <EmptyState
            icon={Radio}
            title="Radio 2Go hören lohnt sich!"
            description="Melde dich an, höre Radio 2Go, sammle Taler und löse exklusive Gutscheine ein."
            action={{ label: 'Jetzt starten', onClick: handleLogin }}
          />
        </div>
      )}
      
      {/* Content */}
      <div className="container py-4">
        {/* ENTDECKEN TAB */}
        {activeTab === 'entdecken' && (
          <>
            {/* Results count */}
            {!isLoading && !error && (
              <p className="text-sm text-muted-foreground mb-4">
                {filteredAndSortedRewards.length} {filteredAndSortedRewards.length === 1 ? 'Gutschein' : 'Gutscheine'}
                {hasActiveFilters && ' (gefiltert)'}
              </p>
            )}
            
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
          </>
        )}
        
        {/* AKTIVIERT TAB */}
        {activeTab === 'aktiviert' && isAuthenticated && (
          <>
            {redemptionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <Card className="bg-accent/10 border-accent/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-accent">{redemptionStats.pending}</p>
                      <p className="text-xs text-muted-foreground">Offen</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-success/10 border-success/30">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-success">{redemptionStats.used}</p>
                      <p className="text-xs text-muted-foreground">Verwendet</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50 border-border/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-muted-foreground">{redemptionStats.expired}</p>
                      <p className="text-xs text-muted-foreground">Abgelaufen</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                  {[
                    { key: 'all', label: 'Alle' },
                    { key: 'pending', label: 'Offen' },
                    { key: 'used', label: 'Verwendet' },
                    { key: 'expired', label: 'Abgelaufen' },
                  ].map((tab) => (
                    <Button
                      key={tab.key}
                      variant={redemptionFilter === tab.key ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setRedemptionFilter(tab.key as typeof redemptionFilter)}
                      className={cn(
                        'rounded-full whitespace-nowrap',
                        redemptionFilter === tab.key && 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {tab.label}
                    </Button>
                  ))}
                </div>

                {/* Redemptions List */}
                {filteredRedemptions.length === 0 ? (
                  <EmptyState
                    icon={Radio}
                    title={redemptionFilter === 'all' ? 'Noch keine Gutscheine aktiviert' : 'Keine Ergebnisse'}
                    description={
                      redemptionFilter === 'all'
                        ? 'Hör Radio 2Go, sammle Taler und aktiviere deinen ersten Gutschein!'
                        : 'Keine Gutscheine mit diesem Status gefunden.'
                    }
                    action={
                      redemptionFilter === 'all'
                        ? { label: 'Gutscheine entdecken', onClick: () => setTab('entdecken') }
                        : undefined
                    }
                  />
                ) : (
                  <div className="space-y-3">
                    {filteredRedemptions.map((redemption) => {
                      const expiresAt = new Date(redemption.expires_at);
                      const isExpired = expiresAt.getTime() < Date.now();
                      const effectiveStatus = (redemption.status === 'pending' && isExpired) ? 'expired' : redemption.status;
                      const config = statusConfig[effectiveStatus];
                      const StatusIcon = config.icon;
                      const isPending = effectiveStatus === 'pending';
                      const isExpiringSoon = isPending && expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

                      return (
                        <Card
                          key={redemption.id}
                          className={cn(
                            'card-interactive overflow-hidden',
                            isPending && 'border-accent/30'
                          )}
                          onClick={() => navigate(`/rewards/redemption/${redemption.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {/* Image/Logo */}
                              <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted">
                                {redemption.reward?.image_url ? (
                                  <img
                                    src={redemption.reward.image_url}
                                    alt={redemption.reward.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : redemption.partner?.logo_url ? (
                                  <img
                                    src={redemption.partner.logo_url}
                                    alt={redemption.partner.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Gift className="w-6 h-6 text-muted-foreground" />
                                  </div>
                                )}
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <h3 className="font-semibold text-foreground truncate">
                                      {redemption.reward?.title || 'Gutschein'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground truncate">
                                      {redemption.partner?.name}
                                    </p>
                                  </div>
                                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                </div>

                                {/* Status & Details */}
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge variant="outline" className={cn('text-xs', config.className)}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {config.label}
                                  </Badge>
                                  
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                    <Coins className="h-3.5 w-3.5" />
                                    {redemption.taler_spent}
                                  </span>

                                  {isPending && (
                                    <span className={cn(
                                      'text-xs',
                                      isExpiringSoon ? 'text-destructive font-medium' : 'text-muted-foreground'
                                    )}>
                                      Gültig bis {format(expiresAt, 'dd.MM.yyyy', { locale: de })}
                                    </span>
                                  )}
                                </div>

                                {/* Redemption Code for pending */}
                                {isPending && (
                                  <div className="mt-3 flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                                    <QrCode className="w-4 h-4 text-secondary" />
                                    <code className="text-sm font-mono font-semibold text-secondary">
                                      {redemption.redemption_code}
                                    </code>
                                  </div>
                                )}

                                {/* Redeemed info */}
                                {redemption.status === 'used' && redemption.redeemed_at && (
                                  <p className="text-xs text-muted-foreground mt-2">
                                    Verwendet am {format(new Date(redemption.redeemed_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
                                  </p>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}

                {/* Total Spent Footer */}
                {redemptionStats.totalSpent > 0 && (
                  <div className="mt-8 p-4 bg-secondary/5 rounded-2xl border border-secondary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Insgesamt eingelöst</span>
                      <span className="inline-flex items-center gap-1.5 text-lg font-bold text-secondary">
                        <Coins className="h-5 w-5" />
                        {redemptionStats.totalSpent} Taler
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}
