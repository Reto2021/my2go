import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getPartnersWithMinRewardCost, PartnerWithMinCost, Region } from '@/lib/supabase-helpers';
import { useLocation, calculateDistance } from '@/lib/location';
import { PartnerCard, PartnerCardSkeleton } from '@/components/ui/partner-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { PartnerMap } from '@/components/PartnerMap';
import { GoogleReviewBadge } from '@/components/partner/GoogleReviewBadge';
import { OfflineDataBadge } from '@/components/ui/offline-data-badge';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useOfflinePartners } from '@/hooks/useOfflineData';
import { cn } from '@/lib/utils';
import { MapPin, Search, Navigation, X, Store, ChevronRight, Filter, List, Map as MapIcon, Coins } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function PartnerPage() {
  const [regions, setRegions] = useState<Region[]>([]);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  
  // Location from global store
  const { 
    userLocation, 
    isRequestingLocation, 
    locationError,
    requestLocation, 
    clearLocation 
  } = useLocation();
  
  // Offline-capable partners data
  const fetchPartners = useCallback(async () => {
    const data = await getPartnersWithMinRewardCost();
    return data;
  }, []);
  
  const {
    data: partners,
    isLoading,
    isFromCache,
    error,
    lastUpdated,
    refetch: loadData
  } = useOfflinePartners<PartnerWithMinCost[]>(fetchPartners);
  
  const loadRegions = async () => {
    try {
      const { data: regionsData } = await supabase
        .from('regions')
        .select('*')
        .order('name');
      setRegions((regionsData || []) as Region[]);
    } catch (err) {
      console.error('Failed to load regions:', err);
    }
  };
  
  const loadMapboxToken = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      if (data?.token) {
        setMapboxToken(data.token);
      }
    } catch (err) {
      console.error('Failed to load Mapbox token:', err);
    }
  };
  
  useEffect(() => {
    loadRegions();
    loadMapboxToken();
  }, []);
  
  const partnersList = partners || [];
  
  // Extract unique categories from partners
  const categories = useMemo(() => {
    const cats = new Set<string>();
    partnersList.forEach(p => {
      if (p.category) cats.add(p.category);
    });
    return Array.from(cats).sort();
  }, [partnersList]);
  
  // Extract unique cities from partners
  const cities = useMemo(() => {
    const citySet = new Set<string>();
    partnersList.forEach(p => {
      if (p.city) citySet.add(p.city);
    });
    return Array.from(citySet).sort();
  }, [partnersList]);
  
  const handleLocationToggle = () => {
    if (userLocation) {
      clearLocation();
    } else {
      requestLocation();
      setSelectedRegion(null);
    }
  };
  
  const handleRegionSelect = (regionName: string) => {
    setSelectedRegion(selectedRegion === regionName ? null : regionName);
    clearLocation();
  };
  
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(selectedCategory === category ? null : category);
  };
  
  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedRegion(null);
    setSelectedCategory(null);
    clearLocation();
  };
  
  const hasActiveFilters = searchQuery || selectedRegion || selectedCategory || userLocation;
  
  // Filter and sort partners
  const filteredPartners = useMemo(() => {
    let result = [...partnersList];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.short_description?.toLowerCase().includes(query)
      );
    }
    
    // Region/City filter
    if (selectedRegion) {
      result = result.filter(p => p.city === selectedRegion);
    }
    
    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }
    
    // Add distance and sort if location available
    if (userLocation) {
      result = result.map(p => ({
        ...p,
        distance: p.lat && p.lng ? calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng) : undefined,
      })).sort((a, b) => ((a as any).distance || 9999) - ((b as any).distance || 9999));
    }
    
    return result;
  }, [partnersList, searchQuery, selectedRegion, selectedCategory, userLocation]);
  
  // Group partners by city (when no location and no category filter)
  const groupedPartners = useMemo(() => {
    if (userLocation || searchQuery.trim() || selectedCategory) return null;
    
    const groups: Record<string, PartnerWithMinCost[]> = {};
    filteredPartners.forEach(p => {
      const city = p.city || 'Andere';
      if (!groups[city]) groups[city] = [];
      groups[city].push(p);
    });
    return groups;
  }, [filteredPartners, userLocation, searchQuery, selectedCategory]);
  
  const handleRefresh = useCallback(async () => {
    await loadData();
  }, [loadData]);
  
  return (
    <PullToRefresh onRefresh={handleRefresh}>
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background backdrop-blur-lg border-b border-border/50">
        <div className="container py-3 space-y-3">
          {/* Title + View Toggle + Clear Filters in one row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <h1 className="text-lg font-bold">Partner</h1>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {filteredPartners.length}
              </span>
            </div>
            
            {/* Search - inline */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  'w-full h-9 pl-9 pr-8 rounded-xl text-sm',
                  'bg-muted border-0',
                  'placeholder:text-muted-foreground/60',
                  'focus:outline-none focus:ring-2 focus:ring-primary/20',
                  'transition-all duration-200'
                )}
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-background"
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className="text-xs text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-0.5 shrink-0">
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'list' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="Listenansicht"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={cn(
                  'p-1.5 rounded-md transition-all',
                  viewMode === 'map' 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-label="Kartenansicht"
              >
                <MapIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          {/* Offline Badge - only when from cache */}
          {isFromCache && (
            <OfflineDataBadge 
              isFromCache={isFromCache}
              lastUpdated={lastUpdated}
              onRefresh={loadData}
            />
          )}
          
          {/* Combined Filter Row: Location + Categories */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-none">
            {/* Location Chip */}
            <button
              onClick={handleLocationToggle}
              disabled={isRequestingLocation}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
                userLocation
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Navigation className={cn(
                'h-3.5 w-3.5',
                isRequestingLocation && 'animate-pulse'
              )} />
              {isRequestingLocation ? 'Suche...' : userLocation ? 'In der Nähe' : 'Standort'}
            </button>
            
            {/* City Chips */}
            {cities.map(city => (
              <button
                key={city}
                onClick={() => handleRegionSelect(city)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
                  selectedRegion === city
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {city}
              </button>
            ))}
            
            {/* Separator */}
            {categories.length > 0 && cities.length > 0 && (
              <div className="w-px bg-border/50 my-1 shrink-0" />
            )}
            
            {/* Category Chips */}
            {categories.map(category => (
              <button
                key={category}
                onClick={() => handleCategorySelect(category)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </header>
      
      {/* Location Error */}
      {locationError && (
        <div className="container pt-4">
          <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
            {locationError}
          </div>
        </div>
      )}
      
      {/* Content */}
      <div className={cn("container py-4", viewMode === 'map' && "h-[calc(100vh-280px)] min-h-[400px]")}>
        {isLoading ? (
          <div className="space-y-3 stagger-children">
            {Array.from({ length: 5 }).map((_, i) => (
              <PartnerCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState 
            title="Partner konnten nicht geladen werden"
            onRetry={loadData}
          />
        ) : viewMode === 'map' ? (
          /* Map View */
          mapboxToken ? (
            <div className="w-full h-full">
              <PartnerMap 
                partners={filteredPartners} 
                userLocation={userLocation}
                mapboxToken={mapboxToken}
              />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted rounded-2xl relative overflow-hidden">
              {/* Animated background */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-accent/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '0.5s' }} />
              </div>
              
              <div className="text-center p-6 relative z-10">
                {/* Animated map icon with rings */}
                <div className="relative inline-flex items-center justify-center mb-4">
                  <div className="absolute w-16 h-16 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: '2s' }} />
                  <div className="absolute w-12 h-12 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <MapIcon className="h-7 w-7 text-primary animate-pulse" />
                  </div>
                </div>
                
                <p className="text-sm font-medium text-foreground mb-1">Karte wird geladen</p>
                <p className="text-xs text-muted-foreground">Einen Moment bitte...</p>
              </div>
            </div>
          )
        ) : filteredPartners.length === 0 ? (
          <EmptyState
            icon={Store}
            title="Keine Partner gefunden"
            description={searchQuery ? 'Versuche einen anderen Suchbegriff.' : 'In dieser Region sind noch keine Partner.'}
          />
        ) : userLocation || searchQuery.trim() ? (
          /* Flat list with distance (location mode or search) */
          <div className="space-y-3 stagger-children">
            {userLocation && !searchQuery && (
              <p className="text-sm text-muted-foreground mb-2">
                {filteredPartners.length} Partner sortiert nach Entfernung
              </p>
            )}
            {filteredPartners.map(partner => (
              <PartnerCardWithDistance 
                key={partner.id} 
                partner={partner} 
                distance={(partner as any).distance}
              />
            ))}
          </div>
        ) : groupedPartners ? (
          /* Grouped by city (default) */
          <div className="space-y-8">
            {Object.entries(groupedPartners).map(([city, cityPartners]) => (
              <div key={city} className="animate-in">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h2 className="text-lg font-bold">{city}</h2>
                  <span className="text-sm text-muted-foreground">
                    ({cityPartners.length})
                  </span>
                </div>
                <div className="space-y-3">
                  {cityPartners.map(partner => (
                    <PartnerCard key={partner.id} partner={partner} minTalerCost={partner.minRewardCost} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback: Simple list */
          <div className="space-y-3">
            {filteredPartners.map(partner => (
              <PartnerCard key={partner.id} partner={partner} minTalerCost={partner.minRewardCost} />
            ))}
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}

// Partner card with distance display
interface PartnerCardWithDistanceProps {
  partner: PartnerWithMinCost;
  distance?: number;
}

function PartnerCardWithDistance({ partner, distance }: PartnerCardWithDistanceProps) {
  return (
    <Link to={`/partner/${partner.slug}`} className="list-item group">
      {/* Logo */}
      <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-primary/20 flex-shrink-0 flex items-center justify-center">
        {partner.logo_url ? (
          <img src={partner.logo_url} alt={partner.name} className="h-full w-full object-cover" />
        ) : (
          <Store className="h-7 w-7 text-secondary" />
        )}
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
            {partner.name}
          </h3>
          {partner.minRewardCost !== undefined && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-xs font-semibold whitespace-nowrap">
              <Coins className="h-3 w-3" />
              Ab {partner.minRewardCost}
            </span>
          )}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {partner.category || 'Partner'}
        </p>
        
        {/* Distance & Rating */}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          {distance !== undefined && (
            <div className="flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5 text-accent" />
              <span className="text-sm font-semibold text-accent">
                {distance < 1 
                  ? `${Math.round(distance * 1000)} m` 
                  : `${distance.toFixed(1)} km`}
              </span>
            </div>
          )}
          {partner.google_rating && (
            <GoogleReviewBadge
              rating={partner.google_rating}
              reviewCount={partner.google_review_count}
              googlePlaceId={partner.google_place_id}
              size="sm"
            />
          )}
        </div>
      </div>
      
      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  );
}
