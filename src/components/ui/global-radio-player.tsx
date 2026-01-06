import { useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, Music2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';

export function GlobalRadioPlayer() {
  const { 
    isPlaying, 
    isMuted, 
    isLoading, 
    nowPlaying, 
    togglePlay, 
    toggleMute, 
    fetchNowPlaying 
  } = useRadioStore();

  // Fetch now playing on mount and periodically
  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  // Refetch when playing starts
  useEffect(() => {
    if (isPlaying) {
      fetchNowPlaying();
    }
  }, [isPlaying, fetchNowPlaying]);

  // Collapsed state when not playing - just show floating play button
  if (!isPlaying && !isLoading) {
    return (
      <button
        onClick={togglePlay}
        className={cn(
          "fixed bottom-24 right-4 z-40",
          "h-14 w-14 rounded-full",
          "bg-secondary text-secondary-foreground shadow-xl",
          "flex items-center justify-center",
          "hover:scale-105 active:scale-95 transition-transform",
          "animate-pulse"
        )}
        aria-label="Radio starten"
      >
        <Play className="h-6 w-6 ml-0.5" />
      </button>
    );
  }

  // Expanded player when playing or loading
  return (
    <div className={cn(
      "fixed bottom-20 left-2 right-2 z-40",
      "rounded-2xl overflow-hidden",
      "bg-secondary text-secondary-foreground",
      "shadow-2xl shadow-secondary/30",
      "animate-in slide-in-from-bottom-4 duration-300"
    )}>
      {/* Progress/Live indicator bar */}
      <div className="h-1 bg-secondary-foreground/10 overflow-hidden">
        <div className={cn(
          "h-full bg-accent",
          isPlaying && "animate-[pulse_2s_ease-in-out_infinite]"
        )} style={{ width: isPlaying ? '100%' : '0%' }} />
      </div>

      <div className="p-3 flex items-center gap-3">
        {/* Artwork */}
        <div className="relative flex-shrink-0">
          <div className={cn(
            "h-12 w-12 rounded-xl overflow-hidden bg-secondary-foreground/10 flex items-center justify-center",
            isPlaying && "ring-2 ring-accent/50"
          )}>
            {nowPlaying?.artworkUrl ? (
              <img 
                src={nowPlaying.artworkUrl} 
                alt={nowPlaying.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <Music2 className="h-5 w-5 text-secondary-foreground/60" />
            )}
          </div>
          {isPlaying && (
            <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-accent rounded-full flex items-center justify-center">
              <Radio className="h-2 w-2 text-accent-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
              Radio 2Go Live
            </span>
          </div>
          {nowPlaying ? (
            <>
              <p className="font-bold text-sm truncate leading-tight">{nowPlaying.title}</p>
              <p className="text-xs text-secondary-foreground/60 truncate">{nowPlaying.artist}</p>
            </>
          ) : (
            <>
              <p className="font-bold text-sm leading-tight">Hör 2Go.</p>
              <p className="text-xs text-secondary-foreground/60">Streamt...</p>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="h-10 w-10 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors"
            aria-label={isMuted ? 'Ton an' : 'Ton aus'}
          >
            {isMuted ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </button>
          
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center transition-all",
              "bg-accent text-accent-foreground hover:bg-accent/90",
              isLoading && "opacity-60"
            )}
            aria-label={isPlaying ? 'Pause' : 'Abspielen'}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
            ) : (
              <Pause className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
