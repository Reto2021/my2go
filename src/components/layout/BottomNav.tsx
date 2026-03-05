import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Gift, Store, Navigation, QrCode, LogIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import { prefetchRoute } from '@/lib/route-prefetch';
import { useCallback, useState } from 'react';
import { DriveSearchSheet } from '@/components/drive/DriveSearchSheet';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/rewards', label: 'Gutscheine', icon: Gift },
  { path: '__center__', label: 'Navigation', icon: Navigation, highlight: true },
  { path: '/partner', label: 'Partner', icon: Store },
  { path: '__qr__', label: 'QR-Code', icon: QrCode, isQR: true },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [driveOpen, setDriveOpen] = useState(false);
  
  const handleNavClick = (e: React.MouseEvent, path: string, isQR?: boolean) => {
    e.preventDefault();
    if (path === '__center__') {
      setDriveOpen(true);
      return;
    }
    if (isQR) {
      if (user) {
        navigate('/my-qr');
      } else {
        navigate('/auth');
      }
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
            const isActive = item.highlight || item.isQR
              ? false
              : (location.pathname === item.path || 
                (item.path !== '/' && location.pathname.startsWith(item.path)));
            const isHighlight = item.highlight;
            const isQR = item.isQR;
            
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
                    <Navigation className="h-6 w-6" strokeWidth={2.5} />
                  </button>
                  <span className="text-xs font-semibold leading-tight text-accent-foreground opacity-70">
                    {item.label}
                  </span>
                </div>
              );
            }
            
            if (isQR) {
              const isQRActive = location.pathname === '/my-qr';
              const QRIcon = user ? QrCode : LogIn;
              const label = user ? 'QR-Code' : 'Anmelden';
              return (
                <button
                  key={item.path}
                  onClick={(e) => handleNavClick(e, item.path, true)}
                  className={cn(
                    'flex flex-col items-center gap-1 min-w-[52px] min-h-[52px] px-3 py-2 rounded-xl transition-all duration-200',
                    isQRActive
                      ? 'text-accent'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <div className={cn(
                    'relative p-2 rounded-lg transition-all duration-200',
                    isQRActive && 'bg-primary/20',
                  )}>
                    <QRIcon className={cn(
                      'relative h-5 w-5 transition-transform duration-200',
                      isQRActive && 'scale-110',
                    )} strokeWidth={isQRActive ? 2.5 : 2} />
                  </div>
                  <span className={cn(
                    'text-xs font-semibold leading-tight',
                    isQRActive ? 'opacity-100' : 'opacity-70'
                  )}>
                    {label}
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