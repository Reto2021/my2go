import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Store, 
  Users, 
  Award, 
  QrCode,
  ArrowLeft,
  Shield,
  Radio,
  Settings,
  FileText,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/partners', icon: Store, label: 'Partner' },
  { path: '/admin/ghl', icon: Zap, label: 'GHL Status' },
  { path: '/admin/applications', icon: FileText, label: 'Bewerbungen' },
  { path: '/admin/customers', icon: Users, label: 'Kunden' },
  { path: '/admin/badges', icon: Award, label: 'Badges' },
  { path: '/admin/radio', icon: Radio, label: 'Radio-Belohnungen' },
  { path: '/admin/airdrops', icon: QrCode, label: 'Air Drops' },
  { path: '/admin/settings', icon: Settings, label: 'Einstellungen' },
];

export function AdminLayout() {
  const location = useLocation();
  
  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 bg-secondary text-secondary-foreground">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent">
                <Shield className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Admin Dashboard</h1>
                <p className="text-xs text-secondary-foreground/70">My 2Go Admin</p>
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
      
      {/* Admin Navigation */}
      <nav className="sticky top-[72px] z-40 bg-background border-b border-border">
        <div className="container">
          <div className="flex gap-1 overflow-x-auto -mx-4 px-4 scrollbar-none">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors',
                  isActive(item.path, item.exact)
                    ? 'border-accent text-accent'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
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
