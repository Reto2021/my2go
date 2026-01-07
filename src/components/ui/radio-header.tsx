import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX, Volume1, Settings, LogOut, Wallet, Coins } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';
import { useSession, useBrowseMode } from '@/lib/session';
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
  
  const { session, balance, logout, isLoggingOut } = useSession();
  const isBrowseMode = useBrowseMode();
  
  const [showVolume, setShowVolume] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [prevBalance, setPrevBalance] = useState<number | null>(null);
  const [balanceChanged, setBalanceChanged] = useState(false);
  
  // Track balance changes for animation
  useEffect(() => {
    if (balance && prevBalance !== null && balance.current !== prevBalance) {
      setBalanceChanged(true);
      const timer = setTimeout(() => setBalanceChanged(false), 600);
      return () => clearTimeout(timer);
    }
    if (balance) {
      setPrevBalance(balance.current);
    }
  }, [balance, prevBalance]);

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
  
  const handleLogout = async () => {
    await logout();
    setShowMenu(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Animated meandering gradient background */}
      <div className="absolute inset-0 backdrop-blur-xl overflow-hidden">
        <div className="absolute inset-0 bg-secondary" />
        <div className="absolute -inset-1/2 w-[200%] h-[200%] bg-gradient-to-br from-primary/40 via-transparent to-accent/20 animate-gradient-shift" />
      </div>
      
      <div className="relative container flex items-center gap-3 py-2">
        {/* Logo - larger, links to home */}
        <Link to="/">
          <img 
            src={logo} 
            alt="Radio 2Go" 
            className="h-14 flex-shrink-0 hover:opacity-80 transition-opacity"
          />
        </Link>
        
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
        
        {/* Taler Balance + User Menu - only when logged in */}
        {!isBrowseMode && session?.displayName && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Taler Balance */}
            {balance && (
              <motion.div 
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/20"
                animate={balanceChanged ? {
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    '0 0 0 0 hsla(44, 98%, 49%, 0)',
                    '0 0 0 8px hsla(44, 98%, 49%, 0.3)',
                    '0 0 0 0 hsla(44, 98%, 49%, 0)'
                  ]
                } : {}}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Coins className={cn(
                  "h-3.5 w-3.5 text-accent transition-transform",
                  balanceChanged && "animate-spin"
                )} />
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={balance.current}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-bold text-accent tabular-nums"
                  >
                    {balance.current.toLocaleString('de-CH')}
                  </motion.span>
                </AnimatePresence>
              </motion.div>
            )}
            
            {/* User Avatar */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-secondary-foreground/10 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-sm font-bold text-secondary-foreground">
                    {session.displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-12 w-48 rounded-2xl bg-white/95 dark:bg-secondary/95 backdrop-blur-xl border border-white/20 shadow-xl p-2 z-[200] animate-in">
                {session.passLink && (
                  <a 
                    href={session.passLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                    onClick={() => setShowMenu(false)}
                  >
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    Wallet öffnen
                  </a>
                )}
                <Link 
                  to="/settings"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-muted transition-colors"
                  onClick={() => setShowMenu(false)}
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  Einstellungen
                </Link>
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  {isLoggingOut ? 'Wird getrennt...' : 'Karte trennen'}
                </button>
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
