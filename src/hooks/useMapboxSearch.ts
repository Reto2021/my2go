import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  partnerId?: string; // If this is a 2Go partner
}

let cachedToken: string | null = null;

async function getMapboxToken(): Promise<string> {
  if (cachedToken) return cachedToken;
  const { data, error } = await supabase.functions.invoke('get-mapbox-token');
  if (error || !data?.token) throw new Error('Mapbox token not available');
  cachedToken = data.token;
  return data.token;
}

export function useMapboxSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const search = useCallback(async (query: string, userLat?: number, userLng?: number) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const token = await getMapboxToken();
        const proximity = userLat && userLng ? `&proximity=${userLng},${userLat}` : '';
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&country=ch&language=de&limit=5${proximity}`;
        
        const res = await fetch(url);
        const data = await res.json();

        const mapped: SearchResult[] = (data.features || []).map((f: any) => ({
          id: f.id,
          name: f.text || f.place_name,
          address: f.place_name,
          lat: f.center[1],
          lng: f.center[0],
          category: f.properties?.category,
        }));

        setResults(mapped);
      } catch (err) {
        console.error('Search error:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  }, []);

  const clear = useCallback(() => {
    setResults([]);
  }, []);

  return { results, isSearching, search, clear };
}
