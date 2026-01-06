import { useEffect, useState, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Volume1 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';
import { Slider } from '@/components/ui/slider';
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

function TalerCoin({ className, spinning }: { className?: string; spinning?: boolean }) {
  return (
    <svg 
      viewBox="0 0 40 40" 
      className={cn("w-full h-full", spinning && "animate-spin-slow", className)}
    >
      {/* Outer ring with metallic gradient */}
      <defs>
        <linearGradient id="coinGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFD54F" />
          <stop offset="25%" stopColor="#FCB900" />
          <stop offset="50%" stopColor="#FFE082" />
          <stop offset="75%" stopColor="#FCB900" />
          <stop offset="100%" stopColor="#F9A825" />
        </linearGradient>
        <linearGradient id="coinEdge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F9A825" />
          <stop offset="50%" stopColor="#FFD54F" />
          <stop offset="100%" stopColor="#E65100" />
        </linearGradient>
        <radialGradient id="coinShine" cx="30%" cy="30%" r="50%">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Coin base with edge */}
      <circle cx="20" cy="20" r="19" fill="url(#coinEdge)" />
      <circle cx="20" cy="20" r="17" fill="url(#coinGold)" />
      
      {/* Inner decorative ring */}
      <circle cx="20" cy="20" r="14" fill="none" stroke="#E65100" strokeWidth="0.5" opacity="0.4" />
      <circle cx="20" cy="20" r="12" fill="none" stroke="#E65100" strokeWidth="0.3" opacity="0.3" />
      
      {/* 2Go Text */}
      <text 
        x="20" 
        y="23" 
        textAnchor="middle" 
        fontSize="10" 
        fontWeight="bold" 
        fill="#8D6E00"
        fontFamily="system-ui, sans-serif"
      >
        2Go
      </text>
      
      {/* Shine overlay */}
      <circle cx="20" cy="20" r="17" fill="url(#coinShine)" />
      
      {/* Edge notches for realism */}
      {[...Array(16)].map((_, i) => (
        <line 
          key={i}
          x1={20 + 18 * Math.cos((i * 22.5 * Math.PI) / 180)}
          y1={20 + 18 * Math.sin((i * 22.5 * Math.PI) / 180)}
          x2={20 + 19 * Math.cos((i * 22.5 * Math.PI) / 180)}
          y2={20 + 19 * Math.sin((i * 22.5 * Math.PI) / 180)}
          stroke="#B8860B"
          strokeWidth="1"
          opacity="0.5"
        />
      ))}
    </svg>
  );
}

function Marquee({ children, className }: { children: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setShouldScroll(textRef.current.scrollWidth > containerRef.current.clientWidth);
      }
    };
    
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [children]);

  if (!shouldScroll) {
    return (
      <div ref={containerRef} className={cn("overflow-hidden", className)}>
        <span ref={textRef} className="whitespace-nowrap">{children}</span>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn("overflow-hidden group", className)}>
      <div className="animate-marquee group-hover:[animation-play-state:paused] inline-flex">
        <span ref={textRef} className="whitespace-nowrap pr-8">{children}</span>
        <span className="whitespace-nowrap pr-8">{children}</span>
      </div>
    </div>
  );
}

function VolumeIcon({ volume, isMuted }: { volume: number; isMuted: boolean }) {
  if (isMuted || volume === 0) {
    return <VolumeX className="h-4 w-4 text-secondary-foreground/70" />;
  }
  if (volume < 0.5) {
    return <Volume1 className="h-4 w-4 text-secondary-foreground/70" />;
  }
  return <Volume2 className="h-4 w-4 text-secondary-foreground/70" />;
}

export function RadioHeader() {
  const { 
    isPlaying, 
    isMuted, 
    isLoading, 
    volume,
    nowPlaying, 
    togglePlay, 
    toggleMute,
    setVolume,
    fetchNowPlaying 
  } = useRadioStore();
  
  const [showVolume, setShowVolume] = useState(false);

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
  
  // Auto-hide volume slider
  useEffect(() => {
    if (showVolume) {
      const timer = setTimeout(() => setShowVolume(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showVolume, volume]);

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Background - matching skyline color #023F5A */}
      <div className="absolute inset-0 bg-[#023F5A]" />
      
      <div className="relative container flex items-center gap-3 py-2">
        {/* Logo - larger */}
        <img 
          src={logo} 
          alt="Radio 2Go" 
          className="h-10 flex-shrink-0"
        />
        
        {/* Player area */}
        <div className="flex-1 flex items-center gap-2 min-w-0">
          {/* Play button - Taler coin */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className={cn(
              "h-11 w-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all relative",
              isLoading && "opacity-60"
            )}
            aria-label={isPlaying ? 'Pause' : 'Abspielen'}
          >
            {/* Taler coin SVG */}
            <TalerCoin spinning={isPlaying} />
            
            {/* Icon overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-amber-900/50 border-t-amber-900 rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-4 w-4 text-amber-900/80" strokeWidth={2.5} />
              ) : (
                <Play className="h-4 w-4 ml-0.5 text-amber-900/80" strokeWidth={2.5} />
              )}
            </div>
          </button>
          
          {/* Now playing info */}
          <div className="flex-1 min-w-0">
            {isPlaying ? (
              <div className="flex items-center gap-2">
                {/* Equalizer */}
                <Equalizer className="flex-shrink-0" />
                {/* Song info with marquee */}
                <Marquee className="flex-1 min-w-0 text-xs text-secondary-foreground font-medium">
                  <span className="text-secondary-foreground/60">Du hörst: </span>
                  {nowPlaying ? `${nowPlaying.artist} – ${nowPlaying.title}` : "Lädt..."}
                </Marquee>
              </div>
            ) : (
              <p className="text-xs text-secondary-foreground/70 font-medium">
                Radio 2Go streamen
              </p>
            )}
          </div>
          
          {/* Volume control - only when playing */}
          {isPlaying && (
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Volume slider - expandable */}
              <div className={cn(
                "overflow-hidden transition-all duration-300 ease-out",
                showVolume ? "w-20 opacity-100" : "w-0 opacity-0"
              )}>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.05}
                  onValueChange={handleVolumeChange}
                  className="w-20"
                />
              </div>
              
              {/* Volume button */}
              <button
                onClick={() => {
                  if (showVolume) {
                    toggleMute();
                  } else {
                    setShowVolume(true);
                  }
                }}
                className="h-8 w-8 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors"
                aria-label={isMuted ? 'Ton an' : 'Lautstärke'}
              >
                <VolumeIcon volume={volume} isMuted={isMuted} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
