import { useState, useEffect } from 'react';
import { Search, Radio, Heart, Play, Loader2, Star, Globe, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRadioFavorites, searchRadioStations, getPopularSwissStations, RadioStation } from '@/hooks/useRadioFavorites';
import { cn } from '@/lib/utils';

// Simple debounce hook
function useDebounceValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface RadioStationSearchProps {
  onSelectStation: (station: RadioStation | null) => void;
  currentStation: RadioStation | null;
  className?: string;
}

// Radio 2Go as a special station
const RADIO_2GO_STATION: RadioStation = {
  uuid: 'radio2go',
  name: 'Radio 2Go',
  url: 'https://uksoutha.streaming.broadcast.radio/radio2go',
  favicon: '/pwa-192x192.png',
  country: 'Schweiz',
  tags: ['Pop', 'Hits', 'Lokal'],
  homepage: 'https://radio2go.fm',
};

export function RadioStationSearch({ onSelectStation, currentStation, className }: RadioStationSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RadioStation[]>([]);
  const [popularStations, setPopularStations] = useState<RadioStation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [activeTab, setActiveTab] = useState<'favorites' | 'search'>('favorites');
  
  const debouncedQuery = useDebounceValue(searchQuery, 400);
  const { favorites, isLoading: favoritesLoading, addFavorite, removeFavorite, isFavorite } = useRadioFavorites();
  
  // Load popular Swiss stations on mount
  useEffect(() => {
    const loadPopular = async () => {
      setIsLoadingPopular(true);
      try {
        const stations = await getPopularSwissStations();
        setPopularStations(stations);
      } catch (error) {
        console.error('Error loading popular stations:', error);
      } finally {
        setIsLoadingPopular(false);
      }
    };
    loadPopular();
  }, []);
  
  // Search when query changes - always search in Switzerland, ranked by clicks
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    
    const search = async () => {
      setIsSearching(true);
      try {
        // Search in Switzerland by default, ordered by clickcount (popularity)
        const results = await searchRadioStations(debouncedQuery, 'Switzerland', 'clickcount');
        setSearchResults(results);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };
    
    search();
  }, [debouncedQuery]);
  
  // Switch to search tab when typing
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setActiveTab('search');
    }
  }, [searchQuery]);
  
  const handleSelectStation = (station: RadioStation) => {
    onSelectStation(station.uuid === 'radio2go' ? null : station);
  };
  
  const isCurrentStation = (station: RadioStation) => {
    if (station.uuid === 'radio2go' && !currentStation) return true;
    return currentStation?.uuid === station.uuid;
  };

  const StationItem = ({ station, showFavoriteButton = true }: { station: RadioStation; showFavoriteButton?: boolean }) => {
    const isSelected = isCurrentStation(station);
    const isFav = isFavorite(station.uuid);
    const isRadio2Go = station.uuid === 'radio2go';
    
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 rounded-lg transition-colors cursor-pointer',
          isSelected ? 'bg-accent/20 border border-accent' : 'bg-muted/50 hover:bg-muted'
        )}
        onClick={() => handleSelectStation(station)}
      >
        {/* Station icon/logo */}
        <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-secondary flex items-center justify-center flex-shrink-0">
          {station.favicon ? (
            <img 
              src={station.favicon} 
              alt={station.name}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <Radio className={cn("h-6 w-6 text-muted-foreground", station.favicon && "hidden")} />
          {isRadio2Go && (
            <div className="absolute -top-1 -right-1 bg-accent rounded-full p-0.5">
              <Star className="h-3 w-3 text-accent-foreground" />
            </div>
          )}
        </div>
        
        {/* Station info */}
        <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
            <span className="font-medium truncate">{station.name}</span>
            {isRadio2Go && (
              <Badge variant="default" className="text-xs bg-accent text-accent-foreground">
                Volle Taler
              </Badge>
            )}
            {!isRadio2Go && (
              <Badge variant="outline" className="text-xs">
                ½ Taler
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <Globe className="h-3 w-3" />
            <span>{station.country}</span>
            {station.tags?.slice(0, 2).map((tag, i) => (
              <Badge key={i} variant="secondary" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1">
          {showFavoriteButton && !isRadio2Go && (
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={(e) => {
                e.stopPropagation();
                isFav ? removeFavorite(station.uuid) : addFavorite(station);
              }}
            >
              {isFav ? (
                <Heart className="h-4 w-4 fill-red-500 text-red-500" />
              ) : (
                <Heart className="h-4 w-4" />
              )}
            </Button>
          )}
          {isSelected && (
            <Badge className="bg-accent text-accent-foreground">
              <Play className="h-3 w-3 mr-1" />
              Aktiv
            </Badge>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Radiosender suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
        {isSearching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      
      {/* Tabs for favorites and search results */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'favorites' | 'search')}>
        <TabsList className="w-full">
          <TabsTrigger value="favorites" className="flex-1">
            <Heart className="h-4 w-4 mr-2" />
            Meine Sender
          </TabsTrigger>
          <TabsTrigger value="search" className="flex-1">
            <Search className="h-4 w-4 mr-2" />
            Suche
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="favorites" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="flex flex-col gap-2">
              {/* Radio 2Go always first */}
              <StationItem station={RADIO_2GO_STATION} showFavoriteButton={false} />
              
              {/* Info banner */}
              <div className="bg-accent/10 rounded-lg p-3 text-sm text-muted-foreground">
                <strong className="text-foreground">💡 Tipp:</strong> Mit Radio 2Go sammelst du <strong className="text-accent">volle Taler</strong>. 
                Bei anderen Sendern brauchst du die doppelte Hördauer für die gleichen Belohnungen.
              </div>
              
              {/* User favorites */}
              {favoritesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Noch keine Favoriten</p>
                  <p className="text-sm">Suche nach Sendern und füge sie hinzu</p>
                </div>
              ) : (
                favorites.map((fav) => (
                  <StationItem
                    key={fav.id}
                    station={{
                      uuid: fav.station_uuid,
                      name: fav.station_name,
                      url: fav.station_url,
                      favicon: fav.station_favicon,
                      country: fav.station_country || '',
                      tags: fav.station_tags || [],
                      homepage: fav.station_homepage,
                    }}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="search" className="mt-4">
          <ScrollArea className="h-[400px]">
            <div className="flex flex-col gap-2">
              {searchQuery.length < 2 ? (
                <>
                  {/* Show popular Swiss stations when not searching */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Beliebte Schweizer Sender</span>
                  </div>
                  {isLoadingPopular ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : popularStations.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Keine Sender gefunden</p>
                    </div>
                  ) : (
                    popularStations.slice(0, 15).map((station) => (
                      <StationItem key={station.uuid} station={station} />
                    ))
                  )}
                </>
              ) : isSearching ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-muted-foreground">Suche in der Schweiz...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Radio className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Keine Sender in der Schweiz gefunden</p>
                  <p className="text-sm">Versuche einen anderen Suchbegriff</p>
                </div>
              ) : (
                searchResults.map((station) => (
                  <StationItem key={station.uuid} station={station} />
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}