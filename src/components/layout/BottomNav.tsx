import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Gift, QrCode, Store, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/rewards', label: 'Gutscheine', icon: Gift },
  { path: '/my-qr', label: 'Mein QR', icon: QrCode, highlight: true },
  { path: '/partner', label: 'Partner', icon: Store },
  { path: '/code', label: 'Radio-Code', icon: Music },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleNavClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    // Force navigation to home even if already on home (closes balance card etc.)
    if (path === '/') {
      navigate('/', { replace: true });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate(path);
    }
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50" data-onboarding="bottom-nav">
      {/* Background blur */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative container flex items-center justify-around py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          const isHighlight = item.highlight;
          
          return (
            <button
              key={item.path}
              onClick={(e) => handleNavClick(e, item.path)}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200',
                isActive
                  ? 'text-secondary'
                  : isHighlight 
                    ? 'text-accent'
                    : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative p-2 rounded-xl transition-all duration-200',
                isActive && 'bg-primary/20',
                isHighlight && !isActive && 'bg-accent/20'
              )}>
                <Icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive && 'scale-110',
                  isHighlight && 'h-6 w-6'
                )} strokeWidth={isActive || isHighlight ? 2.5 : 2} />
              </div>
              <span className={cn(
                'text-[10px] font-semibold tracking-wide',
                isActive ? 'opacity-100' : 'opacity-70'
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
