import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Gift, QrCode, Store, Bell, Navigation } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchRoute } from '@/lib/route-prefetch';
import { useCallback, useState, useEffect } from 'react';
import { DriveSearchSheet } from '@/components/drive/DriveSearchSheet';

const QR_VISITED_KEY = 'qr_page_visited';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/rewards', label: 'Gutscheine', icon: Gift },
  { path: '/my-qr', label: 'Mein QR', icon: QrCode, highlight: true },
  { path: '/partner', label: 'Partner', icon: Store },
  { path: '/code', label: 'Taler-Alarm', icon: Bell },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasVisitedQR, setHasVisitedQR] = useState(() => {
    return localStorage.getItem(QR_VISITED_KEY) === 'true';
  });
  const [driveOpen, setDriveOpen] = useState(false);
  
  // Track when user visits QR page
  useEffect(() => {
    if (location.pathname === '/my-qr' && !hasVisitedQR) {
      localStorage.setItem(QR_VISITED_KEY, 'true');
      setHasVisitedQR(true);
    }
  }, [location.pathname, hasVisitedQR]);
  
  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (path === '/') {
      navigate('/', { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };
  
  // Prefetch on hover/touch
  const handlePrefetch = useCallback((path: string) => {
    prefetchRoute(path);
  }, []);
  
  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50" data-onboarding="bottom-nav">
        {/* Background blur */}
        <div className="absolute inset-0 bg-background/95 backdrop-blur-xl border-t border-border/30" />
        
        <div className="relative container flex items-center justify-around py-3 pb-safe">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path || 
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const isHighlight = item.highlight;
            
            if (isHighlight) {
              return (
                <div key={item.path} className="flex flex-col items-center gap-1 min-w-[52px]">
                  <button
                    onClick={(e) => handleNavClick(e, item.path)}
                    onMouseEnter={() => handlePrefetch(item.path)}
                    onTouchStart={() => handlePrefetch(item.path)}
                    className={cn(
                      'relative p-2.5 rounded-xl transition-all duration-200',
                      isActive ? 'bg-primary/20 text-accent' : 'bg-accent text-accent-foreground'
                    )}
                  >
                    {!isActive && !hasVisitedQR && (
                      <span className="absolute -inset-1 rounded-xl bg-accent/20 animate-pulse" />
                    )}
                    <div className="relative flex items-center justify-center h-6 w-6">
                      <Icon className="h-6 w-6 opacity-40" strokeWidth={isActive ? 2.5 : 2} />
                      <Navigation
                        className="absolute h-3 w-3 cursor-pointer"
                        style={{ color: 'currentColor' }}
                        strokeWidth={3}
                        onClick={(e) => {
                          e.stopPropagation();
                          setDriveOpen(true);
                        }}
                      />
                    </div>
                  </button>
                  <span className={cn(
                    'text-xs font-semibold leading-tight',
                    isActive ? 'text-accent opacity-100' : 'text-accent-foreground opacity-70'
                  )}>
                    {item.label}
                  </span>
                </div>
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
