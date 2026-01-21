import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, Star, ChevronRight } from 'lucide-react';
import { useRadioFavorites, RadioStation } from '@/hooks/useRadioFavorites';
import { useRadioStore, ExternalStation } from '@/lib/radio-store';
import { hapticToggle } from '@/lib/haptics';
import { cn } from '@/lib/utils';

// Radio 2Go constant
const RADIO_2GO_STATION: RadioStation = {
  uuid: 'radio2go',
  name: 'Radio 2Go',
  url: 'https://uksoutha.streaming.broadcast.radio/radio2go',
  favicon: '/pwa-192x192.png',
  country: 'Schweiz',
  tags: ['Pop', 'Hits', 'Lokal'],
  homepage: 'https://radio2go.fm',
};

interface FavoriteStationsSwitcherProps {
  onSwitchComplete?: () => void;
  className?: string;
}

export function FavoriteStationsSwitcher({ onSwitchComplete, className }: FavoriteStationsSwitcherProps) {
  const { favorites, isLoading } = useRadioFavorites();
  const { customStation, isRadio2Go, switchStation } = useRadioStore();
  
  // Build stations list: Radio 2Go first, then favorites
  const allStations: RadioStation[] = [
    RADIO_2GO_STATION,
    ...favorites.map(fav => ({
      uuid: fav.station_uuid,
      name: fav.station_name,
      url: fav.station_url,
      favicon: fav.station_favicon,
      country: fav.station_country || '',
      tags: fav.station_tags || [],
      homepage: fav.station_homepage,
    })).filter(s => s.uuid !== 'radio2go' && s.uuid !== 'radio-2go-default'),
  ];
  
  const handleSelectStation = (station: RadioStation) => {
    hapticToggle();
    
    // Get current playback state
    const { isPlaying: wasPlaying } = useRadioStore.getState();
    
    if (station.uuid === 'radio2go') {
      // Switch to Radio 2Go using proper switchStation method
      switchStation(null, wasPlaying);
    } else {
      // Switch to external station
      const externalStation: ExternalStation = {
        uuid: station.uuid,
        name: station.name,
        url: station.url,
        favicon: station.favicon,
        country: station.country,
        tags: station.tags,
      };
      switchStation(externalStation, wasPlaying);
    }
    
    onSwitchComplete?.();
  };
  
  const isCurrentStation = (station: RadioStation) => {
    if (station.uuid === 'radio2go' && isRadio2Go) return true;
    return customStation?.uuid === station.uuid;
  };
  
  if (isLoading || allStations.length <= 1) {
    return null;
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className={cn('w-full max-w-sm', className)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Star className="h-4 w-4 text-yellow-400" />
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wide">
          Schnellwechsel
        </span>
      </div>
      
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
        {allStations.map((station) => {
          const isCurrent = isCurrentStation(station);
          const isRadio2GoStation = station.uuid === 'radio2go';
          
          return (
            <button
              key={station.uuid}
              type="button"
              onClick={() => !isCurrent && handleSelectStation(station)}
              disabled={isCurrent}
              className={cn(
                'flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all touch-manipulation',
                isCurrent 
                  ? 'bg-accent/30 border border-accent/50' 
                  : 'bg-white/10 hover:bg-white/15 active:scale-95'
              )}
            >
              {/* Station Icon */}
              <div className="relative h-8 w-8 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                {station.favicon ? (
                  <img 
                    src={station.favicon} 
                    alt="" 
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Radio className="h-4 w-4 text-white/60" />
                )}
              </div>
              
              {/* Station Name */}
              <div className="min-w-0">
                <span className={cn(
                  'text-sm font-medium truncate block max-w-[80px]',
                  isCurrent ? 'text-accent' : 'text-white'
                )}>
                  {station.name}
                </span>
                {!isRadio2GoStation && (
                  <span className="text-[10px] text-white/50">½ Taler</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
