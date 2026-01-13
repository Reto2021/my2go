import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Volume1, Settings, LogOut, Coins, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';
import { useAuthSafe } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';
import logo from '@/assets/logo-radio2go.png';

import { ClockWeatherWidget } from './weather-widget';
import { LiveListenerCount } from '@/components/social-proof/LiveListenerCount';

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
  const textRef = useRef<HTMLDivElement>(null);
  const [shouldScroll, setShouldScroll] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const isOverflowing = textRef.current.scrollWidth > containerRef.current.clientWidth;
        setShouldScroll(isOverflowing);
      }
    };
    
    // Check after a small delay to ensure proper rendering
    const timer = setTimeout(checkOverflow, 100);
    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timer);
    };
  }, [children]);

  return (
    <div ref={containerRef} className={cn("overflow-hidden group", className)}>
      {shouldScroll ? (
        <div className="animate-marquee-slow inline-flex group-hover:[animation-play-state:paused]">
          <div ref={textRef} className="whitespace-nowrap pr-12">{children}</div>
          <div className="whitespace-nowrap pr-12">{children}</div>
        </div>
      ) : (
        <div ref={textRef} className="whitespace-nowrap truncate">{children}</div>
      )}
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
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Get real auth data from Supabase AuthContext
  const authContext = useAuthSafe();
  const isAuthenticated = !!authContext?.user;
  const profile = authContext?.profile ?? null;
  const realBalance = authContext?.balance ?? null;
  const isPartnerAdmin = authContext?.isPartnerAdmin ?? false;
  const partnerInfo = authContext?.partnerInfo ?? null;
  
  // Display name: prefer first_name, fallback to email prefix
  const displayName = profile?.first_name || profile?.display_name || authContext?.user?.email?.split('@')[0] || 'User';
  
  const [showVolume, setShowVolume] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [prevBalance, setPrevBalance] = useState<number | null>(null);
  const [balanceChanged, setBalanceChanged] = useState(false);
  
  const { setPlayerExpanded } = useRadioStore();
  
  // Track balance changes for animation
  useEffect(() => {
    if (realBalance && prevBalance !== null && realBalance.taler_balance !== prevBalance) {
      setBalanceChanged(true);
      const timer = setTimeout(() => setBalanceChanged(false), 600);
      return () => clearTimeout(timer);
    }
    if (realBalance) {
      setPrevBalance(realBalance.taler_balance);
    }
  }, [realBalance, prevBalance]);

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
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      setShowMenu(false);
      navigate('/');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-secondary overflow-hidden">
        <div 
          className="absolute inset-0 opacity-50 animate-gradient-shift"
          style={{
            background: 'conic-gradient(from 0deg, hsl(200 50% 66%), hsl(44 98% 49%), hsl(160 84% 39%), hsl(200 50% 66%), hsl(197 96% 18%))',
            width: '300%',
            height: '300%',
            top: '-100%',
            left: '-100%',
            filter: 'blur(60px)',
          }}
        />
      </div>
      
      <div className="relative container flex items-center gap-2 sm:gap-3 py-1.5 sm:py-2">
        {/* Logo - responsive size */}
        <Link to="/" className="flex-shrink-0">
          <img 
            src={logo} 
            alt="Radio 2Go" 
            className="h-10 sm:h-14 hover:opacity-80 transition-opacity"
          />
        </Link>
        
        {/* Clock & Weather Widget - hidden on very small screens */}
        <ClockWeatherWidget className="flex-shrink-0 hidden xs:flex" />
        
        {/* Player area - Status only, no play button here */}
        <div 
          className="flex-1 flex items-center gap-1.5 sm:gap-2 min-w-0 cursor-pointer" 
          data-onboarding="radio-player"
          onClick={() => setPlayerExpanded(true)}
        >
          {isPlaying ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Equalizer indicator */}
              <Equalizer className="flex-shrink-0" />
              {/* Song info with marquee */}
              <Marquee className="flex-1 min-w-0 text-[10px] sm:text-xs text-secondary-foreground font-medium">
                {nowPlaying ? `${nowPlaying.artist} – ${nowPlaying.title}` : "Lädt..."}
              </Marquee>
              {/* Live Listener Count */}
              <LiveListenerCount size="sm" showLabel={false} className="hidden sm:flex" />
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-secondary-foreground/90 font-medium truncate flex-1">
              Radio starten & Taler sammeln →
            </p>
          )}
        </div>
          {/* Volume controls - only when playing */}
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
        {/* Taler Balance + User Menu - only when logged in */}
        {isAuthenticated && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Taler Balance */}
            {realBalance && (
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
                    key={realBalance.taler_balance}
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 10, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs font-bold text-accent tabular-nums"
                  >
                    {realBalance.taler_balance.toLocaleString('de-CH')}
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
                    {displayName.charAt(0).toUpperCase()}
                  </span>
                </div>
              </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl bg-white/95 dark:bg-secondary/95 backdrop-blur-xl border border-white/20 shadow-xl p-2 z-[200] animate-in">
                {/* Partner Switch - only show if user is partner admin */}
                {isPartnerAdmin && partnerInfo && (
                  <>
                    <button 
                      onClick={() => {
                        navigate('/partner-dashboard');
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/10 transition-colors text-primary"
                    >
                      <Building2 className="h-4 w-4" />
                      <div className="flex flex-col items-start">
                        <span>Partner-Bereich</span>
                        <span className="text-xs text-muted-foreground font-normal">{partnerInfo.partnerName}</span>
                      </div>
                    </button>
                    <div className="h-px bg-border my-1" />
                  </>
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
                  {isLoggingOut ? 'Wird getrennt...' : 'Abmelden'}
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
