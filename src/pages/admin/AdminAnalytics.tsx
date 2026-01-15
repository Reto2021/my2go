import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Radio, 
  MapPin, 
  Smartphone, 
  TrendingUp, 
  Users, 
  Clock, 
  Calendar,
  Activity,
  Headphones,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function AdminAnalytics() {
  const [dateRange] = useState(30); // Days to look back

  // Fetch listening stats
  const { data: listeningStats, isLoading: loadingListening } = useQuery({
    queryKey: ['admin-listening-stats', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);
      
      // Get daily listening sessions
      const { data: sessions, error } = await supabase
        .from('radio_listening_sessions')
        .select('started_at, duration_seconds, taler_awarded')
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: true });
      
      if (error) throw error;
      
      // Group by day
      const dailyStats = new Map<string, { sessions: number; duration: number; taler: number }>();
      
      sessions?.forEach(session => {
        const day = format(new Date(session.started_at), 'yyyy-MM-dd');
        const existing = dailyStats.get(day) || { sessions: 0, duration: 0, taler: 0 };
        dailyStats.set(day, {
          sessions: existing.sessions + 1,
          duration: existing.duration + (session.duration_seconds || 0),
          taler: existing.taler + (session.taler_awarded || 0)
        });
      });
      
      // Convert to array for chart
      const chartData = Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date: format(new Date(date), 'dd.MM', { locale: de }),
        fullDate: date,
        sessions: stats.sessions,
        durationMinutes: Math.round(stats.duration / 60),
        taler: stats.taler
      }));
      
      // Calculate totals
      const totalSessions = sessions?.length || 0;
      const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
      const totalTaler = sessions?.reduce((sum, s) => sum + (s.taler_awarded || 0), 0) || 0;
      const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 60) : 0;
      
      return {
        chartData,
        totalSessions,
        totalDurationHours: Math.round(totalDuration / 3600),
        totalTaler,
        avgDurationMinutes: avgDuration
      };
    }
  });

  // Fetch user activity stats
  const { data: userStats, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-user-stats', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);
      
      // Get profiles with activity
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('created_at, last_activity_at, city, current_streak')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      // New users per day
      const dailyNewUsers = new Map<string, number>();
      const activeUsers = new Map<string, number>();
      
      profiles?.forEach(profile => {
        // New users
        const createdDay = format(new Date(profile.created_at), 'yyyy-MM-dd');
        if (new Date(profile.created_at) >= startDate) {
          dailyNewUsers.set(createdDay, (dailyNewUsers.get(createdDay) || 0) + 1);
        }
        
        // Active users (last activity in range)
        if (profile.last_activity_at && new Date(profile.last_activity_at) >= startDate) {
          const activeDay = format(new Date(profile.last_activity_at), 'yyyy-MM-dd');
          activeUsers.set(activeDay, (activeUsers.get(activeDay) || 0) + 1);
        }
      });
      
      // City distribution
      const cityDistribution = new Map<string, number>();
      profiles?.forEach(profile => {
        const city = profile.city || 'Unbekannt';
        cityDistribution.set(city, (cityDistribution.get(city) || 0) + 1);
      });
      
      const topCities = Array.from(cityDistribution.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));
      
      // Chart data
      const dates: string[] = [];
      for (let i = dateRange - 1; i >= 0; i--) {
        dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
      }
      
      const chartData = dates.map(date => ({
        date: format(new Date(date), 'dd.MM', { locale: de }),
        fullDate: date,
        newUsers: dailyNewUsers.get(date) || 0,
        activeUsers: activeUsers.get(date) || 0
      }));
      
      // Streak distribution
      const streakDistribution = [
        { name: 'Kein Streak', value: profiles?.filter(p => !p.current_streak || p.current_streak === 0).length || 0 },
        { name: '1-3 Tage', value: profiles?.filter(p => p.current_streak && p.current_streak >= 1 && p.current_streak <= 3).length || 0 },
        { name: '4-7 Tage', value: profiles?.filter(p => p.current_streak && p.current_streak >= 4 && p.current_streak <= 7).length || 0 },
        { name: '8-14 Tage', value: profiles?.filter(p => p.current_streak && p.current_streak >= 8 && p.current_streak <= 14).length || 0 },
        { name: '15+ Tage', value: profiles?.filter(p => p.current_streak && p.current_streak >= 15).length || 0 }
      ];
      
      return {
        chartData,
        topCities,
        streakDistribution,
        totalUsers: profiles?.length || 0,
        newUsersInRange: Array.from(dailyNewUsers.values()).reduce((a, b) => a + b, 0),
        activeUsersInRange: new Set(profiles?.filter(p => p.last_activity_at && new Date(p.last_activity_at) >= startDate).map(p => p.last_activity_at)).size
      };
    }
  });

  // Fetch app usage stats
  const { data: appUsageStats, isLoading: loadingUsage } = useQuery({
    queryKey: ['admin-app-usage', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);
      
      // Get transactions by source
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('source, type, amount, created_at')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
      // Source distribution
      const sourceDistribution = new Map<string, number>();
      transactions?.forEach(tx => {
        const source = tx.source || 'unknown';
        sourceDistribution.set(source, (sourceDistribution.get(source) || 0) + 1);
      });
      
      const sourceLabels: Record<string, string> = {
        'signup_bonus': 'Signup Bonus',
        'air_drop': 'Air Drop',
        'partner_visit': 'Partner Besuch',
        'partner_purchase': 'Partner Kauf',
        'bonus': 'Bonus',
        'reward_redemption': 'Einlösung',
        'system': 'System',
        'referral': 'Empfehlung'
      };
      
      const sourceData = Array.from(sourceDistribution.entries())
        .map(([source, value]) => ({ 
          name: sourceLabels[source] || source, 
          value 
        }))
        .sort((a, b) => b.value - a.value);
      
      // Redemption stats
      const { data: redemptions, error: redemptionError } = await supabase
        .from('redemptions')
        .select('status, created_at')
        .gte('created_at', startDate.toISOString());
      
      if (redemptionError) throw redemptionError;
      
      const redemptionsByStatus = {
        pending: redemptions?.filter(r => r.status === 'pending').length || 0,
        used: redemptions?.filter(r => r.status === 'used').length || 0,
        expired: redemptions?.filter(r => r.status === 'expired').length || 0,
        cancelled: redemptions?.filter(r => r.status === 'cancelled').length || 0
      };
      
      const redemptionStatusData = [
        { name: 'Ausstehend', value: redemptionsByStatus.pending },
        { name: 'Eingelöst', value: redemptionsByStatus.used },
        { name: 'Abgelaufen', value: redemptionsByStatus.expired },
        { name: 'Storniert', value: redemptionsByStatus.cancelled }
      ].filter(item => item.value > 0);
      
      // Total taler earned vs spent
      const earned = transactions?.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.amount, 0) || 0;
      const spent = transactions?.filter(t => t.type === 'spend').reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;
      
      return {
        sourceData,
        redemptionStatusData,
        totalTransactions: transactions?.length || 0,
        totalRedemptions: redemptions?.length || 0,
        talerEarned: earned,
        talerSpent: spent,
        conversionRate: redemptions?.length ? Math.round((redemptionsByStatus.used / redemptions.length) * 100) : 0
      };
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Behavior Analytics</h1>
        <p className="text-muted-foreground">Übersicht über Hörverhalten, Standorte und App-Nutzung der letzten {dateRange} Tage</p>
      </div>

      <Tabs defaultValue="listening" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="listening" className="gap-2">
            <Headphones className="h-4 w-4" />
            Hörverhalten
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <MapPin className="h-4 w-4" />
            Nutzer & Standorte
          </TabsTrigger>
          <TabsTrigger value="usage" className="gap-2">
            <Smartphone className="h-4 w-4" />
            App-Nutzung
          </TabsTrigger>
        </TabsList>

        {/* Listening Tab */}
        <TabsContent value="listening" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Radio className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingListening ? <Skeleton className="h-8 w-16" /> : listeningStats?.totalSessions.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Sessions</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingListening ? <Skeleton className="h-8 w-16" /> : `${listeningStats?.totalDurationHours}h`}
                    </p>
                    <p className="text-xs text-muted-foreground">Gesamte Hörzeit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingListening ? <Skeleton className="h-8 w-16" /> : `${listeningStats?.avgDurationMinutes} min`}
                    </p>
                    <p className="text-xs text-muted-foreground">Ø Session</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingListening ? <Skeleton className="h-8 w-16" /> : listeningStats?.totalTaler.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Taler verdient</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Listening Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Tägliche Hörsessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingListening ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={listeningStats?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'sessions') return [value, 'Sessions'];
                        if (name === 'durationMinutes') return [`${value} min`, 'Dauer'];
                        return [value, name];
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="sessions" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users & Locations Tab */}
        <TabsContent value="users" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingUsers ? <Skeleton className="h-8 w-16" /> : userStats?.totalUsers.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Gesamt Nutzer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingUsers ? <Skeleton className="h-8 w-16" /> : `+${userStats?.newUsersInRange}`}
                    </p>
                    <p className="text-xs text-muted-foreground">Neue Nutzer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingUsers ? <Skeleton className="h-8 w-16" /> : userStats?.activeUsersInRange}
                    </p>
                    <p className="text-xs text-muted-foreground">Aktive Nutzer</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* City Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Top Standorte
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={userStats?.topCities || []} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="hsl(var(--muted-foreground))" 
                        fontSize={12}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Streak Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Streak-Verteilung
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={userStats?.streakDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {userStats?.streakDistribution?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* User Growth Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Nutzer-Entwicklung
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingUsers ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userStats?.chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="date" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="newUsers" 
                      name="Neue Nutzer"
                      stroke="hsl(var(--chart-1))" 
                      fill="hsl(var(--chart-1))" 
                      fillOpacity={0.2}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="activeUsers" 
                      name="Aktive Nutzer"
                      stroke="hsl(var(--chart-2))" 
                      fill="hsl(var(--chart-2))" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* App Usage Tab */}
        <TabsContent value="usage" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Activity className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingUsage ? <Skeleton className="h-8 w-16" /> : appUsageStats?.totalTransactions.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Transaktionen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingUsage ? <Skeleton className="h-8 w-16" /> : appUsageStats?.talerEarned.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Taler verdient</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingUsage ? <Skeleton className="h-8 w-16" /> : appUsageStats?.totalRedemptions}
                    </p>
                    <p className="text-xs text-muted-foreground">Einlösungen</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {loadingUsage ? <Skeleton className="h-8 w-16" /> : `${appUsageStats?.conversionRate}%`}
                    </p>
                    <p className="text-xs text-muted-foreground">Einlöse-Rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Transaction Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Taler-Quellen
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsage ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={appUsageStats?.sourceData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {appUsageStats?.sourceData?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Redemption Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  Einlöse-Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsage ? (
                  <Skeleton className="h-[250px] w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={appUsageStats?.redemptionStatusData || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {appUsageStats?.redemptionStatusData?.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
