import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NowPlayingData {
  title: string;
  artist: string;
  artworkUrl: string | null;
}

const STREAM_URL = 'http://uksoutha.streaming.broadcast.radio/radio2go';
const API_URL = 'https://api.broadcast.radio/api/nowplaying/2400';
const ARTWORK_BASE = 'https://api.broadcast.radio';

export function RadioPlayer({ className }: { className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<NowPlayingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch now playing data
  const fetchNowPlaying = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.success && data.body?.now_playing) {
        const np = data.body.now_playing;
        setNowPlaying({
          title: np.title || 'Unknown',
          artist: np.artist || 'Unknown Artist',
          artworkUrl: np.artworkUrl ? `${ARTWORK_BASE}${np.artworkUrl}` : null,
        });
      }
    } catch (error) {
      console.error('Failed to fetch now playing:', error);
    }
  };

  // Fetch on mount and periodically
  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000); // Update every 30s
    return () => clearInterval(interval);
  }, []);

  // Refetch when playing starts
  useEffect(() => {
    if (isPlaying) {
      fetchNowPlaying();
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(STREAM_URL);
      audioRef.current.volume = 1;
    }

    if (isPlaying) {
      audioRef.current.pause();
      audioRef.current.src = ''; // Stop streaming
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audioRef.current.src = STREAM_URL;
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch((err) => {
          console.error('Playback failed:', err);
          setIsLoading(false);
        });
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className={cn(
      "relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary via-secondary to-secondary/90 text-secondary-foreground p-4",
      className
    )}>
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative flex items-center gap-4">
        {/* Artwork / Radio Icon */}
        <div className="relative flex-shrink-0">
          <div className={cn(
            "h-14 w-14 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center",
            isPlaying && "ring-2 ring-accent ring-offset-2 ring-offset-secondary"
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
              <Music2 className="h-6 w-6 text-secondary-foreground/70" />
            )}
          </div>
          {isPlaying && (
            <div className="absolute -top-1 -right-1 h-4 w-4 bg-accent rounded-full flex items-center justify-center">
              <Radio className="h-2.5 w-2.5 text-accent-foreground animate-pulse" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <Radio className="h-3.5 w-3.5 text-accent flex-shrink-0" />
            <span className="text-xs font-semibold text-accent uppercase tracking-wide">Radio 2Go Live</span>
          </div>
          {nowPlaying ? (
            <>
              <p className="font-bold text-sm truncate">{nowPlaying.title}</p>
              <p className="text-xs text-secondary-foreground/70 truncate">{nowPlaying.artist}</p>
            </>
          ) : (
            <>
              <p className="font-bold text-sm">Hör 2Go.</p>
              <p className="text-xs text-secondary-foreground/70">Bei lokalen Partnern</p>
            </>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {isPlaying && (
            <button
              onClick={toggleMute}
              className="h-9 w-9 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
          )}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className={cn(
              "h-12 w-12 rounded-full flex items-center justify-center transition-all",
              isPlaying 
                ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                : "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90",
              isLoading && "opacity-50"
            )}
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
