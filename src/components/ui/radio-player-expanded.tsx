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
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRadioStore, SongHistoryItem } from '@/lib/radio-store';
import { Slider } from '@/components/ui/slider';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

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
    togglePlay, 
    toggleMute, 
    setVolume 
  } = useRadioStore();
  
  const [isFullscreen, setIsFullscreen] = useState(false);

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
          </div>

          {/* Song History */}
          {songHistory.length > 0 && !isFullscreen && (
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
