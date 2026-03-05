import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  partnerId?: string;
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
        const { data, error } = await supabase.functions.invoke('search-drive-places', {
          body: { query, lat: userLat, lng: userLng },
        });

        if (error) throw error;
        setResults(data?.results || []);
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
