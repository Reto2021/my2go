import { NavLink, useLocation } from 'react-router-dom';
import { Home, Gift, QrCode, Store, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/rewards', label: 'Rewards', icon: Gift },
  { path: '/code', label: 'Code', icon: QrCode },
  { path: '/partner', label: 'Partner', icon: Store },
  { path: '/faq', label: 'FAQ', icon: HelpCircle },
];

export function BottomNav() {
  const location = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Background blur */}
      <div className="absolute inset-0 bg-white/90 backdrop-blur-xl border-t border-border/50" />
      
      <div className="relative container flex items-center justify-around py-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || 
            (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all duration-200',
                isActive
                  ? 'text-secondary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'relative p-2 rounded-xl transition-all duration-200',
                isActive && 'bg-primary/20'
              )}>
                <Icon className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  isActive && 'scale-110'
                )} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={cn(
                'text-[10px] font-semibold tracking-wide',
                isActive ? 'opacity-100' : 'opacity-70'
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
