import { useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';
import logo from '@/assets/logo-radio2go.png';

function Equalizer({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end gap-[2px] h-4", className)}>
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-1" />
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-2" />
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-3" />
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-4" />
    </div>
  );
}

export function RadioHeader() {
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

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Background blur */}
      <div className="absolute inset-0 bg-secondary/95 backdrop-blur-xl" />
      
      <div className="relative container flex items-center gap-3 py-2">
        {/* Logo */}
        <img 
          src={logo} 
          alt="Radio 2Go" 
          className="h-8 flex-shrink-0"
        />
        
        {/* Divider */}
        <div className="h-6 w-px bg-secondary-foreground/20 flex-shrink-0" />
        
        {/* Player area */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {/* Play button */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className={cn(
              "h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
              isPlaying 
                ? "bg-accent text-accent-foreground" 
                : "bg-secondary-foreground/20 text-secondary-foreground hover:bg-secondary-foreground/30",
              isLoading && "opacity-60"
            )}
            aria-label={isPlaying ? 'Pause' : 'Abspielen'}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </button>
          
          {/* Now playing info */}
          <div className="flex-1 min-w-0">
            {isPlaying ? (
              <div className="flex items-center gap-2">
                {/* Equalizer */}
                <Equalizer className="flex-shrink-0" />
                {/* Song info */}
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-xs text-secondary-foreground font-medium truncate">
                    {nowPlaying ? `${nowPlaying.artist} – ${nowPlaying.title}` : 'Lädt...'}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-secondary-foreground/70 font-medium">
                Radio 2Go streamen
              </p>
            )}
          </div>
          
          {/* Mute button - only when playing */}
          {isPlaying && (
            <button
              onClick={toggleMute}
              className="h-8 w-8 rounded-full bg-secondary-foreground/10 flex items-center justify-center flex-shrink-0 hover:bg-secondary-foreground/20 transition-colors"
              aria-label={isMuted ? 'Ton an' : 'Ton aus'}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 text-secondary-foreground/70" />
              ) : (
                <Volume2 className="h-4 w-4 text-secondary-foreground/70" />
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
