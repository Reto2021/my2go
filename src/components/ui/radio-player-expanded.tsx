import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  Music2, 
  Maximize2, 
  Minimize2, 
  ChevronDown,
  Clock,
  Gift,
  Coins
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRadioStore, SongHistoryItem } from '@/lib/radio-store';
import { Slider } from '@/components/ui/slider';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { TalerIcon } from '@/components/icons/TalerIcon';

interface ListeningTier {
  id: string;
  name: string;
  description: string | null;
  min_duration_seconds: number;
  taler_reward: number;
  sort_order: number;
}

interface ExpandedRadioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpandedRadioPlayer({ isOpen, onClose }: ExpandedRadioPlayerProps) {
  const { 
    isPlaying, 
    isMuted, 
    isLoading, 
    volume, 
    nowPlaying, 
    songHistory,
    currentSessionDuration,
    updateSessionDuration,
    togglePlay, 
    toggleMute, 
    setVolume 
  } = useRadioStore();
  
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tiers, setTiers] = useState<ListeningTier[]>([]);
  const [showTiers, setShowTiers] = useState(false);

  // Update session duration every second
  useEffect(() => {
    if (isOpen && isPlaying) {
      const interval = setInterval(() => {
        updateSessionDuration();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isPlaying, updateSessionDuration]);

  // Fetch listening tiers
  useEffect(() => {
    if (isOpen && tiers.length === 0) {
      supabase
        .from('radio_listening_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .then(({ data }) => {
          if (data) setTiers(data);
        });
    }
  }, [isOpen, tiers.length]);

  // Calculate current and next tier
  const getCurrentAndNextTier = () => {
    if (tiers.length === 0) return { current: null, next: null, progress: 0 };
    
    let currentTier: ListeningTier | null = null;
    let nextTier: ListeningTier | null = null;
    
    for (let i = 0; i < tiers.length; i++) {
      if (currentSessionDuration >= tiers[i].min_duration_seconds) {
        currentTier = tiers[i];
        nextTier = tiers[i + 1] || null;
      } else {
        if (!currentTier) {
          nextTier = tiers[i];
        }
        break;
      }
    }
    
    // Calculate progress to next tier
    let progress = 0;
    if (nextTier) {
      const startSeconds = currentTier?.min_duration_seconds || 0;
      const endSeconds = nextTier.min_duration_seconds;
      const range = endSeconds - startSeconds;
      const elapsed = currentSessionDuration - startSeconds;
      progress = Math.min(100, Math.max(0, (elapsed / range) * 100));
    } else if (currentTier) {
      progress = 100; // All tiers completed
    }
    
    return { current: currentTier, next: nextTier, progress };
  };

  const { current: currentTier, next: nextTier, progress } = getCurrentAndNextTier();

  // Handle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(console.error);
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(console.error);
    }
  }, []);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isFullscreen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isFullscreen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "fixed inset-0 z-[200] flex flex-col",
            isFullscreen ? "bg-black" : "bg-gradient-to-b from-secondary via-secondary to-black"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 pt-safe">
            <button
              onClick={onClose}
              className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ChevronDown className="h-5 w-5 text-white" />
            </button>
            
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-accent" />
              <span className="text-sm font-semibold text-white">Radio 2Go Live</span>
            </div>
            
            <button
              onClick={toggleFullscreen}
              className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5 text-white" />
              ) : (
                <Maximize2 className="h-5 w-5 text-white" />
              )}
            </button>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col items-center justify-center px-8 py-4">
            {/* Large Cover Art */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={cn(
                "relative rounded-3xl overflow-hidden shadow-2xl mb-8",
                isFullscreen ? "w-[400px] h-[400px]" : "w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]"
              )}
            >
              {nowPlaying?.artworkUrl ? (
                <img
                  src={nowPlaying.artworkUrl}
                  alt={nowPlaying.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-accent/30 to-primary/30 flex items-center justify-center">
                  <Music2 className="h-24 w-24 text-white/30" />
                </div>
              )}
              
              {/* Playing indicator */}
              {isPlaying && (
                <div className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
                  <div className="flex items-end gap-0.5 h-4">
                    <motion.div
                      animate={{ height: ['40%', '100%', '60%', '80%', '40%'] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="w-1 bg-accent rounded-full"
                    />
                    <motion.div
                      animate={{ height: ['60%', '40%', '100%', '50%', '60%'] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
                      className="w-1 bg-accent rounded-full"
                    />
                    <motion.div
                      animate={{ height: ['80%', '60%', '40%', '100%', '80%'] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                      className="w-1 bg-accent rounded-full"
                    />
                  </div>
                  <span className="text-xs font-semibold text-white ml-1">LIVE</span>
                </div>
              )}
            </motion.div>

            {/* Song Info */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-8 max-w-md"
            >
              <h2 className={cn(
                "font-bold text-white mb-2 truncate",
                isFullscreen ? "text-3xl" : "text-2xl"
              )}>
                {nowPlaying?.title || 'Radio 2Go'}
              </h2>
              <p className={cn(
                "text-white/60 truncate",
                isFullscreen ? "text-xl" : "text-lg"
              )}>
                {nowPlaying?.artist || 'Live Stream'}
              </p>
            </motion.div>

            {/* Progress Bar to Next Tier */}
            {tiers.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="w-full max-w-sm mb-6"
              >
                <div className="bg-white/10 rounded-2xl p-4">
                  {/* Timer Display */}
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <Clock className="h-4 w-4 text-accent" />
                    <span className="text-lg font-bold text-white tabular-nums">
                      {formatSessionDuration(currentSessionDuration)}
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-3 bg-white/10 rounded-full overflow-hidden mb-3">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-primary rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  
                  {/* Tier Info */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      {currentTier ? (
                        <>
                          <TalerIcon size={12} />
                          <span className="text-accent font-semibold">+{currentTier.taler_reward}</span>
                          <span className="text-white/50">{currentTier.name}</span>
                        </>
                      ) : (
                        <span className="text-white/50">Starte zu hören...</span>
                      )}
                    </div>
                    {nextTier && (
                      <div className="flex items-center gap-1 text-white/70">
                        <span>Nächstes:</span>
                        <TalerIcon size={12} />
                        <span className="text-accent font-semibold">+{nextTier.taler_reward}</span>
                        <span className="text-white/50">({formatDuration(nextTier.min_duration_seconds)})</span>
                      </div>
                    )}
                    {!nextTier && currentTier && (
                      <span className="text-green-400 font-semibold">Maximum erreicht! 🎉</span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Volume Slider */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-xs mb-8"
            >
              <div className="flex items-center gap-4">
                <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={(value) => setVolume(value[0] / 100)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </div>
            </motion.div>

            {/* Play/Pause Button */}
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
              onClick={togglePlay}
              disabled={isLoading}
              className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center transition-all",
                isPlaying 
                  ? "bg-white text-secondary hover:bg-white/90" 
                  : "bg-accent text-accent-foreground hover:bg-accent/90",
                isLoading && "opacity-50"
              )}
            >
              {isLoading ? (
                <div className="h-8 w-8 border-3 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-8 w-8" />
              ) : (
                <Play className="h-8 w-8 ml-1" />
              )}
            </motion.button>
            {/* Reward Tiers Toggle */}
            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
              onClick={() => setShowTiers(!showTiers)}
              className="mt-6 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Gift className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-white">
                {showTiers ? 'Tiers ausblenden' : 'Hör-Belohnungen anzeigen'}
              </span>
            </motion.button>
          </div>

          {/* Reward Tiers Section */}
          <AnimatePresence>
            {showTiers && !isFullscreen && tiers.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden px-4"
              >
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Coins className="h-4 w-4 text-accent" />
                    <span className="text-sm font-semibold text-white/80">Taler verdienen beim Hören</span>
                  </div>
                  <div className="grid gap-2">
                    {tiers.map((tier, index) => (
                      <RewardTierRow key={tier.id} tier={tier} index={index} />
                    ))}
                  </div>
                  <p className="text-xs text-white/40 mt-3 text-center">
                    Du erhältst die Taler der höchsten erreichten Stufe beim Stoppen.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Song History */}
          {songHistory.length > 0 && !isFullscreen && !showTiers && (
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="px-4 pb-8 pb-safe"
            >
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-white/40" />
                <span className="text-sm font-semibold text-white/60">Zuletzt gespielt</span>
              </div>
              <div className="space-y-2">
                {songHistory.slice(0, 5).map((song, index) => (
                  <SongHistoryRow key={`${song.title}-${song.playedAt}`} song={song} index={index} />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SongHistoryRow({ song, index }: { song: SongHistoryItem; index: number }) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5 + index * 0.05 }}
      className="flex items-center gap-3 p-2 rounded-xl bg-white/5"
    >
      <div className="h-10 w-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
        {song.artworkUrl ? (
          <img src={song.artworkUrl} alt={song.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music2 className="h-4 w-4 text-white/30" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{song.title}</p>
        <p className="text-xs text-white/50 truncate">{song.artist}</p>
      </div>
      <span className="text-xs text-white/40 flex-shrink-0">
        {formatDistanceToNow(new Date(song.playedAt), { addSuffix: true, locale: de })}
      </span>
    </motion.div>
  );
}

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} Std.`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes} Min.`;
}

function formatSessionDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function RewardTierRow({ tier, index }: { tier: ListeningTier; index: number }) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
    >
      <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
        <TalerIcon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{tier.name}</p>
        <p className="text-xs text-white/50">ab {formatDuration(tier.min_duration_seconds)}</p>
      </div>
      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20">
        <span className="text-sm font-bold text-accent">+{tier.taler_reward}</span>
        <TalerIcon size={14} />
      </div>
    </motion.div>
  );
}
