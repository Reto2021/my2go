import { motion } from "framer-motion";
import { Lock, Loader2, Pause, Play, VolumeX, Volume2, ChevronUp, Radio } from "lucide-react";
import { TalerIcon } from "@/components/icons/TalerIcon";
import { cn } from "@/lib/utils";
import { hapticToggle } from "@/lib/haptics";
import { Equalizer } from "../Equalizer";

import { formatTimeToTier } from "../utils";
import { useRadioStore, ExternalStation } from "@/lib/radio-store";
import { useRadioFavorites } from "@/hooks/useRadioFavorites";

interface NowPlaying {
  title?: string;
  artist?: string;
  artworkUrl?: string;
}

interface MiniPlayerStateProps {
  nowPlaying: NowPlaying | null;
  isPlaying: boolean;
  isRadioLoading: boolean;
  isMuted: boolean;
  isLocked: boolean;
  lockRemaining: number;
  earnedTaler: number;
  pendingTaler: number;
  secondsToNextTier: number;
  isMaxTier: boolean;
  progress: number;
  justReachedTier: boolean;
  onExpand: () => void;
  onTogglePlay: (e?: React.MouseEvent) => void;
  onToggleMute: (e?: React.MouseEvent) => void;
  onMinimize: () => void;
}

export function MiniPlayerState({
  nowPlaying,
  isPlaying,
  isRadioLoading,
  isMuted,
  isLocked,
  lockRemaining,
  pendingTaler,
  secondsToNextTier,
  isMaxTier,
  progress,
  justReachedTier,
  onExpand,
  onTogglePlay,
  onToggleMute,
  onMinimize,
}: MiniPlayerStateProps) {
  const { isRadio2Go, switchStation, isPlaying: storeIsPlaying, customStation } = useRadioStore();
  const { favorites } = useRadioFavorites();
  
  // Get first favorite that's not Radio 2Go
  const firstFavorite = favorites.find(f => 
    f.station_uuid !== 'radio2go' && f.station_uuid !== 'radio-2go-default'
  );
  
  // Quick switch handler - bidirectional
  const handleQuickSwitch = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticToggle();
    
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
      switchStation(externalStation, isPlaying);
    } else {
      // Switch to Radio 2Go
      switchStation(null, isPlaying);
    }
  };
  
  // Determine what to show
  const showSwitchButton = !isRadio2Go || (isRadio2Go && firstFavorite);
  const switchTarget = isRadio2Go ? firstFavorite : null;
  
  return (
    <motion.div
      key="mini-player"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 20, opacity: 0 }}
      transition={{
        type: "spring",
        damping: 25,
        stiffness: 300,
        opacity: { duration: 0.15 },
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.3, bottom: 0.5 }}
      onDragEnd={(_, info) => {
        // Swipe up to expand player
        if (info.offset.y < -40 || info.velocity.y < -200) {
          hapticToggle();
          onExpand();
        }
        // Swipe down to minimize
        else if (info.offset.y > 60 || info.velocity.y > 300) {
          hapticToggle();
          onMinimize();
        }
      }}
      className={cn(
        "relative rounded-2xl bg-secondary shadow-xl shadow-secondary/30 cursor-grab active:cursor-grabbing overflow-hidden transition-colors duration-300 outline-none isolate touch-pan-x",
        justReachedTier && "ring-2 ring-accent"
      )}
      onClick={onExpand}
      tabIndex={-1}
    >
      {/* Swipe indicator */}
      <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-secondary-foreground/20" />

      {/* Progress bar at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-secondary-foreground/10">
        <motion.div
          className={cn(
            "h-full transition-colors",
            isMaxTier ? "bg-accent" : "bg-accent/80"
          )}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Lock progress bar */}
      {isLocked && (
        <div className="absolute top-1 left-0 right-0 h-0.5 bg-white/10">
          <motion.div
            initial={{ width: "100%" }}
            animate={{ width: `${(lockRemaining / 65) * 100}%` }}
            transition={{ duration: 1, ease: "linear" }}
            className="h-full bg-gradient-to-r from-accent to-amber-400"
          />
        </div>
      )}

      <div className="flex items-center gap-3 p-2.5 pt-4">
        {/* Quick Switch Button - bidirectional */}
        {showSwitchButton && (
          <button
            type="button"
            onClick={handleQuickSwitch}
            className="h-10 w-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center flex-shrink-0 hover:bg-accent/30 active:scale-95 transition-all touch-manipulation"
            title={isRadio2Go ? `Zu ${switchTarget?.station_name}` : "Zurück zu my2go"}
          >
            {isRadio2Go && switchTarget?.station_favicon ? (
              <img 
                src={switchTarget.station_favicon} 
                alt={switchTarget.station_name} 
                className="h-6 w-6 rounded-lg object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <img 
                src="/pwa-192x192.png" 
                alt="my2go" 
                className="h-6 w-6 rounded-lg"
              />
            )}
          </button>
        )}
        
        {/* Album Art or Equalizer */}
        <div
          className={cn(
            "h-12 w-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0 transition-all",
            justReachedTier && "animate-pulse"
          )}
        >
          {nowPlaying?.artworkUrl ? (
            <img
              src={nowPlaying.artworkUrl}
              alt={nowPlaying.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <Equalizer />
          )}
        </div>

        {/* Song Info + Session Progress */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-secondary-foreground truncate">
            {isLocked
              ? `Gesperrt – ${lockRemaining}s`
              : nowPlaying?.title || "my2go Radio"}
          </p>
          <p className="text-xs text-secondary-foreground/60 truncate">
            {isMaxTier ? (
              <span className="text-accent font-medium">Max erreicht 🏆</span>
            ) : secondsToNextTier > 0 ? (
              <span className="flex items-center gap-1">
                <TalerIcon className="h-3 w-3 text-accent" />
                <span className="text-accent font-medium">+{pendingTaler}</span>
                <span>in {formatTimeToTier(secondsToNextTier)}</span>
              </span>
            ) : (
              <span>{nowPlaying?.artist || "Live Stream"}</span>
            )}
          </p>
        </div>


        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
            isMuted ? "bg-red-500/20 text-red-400" : "bg-white/10 text-white/70"
          )}
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          disabled={isRadioLoading || isLocked}
          className={cn(
            "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
            "bg-accent text-accent-foreground",
            isLocked && "opacity-70"
          )}
        >
          {isRadioLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : isLocked ? (
            <Lock className="h-4 w-4" />
          ) : isPlaying ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4 ml-0.5" />
          )}
        </button>

        {/* Expand indicator */}
        <ChevronUp className="h-4 w-4 text-secondary-foreground/40 shrink-0" />
      </div>
    </motion.div>
  );
}
