import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats, getBadgeStats, AdminStats, BadgeStats } from '@/lib/admin-helpers';
import { 
  Users, 
  Store, 
  Gift, 
  Ticket, 
  Coins, 
  QrCode,
  TrendingUp,
  ChevronRight,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BadgeIcon } from '@/components/badges/BadgeIcon';

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [badgeStats, setBadgeStats] = useState<BadgeStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const [statsData, badgeData] = await Promise.all([
          getAdminStats(),
          getBadgeStats(),
        ]);
        setStats(statsData);
        setBadgeStats(badgeData);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);
  
  const statCards = [
    { 
      label: 'Benutzer', 
      value: stats?.totalUsers || 0, 
      icon: Users, 
      color: 'bg-blue-500/10 text-blue-500',
      href: '/admin/customers'
    },
    { 
      label: 'Partner', 
      value: stats?.totalPartners || 0, 
      icon: Store, 
      color: 'bg-green-500/10 text-green-500',
      href: '/admin/partners'
    },
    { 
      label: 'Rewards', 
      value: stats?.totalRewards || 0, 
      icon: Gift, 
      color: 'bg-purple-500/10 text-purple-500',
      href: '/admin/partners'
    },
    { 
      label: 'Einlösungen', 
      value: stats?.totalRedemptions || 0, 
      icon: Ticket, 
      color: 'bg-orange-500/10 text-orange-500',
      href: '/admin/customers'
    },
    { 
      label: 'Taler im Umlauf', 
      value: stats?.totalTalerCirculating || 0, 
      icon: Coins, 
      color: 'bg-accent/10 text-accent',
      href: '/admin/customers'
    },
    { 
      label: 'Aktive Air Drops', 
      value: stats?.activeAirDropCodes || 0, 
      icon: QrCode, 
      color: 'bg-pink-500/10 text-pink-500',
      href: '/admin/airdrops'
    },
  ];
  
  // Group badges by category
  const badgesByCategory = badgeStats.reduce((acc, badge) => {
    if (!acc[badge.category]) acc[badge.category] = [];
    acc[badge.category].push(badge);
    return acc;
  }, {} as Record<string, BadgeStats[]>);
  
  const categoryLabels: Record<string, string> = {
    general: 'Allgemein',
    streak: 'Login-Streak',
    leaderboard: 'Leaderboard',
    collector: 'Sammler',
    social: 'Social',
  };
  
  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Übersicht aller Kennzahlen</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <TrendingUp className="h-4 w-4" />
          Live-Daten
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {statCards.map(card => (
          <Link
            key={card.label}
            to={card.href}
            className={cn(
              'card-base p-5 group hover:shadow-lg transition-all',
              isLoading && 'animate-pulse'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn('p-2.5 rounded-xl', card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {isLoading ? '—' : card.value.toLocaleString('de-CH')}
            </p>
            <p className="text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>
      
      {/* Badge Statistics */}
      <div className="card-base p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-accent" />
            <h2 className="text-lg font-bold">Badge-Statistiken</h2>
          </div>
          <Link 
            to="/admin/badges" 
            className="text-sm text-accent hover:underline flex items-center gap-1"
          >
            Alle verwalten
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-4 rounded-xl bg-accent/10">
            <p className="text-2xl font-bold text-accent">
              {isLoading ? '—' : stats?.totalBadges || 0}
            </p>
            <p className="text-sm text-muted-foreground">Aktive Badges</p>
          </div>
          <div className="p-4 rounded-xl bg-green-500/10">
            <p className="text-2xl font-bold text-green-500">
              {isLoading ? '—' : stats?.totalBadgesAwarded || 0}
            </p>
            <p className="text-sm text-muted-foreground">Vergebene Badges</p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-muted rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(badgesByCategory).map(([category, badges]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  {categoryLabels[category] || category}
                </p>
                <div className="space-y-2">
                  {badges.map((badge) => (
                    <div 
                      key={badge.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: badge.color + '20' }}
                      >
                        <BadgeIcon icon={badge.icon} color={badge.color} size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{badge.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold tabular-nums">{badge.awardedCount}</p>
                        <p className="text-xs text-muted-foreground">Nutzer</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            
            {badgeStats.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                Noch keine Badges erstellt
              </p>
            )}
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="card-base p-6">
        <h2 className="text-lg font-bold mb-4">Schnellaktionen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/admin/partners"
            className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <Store className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-semibold">Partner hinzufügen</p>
              <p className="text-xs text-muted-foreground">Neuen Partner erstellen</p>
            </div>
          </Link>
          
          <Link
            to="/admin/badges"
            className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <Award className="h-5 w-5 text-accent" />
            <div>
              <p className="font-semibold">Badge erstellen</p>
              <p className="text-xs text-muted-foreground">Neues Badge hinzufügen</p>
            </div>
          </Link>
          
          <Link
            to="/admin/airdrops"
            className="flex items-center gap-3 p-4 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
          >
            <QrCode className="h-5 w-5 text-pink-500" />
            <div>
              <p className="font-semibold">Air Drop erstellen</p>
              <p className="text-xs text-muted-foreground">Neuen Code generieren</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
