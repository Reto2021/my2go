import { useState } from 'react';
import { Search, Loader2, Star, MapPin, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  rating?: number;
  user_ratings_total?: number;
  formatted_phone_number?: string;
  website?: string;
  lat?: number;
  lng?: number;
}

interface GooglePlaceIdSearchProps {
  formData: {
    name: string;
    address_street: string;
    address_number: string;
    postal_code: string;
    city: string;
    google_place_id: string;
  };
  setFormData: (fn: (prev: any) => any) => void;
}

export function GooglePlaceIdSearch({ formData, setFormData }: GooglePlaceIdSearchProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PlaceResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!formData.name || formData.name.trim().length < 2) {
      toast.error('Bitte gib zuerst einen Firmennamen ein');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setShowResults(true);

    try {
      const { data, error } = await supabase.functions.invoke('search-place-id', {
        body: {
          name: formData.name,
          address_street: formData.address_street,
          address_number: formData.address_number,
          postal_code: formData.postal_code,
          city: formData.city,
        },
      });

      if (error) throw error;

      if (!data.success) {
        setSearchError(data.error || 'Suche fehlgeschlagen');
        return;
      }

      setSearchResults(data.results || []);
      
      if (data.results?.length === 0) {
        setSearchError('Keine Ergebnisse gefunden. Versuche die Adressdaten anzupassen.');
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchError('Fehler bei der Suche. Bitte versuche es erneut.');
    } finally {
      setIsSearching(false);
    }
  };

  const selectPlace = (place: PlaceResult) => {
    setFormData(prev => ({
      ...prev,
      google_place_id: place.place_id,
    }));
    setShowResults(false);
    toast.success(`Google Place ID für "${place.name}" übernommen`);
  };

  return (
    <div className="p-4 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
      <label className="block text-sm font-medium flex items-center gap-2">
        <Star className="h-4 w-4 text-accent" />
        Google Place ID
      </label>
      
      {/* Current Value & Manual Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={formData.google_place_id}
          onChange={(e) => setFormData(prev => ({ ...prev, google_place_id: e.target.value }))}
          className="flex-1 h-11 px-4 rounded-xl bg-muted border-2 border-transparent focus:outline-none focus:border-primary/30 focus:bg-background transition-all"
          placeholder="z.B. ChIJ..."
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || !formData.name}
          className={cn(
            "flex items-center gap-2 px-4 h-11 rounded-xl font-medium transition-all",
            "bg-accent text-accent-foreground hover:bg-accent/90",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          Suchen
        </button>
      </div>

      {/* Search Results */}
      {showResults && (
        <div className="rounded-xl border bg-background overflow-hidden">
          {isSearching && (
            <div className="p-6 text-center">
              <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">
                Suche nach "{formData.name}" {formData.city ? `in ${formData.city}` : ''}...
              </p>
            </div>
          )}

          {searchError && !isSearching && (
            <div className="p-4 flex items-start gap-3 text-warning">
              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Keine Treffer</p>
                <p className="text-sm text-muted-foreground">{searchError}</p>
              </div>
            </div>
          )}

          {!isSearching && searchResults.length > 0 && (
            <div className="divide-y">
              <div className="px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                {searchResults.length} Ergebnis{searchResults.length !== 1 ? 'se' : ''} gefunden – Klicke zum Übernehmen
              </div>
              {searchResults.map((place) => (
                <button
                  key={place.place_id}
                  type="button"
                  onClick={() => selectPlace(place)}
                  className="w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <MapPin className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold truncate">{place.name}</span>
                      {place.rating && (
                        <span className="flex items-center gap-1 text-xs text-warning shrink-0">
                          <Star className="h-3 w-3 fill-warning" />
                          {place.rating.toFixed(1)}
                          {place.user_ratings_total && (
                            <span className="text-muted-foreground">
                              ({place.user_ratings_total})
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {place.formatted_address}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1 font-mono truncate">
                      {place.place_id}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 opacity-0 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          )}

          {showResults && !isSearching && (
            <div className="px-4 py-2 bg-muted/30 border-t">
              <button
                type="button"
                onClick={() => setShowResults(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Schliessen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Helper Links */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <a 
          href="https://developers.google.com/maps/documentation/places/web-service/place-id" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-accent hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          Google Place ID Finder
        </a>
        {formData.google_place_id && (
          <a 
            href={`https://www.google.com/maps/place/?q=place_id:${formData.google_place_id}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary hover:underline"
          >
            <MapPin className="h-3 w-3" />
            In Google Maps anzeigen
          </a>
        )}
      </div>
    </div>
  );
}
