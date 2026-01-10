import { useEffect, useState } from 'react';
import { 
  Gift, 
  QrCode, 
  CheckCircle, 
  Clock,
  Star,
  MessageSquare,
  Coins,
  TrendingUp,
  ChevronRight
} from 'lucide-react';
import { usePartner } from '@/components/partner/PartnerGuard';
import { 
  getPartnerStats, 
  getPartnerRedemptions, 
  getPartnerDailyStats,
  PartnerStats, 
  RedemptionWithDetails,
  DailyStats
} from '@/lib/partner-helpers';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Link, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function PartnerDashboard() {
  const { partnerInfo } = usePartner();
  const location = useLocation();
  const queryString = location.search;
  
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<RedemptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!partnerInfo?.partnerId) return;
      
      try {
        const [statsData, redemptionsData, dailyData] = await Promise.all([
          getPartnerStats(partnerInfo.partnerId),
          getPartnerRedemptions(partnerInfo.partnerId),
          getPartnerDailyStats(partnerInfo.partnerId, 14),
        ]);
        
        setStats(statsData);
        setRecentRedemptions(redemptionsData.slice(0, 5));
        setDailyStats(dailyData);
      } catch (error) {
        console.error('Error loading partner data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [partnerInfo?.partnerId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      title: 'Wartend',
      subtitle: 'Noch nicht abgeholt',
      value: stats?.pendingRedemptions || 0,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/20',
    },
    {
      title: 'Bestätigt',
      subtitle: 'Erfolgreich eingelöst',
      value: stats?.completedRedemptions || 0,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/20',
    },
    {
      title: 'Feedback',
      subtitle: 'In-App Bewertungen',
      value: stats?.totalReviews || 0,
      icon: MessageSquare,
      color: 'text-primary',
      bgColor: 'bg-primary/20',
    },
    {
      title: 'Taler',
      subtitle: 'Gesamt ausgegeben',
      value: stats?.totalTalerRedeemed || 0,
      icon: Coins,
      color: 'text-accent',
      bgColor: 'bg-accent/20',
    },
  ];

  // Format chart data for display
  const chartData = dailyStats.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date), 'dd.MM', { locale: de }),
  }));

  return (
    <div className="space-y-4 animate-in">
      {/* Welcome */}
      <div>
        <h1 className="text-xl font-bold">Willkommen zurück!</h1>
        <p className="text-sm text-muted-foreground">
          Dein Partner-Überblick auf einen Blick.
        </p>
      </div>

      {/* Stats Grid - 2x2 on mobile */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map((stat) => (
          <div 
            key={stat.title}
            className="card-base p-3"
          >
            <div className="flex items-start gap-2.5">
              <div className={cn('p-2 rounded-xl flex-shrink-0', stat.bgColor)}>
                <stat.icon className={cn('h-4 w-4', stat.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{stat.title}</p>
                <p className="text-[9px] text-muted-foreground/70 truncate">{stat.subtitle}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rating Overview - Compact */}
      {stats && stats.totalReviews > 0 && (
        <div className="card-base p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold">
                  {stats.avgRating?.toFixed(1) || '-'}
                </span>
                <Star className="h-5 w-5 text-accent fill-accent" />
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="text-success font-medium">
                  {Math.round((stats.positiveReviews / stats.totalReviews) * 100)}%
                </span> positiv
              </div>
            </div>
            <Link 
              to={`/partner-portal/reviews${queryString}`}
              className="text-sm text-primary font-medium flex items-center gap-1"
            >
              Details <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3">
        {partnerInfo?.canConfirmRedemptions && (
          <Link 
            to={`/partner-portal/redemptions${queryString}`}
            className="card-base p-4 hover:bg-muted/50 transition-colors"
          >
            <QrCode className="h-6 w-6 text-primary mb-2" />
            <p className="font-semibold text-sm">Einlösungen</p>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingRedemptions || 0} offen
            </p>
          </Link>
        )}
        
        {partnerInfo?.canManageRewards && (
          <Link 
            to={`/partner-portal/rewards${queryString}`}
            className="card-base p-4 hover:bg-muted/50 transition-colors"
          >
            <Gift className="h-6 w-6 text-accent mb-2" />
            <p className="font-semibold text-sm">Rewards</p>
            <p className="text-xs text-muted-foreground">
              {stats?.activeRewards || 0} aktiv
            </p>
          </Link>
        )}
      </div>

      {/* Activity Chart - Simplified for mobile */}
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
          <h3 className="font-semibold text-sm">Aktivität (14 Tage)</h3>
        </div>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="dateLabel" 
              tick={{ fontSize: 9 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 9 }} width={24} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
            />
            <Bar 
              dataKey="redemptions" 
              name="Einlösungen" 
              fill="hsl(var(--primary))" 
              radius={[3, 3, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Taler Chart */}
      <div className="card-base p-4">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="h-4 w-4 text-accent" />
          <h3 className="font-semibold text-sm">Taler-Umsatz</h3>
        </div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="dateLabel" 
              tick={{ fontSize: 9 }}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fontSize: 9 }} width={30} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))', 
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value) => [`${value} Taler`, 'Eingelöst']}
            />
            <Area 
              type="monotone" 
              dataKey="taler" 
              stroke="hsl(var(--accent))" 
              fill="hsl(var(--accent))" 
              fillOpacity={0.2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Redemptions - Compact List */}
      {partnerInfo?.canConfirmRedemptions && recentRedemptions.length > 0 && (
        <div className="card-base overflow-hidden">
          <div className="flex items-center justify-between p-4 pb-2">
            <h3 className="font-semibold text-sm">Letzte Einlösungen</h3>
            <Link 
              to={`/partner-portal/redemptions${queryString}`}
              className="text-xs text-primary font-medium"
            >
              Alle anzeigen
            </Link>
          </div>
          
          <div className="divide-y divide-border">
            {recentRedemptions.map((redemption) => (
              <div 
                key={redemption.id} 
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg flex-shrink-0',
                    redemption.status === 'pending' ? 'bg-warning/20' :
                    redemption.status === 'used' ? 'bg-success/20' : 'bg-muted'
                  )}>
                    <Gift className={cn(
                      'h-4 w-4',
                      redemption.status === 'pending' ? 'text-warning' :
                      redemption.status === 'used' ? 'text-success' : 'text-muted-foreground'
                    )} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">
                      {redemption.reward?.title || 'Reward'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {redemption.user?.display_name || redemption.user?.email || 'Nutzer'}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <span className={cn(
                    'inline-block px-2 py-0.5 rounded text-[10px] font-medium',
                    redemption.status === 'pending' ? 'bg-warning/20 text-warning' :
                    redemption.status === 'used' ? 'bg-success/20 text-success' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {redemption.status === 'pending' ? 'Offen' :
                     redemption.status === 'used' ? 'Eingelöst' :
                     redemption.status === 'expired' ? 'Abgelaufen' : 'Storniert'}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {format(new Date(redemption.created_at), 'dd.MM HH:mm', { locale: de })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}