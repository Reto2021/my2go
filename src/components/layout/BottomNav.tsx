import { NavLink, useLocation } from 'react-router-dom';
import { Home, Gift, QrCode, MapPin, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/rewards', label: 'Rewards', icon: Gift },
  { path: '/code', label: 'Code', icon: QrCode },
  { path: '/partner', label: 'Partner', icon: MapPin },
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
];

export function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border bottom-safe">
      <div className="container flex items-center justify-around py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 min-w-[60px]',
                'transition-colors duration-200',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <div className={cn(
                'flex h-8 w-8 items-center justify-center rounded-xl transition-all duration-200',
                isActive && 'bg-primary/10'
              )}>
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                'text-2xs transition-all duration-200',
                isActive ? 'font-semibold' : 'font-medium'
              )}>
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
