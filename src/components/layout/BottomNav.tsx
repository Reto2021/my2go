import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Gift, QrCode, Store, Music, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchRoute } from '@/lib/route-prefetch';
import { useCallback, useState, useEffect } from 'react';
import { DriveSearchSheet } from '@/components/drive/DriveSearchSheet';
import { useRadioStore } from '@/lib/radio-store';

const QR_VISITED_KEY = 'qr_page_visited';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/rewards', label: 'Gutscheine', icon: Gift },
  { path: '__center__', label: 'Nav & QR', icon: QrCode, highlight: true },
  { path: '/partner', label: 'Partner', icon: Store },
  { path: '__soundtrack__', label: 'Soundtrack', icon: Music, isSoundtrack: true },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setPlayerExpanded, isPlaying } = useRadioStore();
  const [hasVisitedQR, setHasVisitedQR] = useState(() => {
    return localStorage.getItem(QR_VISITED_KEY) === 'true';
  });
  const [driveOpen, setDriveOpen] = useState(false);
  
  useEffect(() => {
    if (location.pathname === '/my-qr' && !hasVisitedQR) {
      localStorage.setItem(QR_VISITED_KEY, 'true');
      setHasVisitedQR(true);
    }
  }, [location.pathname, hasVisitedQR]);
  
  const handleNavClick = (e: React.MouseEvent, path: string, isSoundtrack?: boolean) => {
    e.preventDefault();
    if (path === '__center__') {
      setDriveOpen(true);
      if (!hasVisitedQR) {
        localStorage.setItem(QR_VISITED_KEY, 'true');
        setHasVisitedQR(true);
      }
      return;
    }
    if (isSoundtrack) {
      setPlayerExpanded(true);
      return;
    }
    if (path === '/') {
      navigate('/', { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };
  
  const handlePrefetch = useCallback((path: string) => {
    if (!path.startsWith('__')) prefetchRoute(path);
  }, []);
  
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50" data-onboarding="bottom-nav">
        <div className="absolute inset-0 bg-background/95 backdrop-blur-xl border-t border-border/30" />
        
        <div className="relative container flex items-center justify-around py-3 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = item.highlight || item.isSoundtrack
              ? false
              : (location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path)));
            const isHighlight = item.highlight;
            const isSoundtrack = item.isSoundtrack;
            
            if (isHighlight) {
              return (
                <div key={item.path} className="flex flex-col items-center gap-1 min-w-[52px]">
                  <button
                    onClick={(e) => handleNavClick(e, item.path)}
                    className={cn(
                      'relative p-2.5 rounded-xl transition-all duration-200',
                      'bg-accent text-accent-foreground'
                    )}
                  >
                    {!hasVisitedQR && (
                      <span className="absolute -inset-1 rounded-xl bg-accent/20 animate-pulse" />
                    )}
                    <div className="relative flex items-center justify-center h-6 w-6">
                      <Icon className="h-6 w-6 opacity-40" strokeWidth={2} />
                      <Navigation
                        className="absolute h-4 w-4 drop-shadow-sm"
                        style={{ color: 'currentColor' }}
                        strokeWidth={3}
                      />
                    </div>
                  </button>
                  <span className="text-xs font-semibold leading-tight text-accent-foreground opacity-70">
                    {item.label}
                  </span>
                </div>
              );
            }
            
            if (isSoundtrack) {
              return (
                <button
                  key={item.path}
                  onClick={(e) => handleNavClick(e, item.path, true)}
                  className={cn(
                    'flex flex-col items-center gap-1 min-w-[52px] min-h-[52px] px-3 py-2 rounded-xl transition-all duration-200',
                    isPlaying
                      ? 'text-accent'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className={cn(
                    'relative p-2 rounded-lg transition-all duration-200',
                    isPlaying && 'bg-primary/20',
                  )}>
                    <Icon className={cn(
                      'relative h-5 w-5 transition-transform duration-200',
                      isPlaying && 'scale-110',
                    )} strokeWidth={isPlaying ? 2.5 : 2} />
                    {isPlaying && (
                      <span className="absolute top-0.5 right-0.5 h-2 w-2 bg-accent rounded-full animate-pulse" />
                    )}
                  </div>
                  <span className={cn(
                    'text-xs font-semibold leading-tight',
                    isPlaying ? 'opacity-100' : 'opacity-70'
                  )}>
                    Soundtrack
                  </span>
                </button>
              );
            }
            
            return (
              <button
                key={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                onMouseEnter={() => handlePrefetch(item.path)}
                onTouchStart={() => handlePrefetch(item.path)}
                className={cn(
                  'flex flex-col items-center gap-1 min-w-[52px] min-h-[52px] px-3 py-2 rounded-xl transition-all duration-200',
                  isActive
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'relative p-2 rounded-lg transition-all duration-200',
                  isActive && 'bg-primary/20',
                )}>
                  <Icon className={cn(
                    'relative h-5 w-5 transition-transform duration-200',
                    isActive && 'scale-110',
                  )} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span className={cn(
                  'text-xs font-semibold leading-tight',
                  isActive ? 'opacity-100' : 'opacity-70'
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      <DriveSearchSheet open={driveOpen} onOpenChange={setDriveOpen} />
    </>
  );
}