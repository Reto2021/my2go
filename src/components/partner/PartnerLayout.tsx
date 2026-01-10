import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Gift, 
  QrCode,
  ArrowLeft,
  Store,
  Star,
  ScanLine,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePartner } from './PartnerGuard';

export function PartnerLayout() {
  const location = useLocation();
  const { partnerInfo, isAdminOverride } = usePartner();
  
  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  // Build nav items based on permissions
  const navItems = [
    { path: '/partner-portal', icon: LayoutDashboard, label: 'Dashboard', exact: true, show: true },
    { path: '/partner-portal/rewards', icon: Gift, label: 'Rewards', show: partnerInfo?.canManageRewards },
    { path: '/partner-portal/redemptions', icon: QrCode, label: 'Einlösungen', show: partnerInfo?.canConfirmRedemptions },
    { path: '/partner-portal/reviews', icon: Star, label: 'Bewertungen', show: true },
  ].filter(item => item.show);

  // Preserve query params for admin override
  const queryString = location.search;
  
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Admin Override Banner */}
      {isAdminOverride && (
        <div className="bg-accent text-accent-foreground py-2 px-4">
          <div className="container flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4" />
              <span>Admin-Modus: {partnerInfo?.partnerName}</span>
            </div>
            <Link 
              to="/admin/partners" 
              className="text-xs underline hover:no-underline"
            >
              Zurück zur Partnerliste
            </Link>
          </div>
        </div>
      )}

      {/* Partner Header - Simplified for mobile */}
      <header className="sticky top-0 z-50 bg-card border-b border-border">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-base font-bold truncate max-w-[180px] sm:max-w-none">
                  {partnerInfo?.partnerName || 'Partner Portal'}
                </h1>
                <p className="text-xs text-muted-foreground">
                  {partnerInfo?.role === 'owner' ? 'Inhaber' : 
                   partnerInfo?.role === 'manager' ? 'Manager' : 'Mitarbeiter'}
                </p>
              </div>
            </div>
            
            {!isAdminOverride && (
              <Link 
                to="/" 
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-xs font-medium"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Zurück</span>
              </Link>
            )}
          </div>
        </div>
      </header>
      
      {/* Content */}
      <main className="container py-4">
        <Outlet />
      </main>

      {/* Fixed Scanner FAB - Most prominent action */}
      {partnerInfo?.canConfirmRedemptions && (
        <Link
          to={`/partner-portal/scan${queryString}`}
          className={cn(
            "fixed right-4 bottom-24 z-50 flex items-center gap-2 px-5 py-4 rounded-2xl shadow-lg transition-all",
            "bg-accent text-accent-foreground hover:bg-accent/90 active:scale-95",
            isActive('/partner-portal/scan') && "bg-primary text-primary-foreground"
          )}
        >
          <ScanLine className="h-6 w-6" />
          <span className="font-bold">Scannen</span>
        </Link>
      )}
      
      {/* Bottom Navigation - Mobile First */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        <div className="absolute inset-0 bg-card/95 backdrop-blur-xl border-t border-border" />
        
        <div className="relative container flex items-center justify-around py-2 pb-safe">
          {navItems.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);
            
            return (
              <Link
                key={item.path}
                to={`${item.path}${queryString}`}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className={cn(
                  'p-2 rounded-xl transition-all',
                  active && 'bg-primary/20'
                )}>
                  <Icon className={cn(
                    'h-5 w-5 transition-transform',
                    active && 'scale-110'
                  )} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={cn(
                  'text-[10px] font-semibold tracking-wide',
                  active ? 'opacity-100' : 'opacity-70'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}