import { useEffect, useState, useRef } from 'react';
// Chromecast removed - clean build
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, LogOut, Coins, Building2, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';
import { useAuthSafe } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

import logo from '@/assets/logo-2go-header.png';

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


export function RadioHeader() {
  const { 
    isPlaying, 
    isLoading, 
    nowPlaying, 
    fetchNowPlaying,
    togglePlay 
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
      
      <div className="relative container flex items-center gap-1.5 sm:gap-3 py-2 sm:py-2.5">
        {/* Logo - smaller on mobile when player is active */}
        <Link to="/" className="flex-shrink-0 min-h-[44px] flex items-center">
          <img 
            src={logo} 
            alt="2Go" 
            className={cn(
              "hover:opacity-80 transition-opacity",
              isPlaying ? "h-8 sm:h-14" : "h-10 sm:h-14"
            )}
          />
        </Link>
        
        {/* Clock & Weather Widget - always visible */}
        <ClockWeatherWidget compact className="flex-shrink-0 sm:hidden" />
        <ClockWeatherWidget className="flex-shrink-0 hidden sm:flex" />
        
        {/* Spacer */}
        <div className="flex-1" />
        {/* Taler Balance + User Menu - only when logged in */}
        {isAuthenticated && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Taler Balance - compact on mobile, larger touch target */}
            {realBalance && (
              <motion.div 
                className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-accent/15"
                animate={balanceChanged ? {
                  scale: [1, 1.15, 1],
                  boxShadow: [
                    '0 0 0 0 hsla(44, 98%, 49%, 0)',
                    '0 0 0 4px hsla(44, 98%, 49%, 0.3)',
                    '0 0 0 0 hsla(44, 98%, 49%, 0)'
                  ]
                } : {}}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <Coins className={cn(
                  "h-3 w-3 sm:h-3.5 sm:w-3.5 text-accent transition-transform",
                  balanceChanged && "animate-spin"
                )} />
                <span className="text-[11px] sm:text-xs font-bold text-accent tabular-nums">
                  {realBalance.taler_balance.toLocaleString('de-CH')}
                </span>
              </motion.div>
            )}
            
            {/* User Avatar - larger touch target */}
            <div className="relative">
              <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full hover:bg-secondary-foreground/10 transition-colors"
              >
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-sm sm:text-base font-bold text-secondary-foreground">
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
