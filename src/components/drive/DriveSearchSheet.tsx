import { useState, useCallback, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMapboxSearch, SearchResult } from '@/hooks/useMapboxSearch';
import { useLocation } from '@/lib/location';
import { useRadioStore } from '@/lib/radio-store';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';
import { 
  Search, MapPin, Car, Footprints, Navigation, ExternalLink, 
  Loader2, X, Clock, Ruler, Volume2, VolumeX, Coins, QrCode
} from 'lucide-react';
import { cn } from '@/lib/utils';

type TransportMode = 'driving' | 'walking';

interface RouteInfo {
  duration: number; // seconds
  distance: number; // meters
}

interface DriveSearchSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DriveSearchSheet({ open, onOpenChange }: DriveSearchSheetProps) {
  const [query, setQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<SearchResult | null>(null);
  const [transportMode, setTransportMode] = useState<TransportMode>('driving');
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [matchedPartnerId, setMatchedPartnerId] = useState<string | null>(null);

  const { results, isSearching, search, clear } = useMapboxSearch();
  const { userLocation, requestLocation } = useLocation();
  const { isPlaying, togglePlay, volume, setVolume } = useRadioStore();
  const { user } = useAuth();
  const [userQRCode, setUserQRCode] = useState<string | null>(null);

  // Fetch user QR code
  useEffect(() => {
    if (!user || !open) return;
    supabase
      .from('user_codes')
      .select('permanent_code')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
      .then(({ data }) => {
        setUserQRCode(data?.permanent_code || null);
      });
  }, [user, open]);

  // Search as user types
  useEffect(() => {
    if (query && !selectedDestination) {
      search(query, userLocation?.lat, userLocation?.lng);
    }
  }, [query, userLocation, search, selectedDestination]);

  // Fetch route when destination + location are available
  useEffect(() => {
    if (!selectedDestination || !userLocation) return;
    fetchRoute();
  }, [selectedDestination, transportMode, userLocation]);

  // Check if destination matches a partner
  useEffect(() => {
    if (!selectedDestination) {
      setMatchedPartnerId(null);
      return;
    }
    checkPartnerMatch(selectedDestination);
  }, [selectedDestination]);

  const fetchRoute = useCallback(async () => {
    if (!selectedDestination || !userLocation) return;
    setIsLoadingRoute(true);
    try {
      const token = (await supabase.functions.invoke('get-mapbox-token')).data?.token;
      if (!token) return;

      const profile = transportMode === 'driving' ? 'driving' : 'walking';
      const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${userLocation.lng},${userLocation.lat};${selectedDestination.lng},${selectedDestination.lat}?access_token=${token}&overview=false`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      if (data.routes?.[0]) {
        setRouteInfo({
          duration: data.routes[0].duration,
          distance: data.routes[0].distance,
        });
      }
    } catch (err) {
      console.error('Route fetch error:', err);
    } finally {
      setIsLoadingRoute(false);
    }
  }, [selectedDestination, userLocation, transportMode]);

  const checkPartnerMatch = async (dest: SearchResult) => {
    try {
      const { data } = await supabase.rpc('get_public_partners_safe');
      if (!data) return;
      
      // Find partner within 100m of destination
      const match = data.find((p: any) => {
        if (!p.lat || !p.lng) return false;
        const dist = haversine(dest.lat, dest.lng, Number(p.lat), Number(p.lng));
        return dist < 0.1; // 100m
      });
      
      setMatchedPartnerId(match?.id || null);
    } catch {}
  };

  const haversine = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const handleSelectDestination = (result: SearchResult) => {
    setSelectedDestination(result);
    setQuery(result.name);
    clear();
  };

  const handleClearDestination = () => {
    setSelectedDestination(null);
    setRouteInfo(null);
    setMatchedPartnerId(null);
    setQuery('');
  };

  const handleGo = async () => {
    if (!selectedDestination) return;

    // Start radio if not playing
    if (!isPlaying) {
      togglePlay();
    }

    // Award Taler if navigating to a partner
    if (matchedPartnerId && user) {
      try {
        const { data } = await supabase.rpc('award_navigation_taler', {
          _user_id: user.id,
          _partner_id: matchedPartnerId,
        });
        if (data && typeof data === 'object' && 'success' in data && data.success) {
          toast.success('🧭 +3 Taler – Navigations-Bonus erhalten!');
        }
      } catch {}
    }

    // Open external maps
    const { lat, lng, name } = selectedDestination;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const encodedName = encodeURIComponent(name);
    
    let mapsUrl: string;
    if (transportMode === 'walking') {
      mapsUrl = isIOS 
        ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=w`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`;
    } else {
      mapsUrl = isIOS
        ? `maps://maps.apple.com/?daddr=${lat},${lng}&dirflg=d`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    }

    window.open(mapsUrl, '_blank');
    onOpenChange(false);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return '< 1 Min';
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min} Min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h} Std ${m} Min` : `${h} Std`;
  };

  const formatDistance = (meters: number) => {
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="px-5 pt-5 pb-3">
            <SheetTitle className="text-lg font-bold flex items-center gap-2">
              <Navigation className="h-5 w-5 text-accent" />
              Wo sammelst du als nächstes?
            </SheetTitle>
          </SheetHeader>

          {/* Search Input */}
          <div className="px-5 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (selectedDestination) {
                    setSelectedDestination(null);
                    setRouteInfo(null);
                  }
                }}
                placeholder="Adresse, Ort oder Geschäft..."
                className="pl-10 pr-10 h-12 rounded-xl text-base"
                autoFocus
              />
              {query && (
                <button 
                  onClick={handleClearDestination}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground/60 mt-1 ml-1">
              Finde Partner in deiner Nähe und sammle 2Go Taler
            </p>

            {/* Request location if not available */}
            {!userLocation && (
              <button
                onClick={requestLocation}
                className="mt-2 flex items-center gap-2 text-xs text-accent font-medium"
              >
                <Navigation className="h-3.5 w-3.5" />
                Standort aktivieren für bessere Ergebnisse
              </button>
            )}
          </div>

          {/* Search Results */}
          {!selectedDestination && results.length > 0 && (
            <div className="flex-1 overflow-y-auto px-5">
              <div className="space-y-1">
                {results.map((result) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelectDestination(result)}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left"
                  >
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{result.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.address}</p>
                    </div>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-accent shrink-0 mt-1">
                      <Coins className="h-3 w-3" />
                      Taler
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isSearching && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Empty state when no search */}
          {!selectedDestination && !query && !isSearching && (
            <div className="flex-1 flex flex-col items-center justify-center pb-24 px-5 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl bg-accent/15 flex items-center justify-center">
                <Navigation className="h-7 w-7 text-accent" />
              </div>
              <p className="font-semibold text-sm">Wo sammelst du als nächstes?</p>
              <p className="text-xs text-muted-foreground max-w-[240px]">
                Finde lokale Partner, navigiere hin und sammle 2Go Taler bei deinem Einkauf.
              </p>
            </div>
          )}

          {/* Route Preview */}
          {selectedDestination && (
            <div className="flex-1 px-5 space-y-4">
              {/* Destination Card */}
              <div className="p-4 rounded-2xl bg-muted/50 border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{selectedDestination.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{selectedDestination.address}</p>
                    {matchedPartnerId && (
                      <div className="flex items-center gap-1 mt-1.5 text-xs font-semibold text-accent">
                        <Coins className="h-3.5 w-3.5" />
                        +3 Taler Navigations-Bonus
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Transport Mode Picker */}
              <div className="flex gap-2">
                <button
                  onClick={() => setTransportMode('driving')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
                    transportMode === 'driving'
                      ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Car className="h-4 w-4" />
                  Auto
                </button>
                <button
                  onClick={() => setTransportMode('walking')}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all",
                    transportMode === 'walking'
                      ? "bg-accent text-accent-foreground shadow-lg shadow-accent/20"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  <Footprints className="h-4 w-4" />
                  Zu Fuss
                </button>
              </div>

              {/* Route Info */}
              {isLoadingRoute ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-5 w-5 animate-spin text-accent" />
                </div>
              ) : routeInfo ? (
                <div className="flex gap-4 justify-center">
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-sm">{formatDuration(routeInfo.duration)}</span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted/50">
                    <Ruler className="h-4 w-4 text-muted-foreground" />
                    <span className="font-bold text-sm">{formatDistance(routeInfo.distance)}</span>
                  </div>
                </div>
              ) : !userLocation ? (
                <p className="text-center text-xs text-muted-foreground">
                  Standort aktivieren für Route-Vorschau
                </p>
              ) : null}

              {/* Radio Volume Control */}
              {isPlaying && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10">
                  <button
                    onClick={() => {
                      if (volume > 0) {
                        setVolume(0);
                      } else {
                        setVolume(0.3);
                      }
                    }}
                    className="text-primary"
                  >
                    {volume > 0 ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
                  </button>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-primary">Radio läuft</p>
                    <p className="text-[10px] text-muted-foreground">
                      Leise stellen ohne Sprachnavigation zu beeinflussen
                    </p>
                  </div>
                </div>
              )}

              {/* Go Button */}
              <Button
                onClick={handleGo}
                size="lg"
                className="w-full h-14 rounded-2xl text-base font-bold bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20"
              >
                <ExternalLink className="h-5 w-5 mr-2" />
                {transportMode === 'driving' ? 'In Maps navigieren' : 'Route in Maps öffnen'}
              </Button>
              
              <p className="text-center text-[10px] text-muted-foreground pb-4">
                Dein Soundtrack spielt im Hintergrund weiter 🎵
              </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
