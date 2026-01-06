import { useEffect, useState, useMemo } from 'react';
import { getPartners, Partner } from '@/lib/api';
import { PartnerCard, PartnerCardSkeleton } from '@/components/ui/partner-card';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/ui/error-state';
import { cn } from '@/lib/utils';
import { MapPin, Search, Navigation, X, Store, ChevronRight } from 'lucide-react';

// Swiss regions for grouping
const REGIONS = [
  { id: 'bern', name: 'Bern', cities: ['Bern', 'Thun', 'Biel'] },
  { id: 'zurich', name: 'Zürich', cities: ['Zürich', 'Winterthur'] },
  { id: 'basel', name: 'Basel', cities: ['Basel'] },
  { id: 'luzern', name: 'Luzern', cities: ['Luzern'] },
];

export default function PartnerPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  
  // Location (opt-in, not stored)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const loadPartners = async () => {
    setIsLoading(true);
    setError(false);
    try {
      const data = await getPartners();
      setPartners(data);
    } catch (err) {
      console.error('Failed to load partners:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadPartners();
  }, []);
  
  // RAILGUARD: Location is opt-in, not stored in history
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Standortdienste nicht verfügbar.');
      return;
    }
    
    setIsRequestingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Only use current position, never store history
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsRequestingLocation(false);
        setSelectedRegion(null); // Clear region filter when using location
      },
      (err) => {
        console.error('Location error:', err);
        setLocationError('Standort konnte nicht ermittelt werden.');
        setIsRequestingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };
  
  const clearLocation = () => {
    setUserLocation(null);
    setLocationError(null);
  };
  
  // Calculate distance (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };
  
  // Filter and sort partners
  const filteredPartners = useMemo(() => {
    let result = [...partners];
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query)
      );
    }
    
    // Region filter
    if (selectedRegion) {
      const region = REGIONS.find(r => r.id === selectedRegion);
      if (region) {
        result = result.filter(p => 
          region.cities.some(city => p.city?.includes(city))
        );
      }
    }
    
    // Add distance and sort if location available
    if (userLocation) {
      result = result.map(p => ({
        ...p,
        distance: calculateDistance(userLocation.lat, userLocation.lng, p.lat, p.lng),
      })).sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    
    return result;
  }, [partners, searchQuery, selectedRegion, userLocation]);
  
  // Group partners by city (when no location)
  const groupedPartners = useMemo(() => {
    if (userLocation || searchQuery.trim()) return null;
    
    const groups: Record<string, Partner[]> = {};
    filteredPartners.forEach(p => {
      const city = p.city || 'Andere';
      if (!groups[city]) groups[city] = [];
      groups[city].push(p);
    });
    return groups;
  }, [filteredPartners, userLocation, searchQuery]);
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 space-y-3">
          <h1 className="text-display-sm">Partner entdecken</h1>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Partner oder Ort suchen..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn(
                'w-full h-12 pl-12 pr-4 rounded-2xl',
                'bg-muted border-2 border-transparent',
                'placeholder:text-muted-foreground/60',
                'focus:outline-none focus:border-primary/30 focus:bg-background',
                'transition-all duration-200'
              )}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-background"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
          
          {/* Location & Region Chips */}
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 scrollbar-none">
            {/* Location Chip */}
            <button
              onClick={userLocation ? clearLocation : requestLocation}
              disabled={isRequestingLocation}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
                userLocation
                  ? 'bg-accent text-accent-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              <Navigation className={cn(
                'h-4 w-4',
                isRequestingLocation && 'animate-pulse'
              )} />
              {isRequestingLocation ? 'Suche...' : userLocation ? 'In der Nähe' : 'Standort'}
              {userLocation && <X className="h-3 w-3 ml-1" />}
            </button>
            
            {/* Region Chips */}
            {REGIONS.map(region => (
              <button
                key={region.id}
                onClick={() => {
                  setSelectedRegion(selectedRegion === region.id ? null : region.id);
                  clearLocation();
                }}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all duration-200',
                  selectedRegion === region.id
                    ? 'bg-secondary text-secondary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {region.name}
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
      <div className="container py-6">
        {isLoading ? (
          <div className="space-y-3 stagger-children">
            {Array.from({ length: 5 }).map((_, i) => (
              <PartnerCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorState 
            title="Partner konnten nicht geladen werden"
            onRetry={loadPartners}
          />
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
                    <PartnerCard key={partner.id} partner={partner} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Fallback: Simple list */
          <div className="space-y-3">
            {filteredPartners.map(partner => (
              <PartnerCard key={partner.id} partner={partner} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Partner card with distance display
interface PartnerCardWithDistanceProps {
  partner: Partner;
  distance?: number;
}

function PartnerCardWithDistance({ partner, distance }: PartnerCardWithDistanceProps) {
  return (
    <div className="list-item group cursor-pointer" onClick={() => window.location.href = `/partner/${partner.id}`}>
      {/* Logo */}
      <div className="relative h-16 w-16 rounded-2xl overflow-hidden bg-primary/20 flex-shrink-0 flex items-center justify-center">
        <Store className="h-7 w-7 text-secondary" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-foreground line-clamp-1 group-hover:text-secondary transition-colors">
          {partner.name}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-1">
          {partner.category}
        </p>
        
        {/* Distance */}
        {distance !== undefined && (
          <div className="flex items-center gap-1.5 mt-1">
            <Navigation className="h-3.5 w-3.5 text-accent" />
            <span className="text-sm font-semibold text-accent">
              {distance < 1 
                ? `${Math.round(distance * 1000)} m` 
                : `${distance.toFixed(1)} km`}
            </span>
          </div>
        )}
      </div>
      
      {/* Arrow */}
      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-secondary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </div>
  );
}
