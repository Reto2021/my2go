import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthSafe } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface RadioStation {
  uuid: string;
  name: string;
  url: string;
  favicon: string | null;
  country: string;
  countryCode?: string;
  language?: string;
  tags: string[];
  votes?: number;
  homepage: string | null;
  codec?: string;
  bitrate?: number;
}

export interface UserRadioFavorite {
  id: string;
  user_id: string;
  station_uuid: string;
  station_name: string;
  station_url: string;
  station_favicon: string | null;
  station_country: string | null;
  station_tags: string[] | null;
  station_homepage: string | null;
  created_at: string;
}

// Default Radio 2Go station as favorite
const RADIO_2GO_DEFAULT: RadioStation = {
  uuid: 'radio-2go-default',
  name: 'Radio 2Go',
  url: 'https://uksoutha.streaming.broadcast.radio/radio2go',
  favicon: '/pwa-192x192.png',
  country: 'CH',
  tags: ['pop', 'hits', 'switzerland'],
  homepage: 'https://my2go.lovable.app',
};

export function useRadioFavorites() {
  const authContext = useAuthSafe();
  const userId = authContext?.user?.id;
  
  const [favorites, setFavorites] = useState<UserRadioFavorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch user's favorites
  const fetchFavorites = useCallback(async () => {
    if (!userId) {
      setFavorites([]);
      setIsLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_radio_favorites')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // If user has no favorites, automatically add Radio 2Go as default
      if (!data || data.length === 0) {
        const { error: insertError } = await supabase
          .from('user_radio_favorites')
          .insert({
            user_id: userId,
            station_uuid: RADIO_2GO_DEFAULT.uuid,
            station_name: RADIO_2GO_DEFAULT.name,
            station_url: RADIO_2GO_DEFAULT.url,
            station_favicon: RADIO_2GO_DEFAULT.favicon,
            station_country: RADIO_2GO_DEFAULT.country,
            station_tags: RADIO_2GO_DEFAULT.tags,
            station_homepage: RADIO_2GO_DEFAULT.homepage,
          });
        
        if (!insertError) {
          // Refetch to get the new favorite
          const { data: newData } = await supabase
            .from('user_radio_favorites')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
          setFavorites(newData || []);
        } else {
          setFavorites([]);
        }
      } else {
        setFavorites(data);
      }
    } catch (error) {
      console.error('Error fetching radio favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);
  
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);
  
  // Add a station to favorites
  const addFavorite = useCallback(async (station: RadioStation) => {
    if (!userId) {
      toast.error('Bitte melde dich an, um Favoriten zu speichern');
      return false;
    }
    
    try {
      const { error } = await supabase
        .from('user_radio_favorites')
        .insert({
          user_id: userId,
          station_uuid: station.uuid,
          station_name: station.name,
          station_url: station.url,
          station_favicon: station.favicon,
          station_country: station.country,
          station_tags: station.tags,
          station_homepage: station.homepage,
        });
      
      if (error) {
        if (error.code === '23505') {
          toast.info('Sender ist bereits in deinen Favoriten');
          return false;
        }
        throw error;
      }
      
      toast.success(`${station.name} zu Favoriten hinzugefügt`);
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast.error('Fehler beim Speichern');
      return false;
    }
  }, [userId, fetchFavorites]);
  
  // Remove a station from favorites
  const removeFavorite = useCallback(async (stationUuid: string) => {
    if (!userId) return false;
    
    try {
      const { error } = await supabase
        .from('user_radio_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('station_uuid', stationUuid);
      
      if (error) throw error;
      
      toast.success('Favorit entfernt');
      await fetchFavorites();
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Fehler beim Entfernen');
      return false;
    }
  }, [userId, fetchFavorites]);
  
  // Check if a station is a favorite
  const isFavorite = useCallback((stationUuid: string) => {
    return favorites.some(f => f.station_uuid === stationUuid);
  }, [favorites]);
  
  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    isFavorite,
    refetch: fetchFavorites,
  };
}

// Search stations from radio-browser.info via edge function
// Default: Switzerland, ordered by clickcount (popularity)
export async function searchRadioStations(
  query: string, 
  country: string = 'Switzerland',
  orderBy: 'clickcount' | 'votes' = 'clickcount'
): Promise<RadioStation[]> {
  try {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    params.append('country', country);
    params.append('order', orderBy);
    params.append('limit', '50');
    
    // Use fetch directly since we need query params
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/search-radio-stations?${params.toString()}`,
      {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      }
    );
    
    if (!response.ok) throw new Error('Search failed');
    
    const result = await response.json();
    return result.stations || [];
  } catch (error) {
    console.error('Error searching radio stations:', error);
    return [];
  }
}

// Get popular Swiss stations (for initial display without search)
export async function getPopularSwissStations(): Promise<RadioStation[]> {
  return searchRadioStations('', 'Switzerland', 'clickcount');
}