import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, Radio, Loader2 } from 'lucide-react';
import { useRadioStore } from '@/lib/radio-store';
import { cn } from '@/lib/utils';
import { trackFunnelEvent } from '@/lib/funnel-config';
import { useEffect } from 'react';

interface FunnelRadioPlayerProps {
  className?: string;
  variant?: 'minimal' | 'expanded';
  onPlayStart?: () => void;
}

export function FunnelRadioPlayer({ 
  className, 
  variant = 'minimal',
  onPlayStart 
}: FunnelRadioPlayerProps) {
  const { isPlaying, isLoading, nowPlaying, togglePlay } = useRadioStore();

  const handlePlay = () => {
    trackFunnelEvent('radio_play_attempt');
    togglePlay();
    
    if (!isPlaying) {
      trackFunnelEvent('radio_playing');
      onPlayStart?.();
    }
  };

  // Track when radio starts playing
  useEffect(() => {
    if (isPlaying) {
      trackFunnelEvent('radio_playing');
    }
  }, [isPlaying]);

  if (variant === 'minimal') {
    return (
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className={cn(
              'fixed bottom-4 left-4 right-4 z-50',
              'bg-secondary text-white rounded-2xl p-3 shadow-xl',
              'max-w-lg mx-auto',
              className
            )}
          >
            <div className="flex items-center gap-3">
              {/* Play/Pause Button */}
              <button
                onClick={handlePlay}
                disabled={isLoading}
                className="flex items-center justify-center h-12 w-12 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 transition-colors flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>

              {/* Now Playing Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  <span className="text-xs font-medium text-white/70 uppercase tracking-wide">Live</span>
                </div>
                {nowPlaying ? (
                  <p className="text-sm font-medium truncate">
                    {nowPlaying.artist} – {nowPlaying.title}
                  </p>
                ) : (
                  <p className="text-sm text-white/70">Radio 2Go</p>
                )}
              </div>

              {/* Volume indicator */}
              <Volume2 className="h-4 w-4 text-white/50 flex-shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Expanded variant for hero sections
  return (
    <div className={cn('text-center', className)}>
      <button
        onClick={handlePlay}
        disabled={isLoading}
        className={cn(
          'relative inline-flex items-center justify-center',
          'h-20 w-20 rounded-full',
          'bg-accent text-accent-foreground',
          'shadow-xl shadow-accent/30',
          'hover:scale-105 transition-transform',
          'disabled:opacity-50'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-8 w-8" />
        ) : (
          <Play className="h-8 w-8 ml-1" />
        )}
        
        {/* Pulse animation when playing */}
        {isPlaying && (
          <>
            <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-20" />
            <span className="absolute inset-0 rounded-full bg-accent animate-pulse opacity-10" />
          </>
        )}
      </button>

      {/* Status text */}
      <div className="mt-4">
        {isPlaying ? (
          <div className="flex items-center justify-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
            </span>
            <span className="text-sm font-medium text-foreground">Radio läuft</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Tippe zum Starten</p>
        )}

        {isPlaying && nowPlaying && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-muted-foreground mt-1 truncate max-w-[200px] mx-auto"
          >
            {nowPlaying.artist} – {nowPlaying.title}
          </motion.p>
        )}
      </div>
    </div>
  );
}
