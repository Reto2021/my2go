import { useEffect, useState } from 'react';
import { 
  Gift, 
  QrCode, 
  CheckCircle, 
  Clock,
  Star,
  MessageSquare,
  Coins,
  TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
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
      title: 'Offene Einlösungen',
      value: stats?.pendingRedemptions || 0,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Abgeschlossen',
      value: stats?.completedRedemptions || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Bewertungen',
      value: stats?.totalReviews || 0,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Taler eingelöst',
      value: stats?.totalTalerRedeemed || 0,
      icon: Coins,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  // Format chart data for display
  const chartData = dailyStats.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date), 'dd.MM', { locale: de }),
  }));

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Willkommen zurück!</h1>
        <p className="text-muted-foreground">
          Hier ist ein Überblick über dein Partner-Portal.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rating Overview */}
      {stats && stats.totalReviews > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Bewertungsübersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className="flex items-center gap-1 justify-center">
                  <span className="text-4xl font-bold">
                    {stats.avgRating?.toFixed(1) || '-'}
                  </span>
                  <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                </div>
                <p className="text-sm text-muted-foreground">Durchschnitt</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {stats.totalReviews > 0 
                    ? Math.round((stats.positiveReviews / stats.totalReviews) * 100) 
                    : 0}%
                </p>
                <p className="text-sm text-muted-foreground">Positive (4-5★)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.totalReviews}</p>
                <p className="text-sm text-muted-foreground">Gesamt</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Redemptions & Reviews Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Aktivität (14 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dateLabel" 
                  className="text-xs" 
                  tick={{ fontSize: 10 }}
                />
                <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  labelFormatter={(label) => `Datum: ${label}`}
                />
                <Legend />
                <Bar 
                  dataKey="redemptions" 
                  name="Einlösungen" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="reviews" 
                  name="Bewertungen" 
                  fill="hsl(142, 76%, 36%)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Taler Revenue Chart */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-amber-600" />
              Taler-Umsatz (14 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis 
                  dataKey="dateLabel" 
                  className="text-xs" 
                  tick={{ fontSize: 10 }}
                />
                <YAxis className="text-xs" tick={{ fontSize: 10 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))' 
                  }}
                  formatter={(value) => [`${value} Taler`, 'Eingelöst']}
                  labelFormatter={(label) => `Datum: ${label}`}
                />
                <Area 
                  type="monotone" 
                  dataKey="taler" 
                  name="Taler" 
                  stroke="hsl(43, 96%, 56%)" 
                  fill="hsl(43, 96%, 56%)" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        {partnerInfo?.canConfirmRedemptions && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Einlösungen bestätigen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {stats?.pendingRedemptions || 0} Einlösungen warten auf Bestätigung.
              </p>
              <Button asChild>
                <Link to="/partner-portal/redemptions">
                  Zu den Einlösungen
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
        
        {partnerInfo?.canManageRewards && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Gift className="h-5 w-5" />
                Rewards verwalten
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Du hast {stats?.activeRewards || 0} aktive Rewards.
              </p>
              <Button asChild variant="outline">
                <Link to="/partner-portal/rewards">
                  Rewards bearbeiten
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Redemptions */}
      {partnerInfo?.canConfirmRedemptions && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Letzte Einlösungen</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/partner-portal/redemptions">Alle anzeigen</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentRedemptions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Noch keine Einlösungen vorhanden.
              </p>
            ) : (
              <div className="space-y-3">
                {recentRedemptions.map((redemption) => (
                  <div 
                    key={redemption.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Gift className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {redemption.reward?.title || 'Unbekannter Reward'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {redemption.user?.display_name || redemption.user?.email || 'Unbekannter Nutzer'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={
                          redemption.status === 'pending' ? 'secondary' :
                          redemption.status === 'used' ? 'default' :
                          'destructive'
                        }
                      >
                        {redemption.status === 'pending' ? 'Offen' :
                         redemption.status === 'used' ? 'Eingelöst' :
                         redemption.status === 'expired' ? 'Abgelaufen' : 'Storniert'}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(redemption.created_at), 'dd.MM.yy HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}