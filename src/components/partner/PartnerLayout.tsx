import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gift, 
  QrCode,
  ArrowLeft,
  Store,
  Star,
  ScanLine
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePartner } from './PartnerGuard';

const navItems = [
  { path: '/partner-portal', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/partner-portal/scan', icon: ScanLine, label: 'Kunden scannen' },
  { path: '/partner-portal/rewards', icon: Gift, label: 'Gutscheine' },
  { path: '/partner-portal/redemptions', icon: QrCode, label: 'Einlösungen' },
  { path: '/partner-portal/reviews', icon: Star, label: 'Bewertungen' },
];

export function PartnerLayout() {
  const location = useLocation();
  const { partnerInfo } = usePartner();
  
  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Partner Header */}
      <header className="sticky top-0 z-50 bg-primary text-primary-foreground">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Store className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">{partnerInfo?.partnerName || 'Partner Portal'}</h1>
                <p className="text-xs text-primary-foreground/70">
                  {partnerInfo?.role === 'owner' ? 'Inhaber' : 
                   partnerInfo?.role === 'manager' ? 'Manager' : 'Mitarbeiter'}
                </p>
              </div>
            </div>
            
            <Link 
              to="/" 
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück zur App
            </Link>
          </div>
        </div>
      </header>
      
      {/* Partner Navigation */}
      <nav className="sticky top-[72px] z-40 bg-background border-b border-border">
        <div className="container">
          <div className="flex gap-1 overflow-x-auto -mx-4 px-4 scrollbar-none">
            {navItems.map(item => {
              // Hide rewards tab if user can't manage rewards
              if (item.path === '/partner-portal/rewards' && !partnerInfo?.canManageRewards) {
                return null;
              }
              // Hide redemptions tab if user can't confirm redemptions
              if (item.path === '/partner-portal/redemptions' && !partnerInfo?.canConfirmRedemptions) {
                return null;
              }
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                    isActive(item.path, item.exact)
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
      
      {/* Content */}
      <main className="container py-6">
        <Outlet />
      </main>
    </div>
  );
}
