import { motion } from "framer-motion";
import { ChevronUp, Radio, ArrowLeftRight } from "lucide-react";
import { hapticToggle } from "@/lib/haptics";
import { Equalizer } from "../Equalizer";
import { formatTime } from "../utils";
import { useRadioStore, ExternalStation } from "@/lib/radio-store";
import { useRadioFavorites } from "@/hooks/useRadioFavorites";
import { cn } from "@/lib/utils";

interface NowPlaying {
  title?: string;
  artist?: string;
  artworkUrl?: string;
}

interface MinimizedBarStateProps {
  nowPlaying: NowPlaying | null;
  elapsed: number;
  onRestore: () => void;
}

export function MinimizedBarState({
  nowPlaying,
  elapsed,
  onRestore,
}: MinimizedBarStateProps) {
  const { isRadio2Go, setCustomStation, audio, isPlaying, customStation } = useRadioStore();
  const { favorites } = useRadioFavorites();
  
  // Get first favorite that's not Radio 2Go
  const firstFavorite = favorites.find(f => 
    f.station_uuid !== 'radio2go' && f.station_uuid !== 'radio-2go-default'
  );
  
  // Quick switch handler
  const handleQuickSwitch = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticToggle();
    
    // Stop current playback
    if (audio && isPlaying) {
      audio.pause();
      audio.src = '';
    }
    
    if (isRadio2Go && firstFavorite) {
      // Switch to first favorite
      const externalStation: ExternalStation = {
        uuid: firstFavorite.station_uuid,
        name: firstFavorite.station_name,
        url: firstFavorite.station_url,
        favicon: firstFavorite.station_favicon,
        country: firstFavorite.station_country || '',
        tags: firstFavorite.station_tags || [],
      };
      setCustomStation(externalStation);
      
      // Restart playback
      if (isPlaying && audio) {
        audio.src = firstFavorite.station_url;
        audio.play().catch(err => console.error('Playback failed:', err));
      }
    } else {
      // Switch to Radio 2Go
      setCustomStation(null);
      
      // Restart playback with Radio 2Go
      if (isPlaying && audio) {
        audio.src = 'https://uksoutha.streaming.broadcast.radio/radio2go';
        audio.play().catch(err => console.error('Playback failed:', err));
      }
    }
  };
  
  // Determine what to show
  const showSwitchButton = !isRadio2Go || (isRadio2Go && firstFavorite);
  const switchTarget = isRadio2Go ? firstFavorite : null;
  
  return (
    <motion.div
      key="minimized-bar"
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 40, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.5, bottom: 0.3 }}
      onDragEnd={(_, info) => {
        // Swipe up to restore mini player
        if (info.offset.y < -30 || info.velocity.y < -150) {
          hapticToggle();
          onRestore();
        }
      }}
      onClick={() => {
        hapticToggle();
        onRestore();
      }}
      className="rounded-full bg-secondary/90 backdrop-blur-sm shadow-lg px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-secondary transition-colors"
    >
      {/* Quick Switch Button - bidirectional */}
      {showSwitchButton && (
        <button
          type="button"
          onClick={handleQuickSwitch}
          className="h-8 w-8 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0 hover:bg-accent/30 active:scale-95 transition-all touch-manipulation"
          title={isRadio2Go ? `Zu ${switchTarget?.station_name}` : "Zurück zu Radio 2Go"}
        >
          {isRadio2Go && switchTarget?.station_favicon ? (
            <img 
              src={switchTarget.station_favicon} 
              alt={switchTarget.station_name} 
              className="h-5 w-5 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <img 
              src="/pwa-192x192.png" 
              alt="Radio 2Go" 
              className="h-5 w-5 rounded-full"
            />
          )}
        </button>
      )}
      
      {/* Equalizer */}
      <Equalizer className="flex-shrink-0" />

      {/* Now Playing */}
      <p className="text-xs text-secondary-foreground font-medium truncate flex-1">
        {nowPlaying?.title || "Radio 2Go läuft"}
      </p>

      {/* Session time */}
      <span className="text-xs text-secondary-foreground/60 tabular-nums">
        {formatTime(elapsed)}
      </span>

      {/* Swipe up hint */}
      <ChevronUp className="h-4 w-4 text-secondary-foreground/40" />
    </motion.div>
  );
}
