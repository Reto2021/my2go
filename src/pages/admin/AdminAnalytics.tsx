import { useState, useEffect, lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ReferralShareAnalytics } from '@/components/admin/ReferralShareAnalytics';
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
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Lazy load Leaflet map to avoid SSR issues
const LeafletUserMap = lazy(() => import('@/components/admin/LeafletUserMap'));

// Brand-safe professional color palette for pie charts
const COLORS = [
  'hsl(197, 96%, 18%)',   // Deep Teal - Primary brand
  'hsl(160, 60%, 45%)',   // Emerald Green - Success
  'hsl(44, 90%, 50%)',    // Warm Gold - Accent
  'hsl(200, 50%, 55%)',   // Sky Blue - Primary lighter
  'hsl(340, 65%, 55%)',   // Rose - Contrast
  'hsl(270, 50%, 55%)',   // Soft Purple
  'hsl(20, 80%, 55%)',    // Warm Orange
];

const DATE_RANGE_OPTIONS = [
  { label: '7 Tage', value: 7 },
  { label: '30 Tage', value: 30 },
  { label: '90 Tage', value: 90 },
];

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState(30);
  const [activeTab, setActiveTab] = useState('listening');

  // No more Mapbox token needed - using Leaflet/OpenStreetMap

  // Fetch listening stats
  const { data: listeningStats, isLoading: loadingListening } = useQuery({
    queryKey: ['admin-listening-stats', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);
      
      // Fetch listening sessions with stream_type and station info
      const { data: sessions, error } = await supabase
        .from('radio_listening_sessions')
        .select('started_at, duration_seconds, taler_awarded, stream_type, external_station_name, external_station_uuid, user_id')
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: true });
      
      if (error) throw error;
      
      // Fetch ALL earned Taler from transactions table (includes radio, visits, purchases, bonuses, etc.)
      const { data: earnTransactions, error: txError } = await supabase
        .from('transactions')
        .select('amount, created_at')
        .eq('type', 'earn')
        .gte('created_at', startDate.toISOString());
      
      if (txError) throw txError;
      
      const dailyStats = new Map<string, { sessions: number; duration: number; taler: number }>();
      const hourlyStats = new Map<number, { sessions: number; duration: number }>();
      
      // Station stats for external stations
      const stationStats = new Map<string, { 
        name: string; 
        sessions: number; 
        duration: number; 
        uniqueListeners: Set<string>;
        taler: number;
      }>();
      
      // Stream type distribution
      let radio2goSessions = 0;
      let externalSessions = 0;
      let radio2goDuration = 0;
      let externalDuration = 0;
      
      // Initialize all hours
      for (let i = 0; i < 24; i++) {
        hourlyStats.set(i, { sessions: 0, duration: 0 });
      }
      
      sessions?.forEach(session => {
        const sessionDate = new Date(session.started_at);
        const day = format(sessionDate, 'yyyy-MM-dd');
        const hour = sessionDate.getHours();
        const duration = session.duration_seconds || 0;
        
        // Track stream type distribution
        if (session.stream_type === 'external' && session.external_station_name) {
          externalSessions++;
          externalDuration += duration;
          
          // Track individual external stations
          const stationKey = session.external_station_uuid || session.external_station_name;
          const existing = stationStats.get(stationKey) || { 
            name: session.external_station_name, 
            sessions: 0, 
            duration: 0, 
            uniqueListeners: new Set(),
            taler: 0
          };
          existing.sessions++;
          existing.duration += duration;
          existing.uniqueListeners.add(session.user_id);
          existing.taler += session.taler_awarded || 0;
          stationStats.set(stationKey, existing);
        } else {
          radio2goSessions++;
          radio2goDuration += duration;
        }
        
        // Daily stats (sessions and duration only)
        const existing = dailyStats.get(day) || { sessions: 0, duration: 0, taler: 0 };
        dailyStats.set(day, {
          sessions: existing.sessions + 1,
          duration: existing.duration + duration,
          taler: existing.taler // Will be filled from transactions
        });
        
        // Hourly stats
        const hourlyExisting = hourlyStats.get(hour) || { sessions: 0, duration: 0 };
        hourlyStats.set(hour, {
          sessions: hourlyExisting.sessions + 1,
          duration: hourlyExisting.duration + duration
        });
      });
      
      // Add Taler from transactions (all earn sources)
      earnTransactions?.forEach(tx => {
        const txDate = new Date(tx.created_at);
        const day = format(txDate, 'yyyy-MM-dd');
        const existing = dailyStats.get(day) || { sessions: 0, duration: 0, taler: 0 };
        dailyStats.set(day, {
          ...existing,
          taler: existing.taler + (tx.amount || 0)
        });
      });
      
      const chartData = Array.from(dailyStats.entries()).map(([date, stats]) => ({
        date: format(new Date(date), 'dd.MM', { locale: de }),
        fullDate: date,
        sessions: stats.sessions,
        durationMinutes: Math.round(stats.duration / 60),
        taler: stats.taler
      }));
      
      const hourlyChartData = Array.from(hourlyStats.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([hour, stats]) => ({
          hour: `${hour.toString().padStart(2, '0')}:00`,
          sessions: stats.sessions,
          durationMinutes: Math.round(stats.duration / 60)
        }));
      
      // Top external stations
      const topStations = Array.from(stationStats.entries())
        .map(([key, data]) => ({
          id: key,
          name: data.name,
          sessions: data.sessions,
          durationHours: Math.round(data.duration / 3600 * 10) / 10,
          uniqueListeners: data.uniqueListeners.size,
          taler: data.taler
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 10);
      
      const totalSessions = sessions?.length || 0;
      const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
      // Total Taler from ALL earn transactions (not just radio)
      const totalTaler = earnTransactions?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;
      const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 60) : 0;
      
      // Find peak hour
      const peakHour = Array.from(hourlyStats.entries())
        .sort((a, b) => b[1].sessions - a[1].sessions)[0];
      
      return {
        chartData,
        hourlyChartData,
        totalSessions,
        totalDurationHours: Math.round(totalDuration / 3600),
        totalTaler,
        avgDurationMinutes: avgDuration,
        peakHour: peakHour ? `${peakHour[0].toString().padStart(2, '0')}:00` : null,
        peakHourSessions: peakHour?.[1].sessions || 0,
        // New: stream type breakdown
        streamTypeData: [
          { name: 'Radio 2Go', sessions: radio2goSessions, durationHours: Math.round(radio2goDuration / 3600 * 10) / 10 },
          { name: 'Externe Sender', sessions: externalSessions, durationHours: Math.round(externalDuration / 3600 * 10) / 10 }
        ],
        topStations,
        externalStationCount: stationStats.size
      };
    }
  });

  // Fetch user activity stats with location data
  const { data: userStats, isLoading: loadingUsers } = useQuery({
    queryKey: ['admin-user-stats', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('created_at, last_activity_at, city, postal_code, current_streak')
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      const dailyNewUsers = new Map<string, number>();
      const activeUsers = new Map<string, number>();
      
      profiles?.forEach(profile => {
        const createdDay = format(new Date(profile.created_at), 'yyyy-MM-dd');
        if (new Date(profile.created_at) >= startDate) {
          dailyNewUsers.set(createdDay, (dailyNewUsers.get(createdDay) || 0) + 1);
        }
        
        if (profile.last_activity_at && new Date(profile.last_activity_at) >= startDate) {
          const activeDay = format(new Date(profile.last_activity_at), 'yyyy-MM-dd');
          activeUsers.set(activeDay, (activeUsers.get(activeDay) || 0) + 1);
        }
      });
      
      // City distribution with counts
      const cityDistribution = new Map<string, number>();
      profiles?.forEach(profile => {
        const city = profile.city || 'Unbekannt';
        cityDistribution.set(city, (cityDistribution.get(city) || 0) + 1);
      });
      
      const topCities = Array.from(cityDistribution.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }));
      
      // Postal code distribution for map (Swiss postal codes)
      const postalCodeDistribution = new Map<string, { count: number; city: string }>();
      profiles?.forEach(profile => {
        if (profile.postal_code) {
          const existing = postalCodeDistribution.get(profile.postal_code);
          postalCodeDistribution.set(profile.postal_code, {
            count: (existing?.count || 0) + 1,
            city: profile.city || 'Unbekannt'
          });
        }
      });
      
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
      
      const streakDistribution = [
        { name: 'Keine Serie', value: profiles?.filter(p => !p.current_streak || p.current_streak === 0).length || 0 },
        { name: '1-3 Tage', value: profiles?.filter(p => p.current_streak && p.current_streak >= 1 && p.current_streak <= 3).length || 0 },
        { name: '4-7 Tage', value: profiles?.filter(p => p.current_streak && p.current_streak >= 4 && p.current_streak <= 7).length || 0 },
        { name: '8-14 Tage', value: profiles?.filter(p => p.current_streak && p.current_streak >= 8 && p.current_streak <= 14).length || 0 },
        { name: '15+ Tage', value: profiles?.filter(p => p.current_streak && p.current_streak >= 15).length || 0 }
      ];
      
      return {
        chartData,
        topCities,
        postalCodeDistribution: Array.from(postalCodeDistribution.entries()).map(([plz, data]) => ({
          plz,
          count: data.count,
          city: data.city
        })),
        streakDistribution,
        totalUsers: profiles?.length || 0,
        newUsersInRange: Array.from(dailyNewUsers.values()).reduce((a, b) => a + b, 0),
        activeUsersInRange: new Set(profiles?.filter(p => p.last_activity_at && new Date(p.last_activity_at) >= startDate).map(p => p.last_activity_at)).size
      };
    }
  });

  // Fetch partner locations for map
  const { data: partnerLocations } = useQuery({
    queryKey: ['admin-partner-locations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('id, name, city, lat, lng, is_active')
        .eq('is_active', true)
        .not('lat', 'is', null)
        .not('lng', 'is', null);
      
      if (error) throw error;
      return data || [];
    }
  });

  // Map rendering is now handled by LeafletUserMap component

  // Fetch app usage stats
  const { data: appUsageStats, isLoading: loadingUsage } = useQuery({
    queryKey: ['admin-app-usage', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);
      
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('source, type, amount, created_at')
        .gte('created_at', startDate.toISOString());
      
      if (error) throw error;
      
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Nutzer-Analyse</h1>
          <p className="text-muted-foreground">Übersicht über Hörverhalten, Standorte und App-Nutzung</p>
        </div>
        
        {/* Date Range Selector */}
        <div className="flex gap-2">
          {DATE_RANGE_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={dateRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(option.value)}
              className={cn(
                'min-w-[80px]',
                dateRange === option.value && 'bg-primary text-primary-foreground'
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
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
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
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

          {/* Hourly Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Stündliche Aktivität
                {listeningStats?.peakHour && (
                  <span className="ml-auto text-sm font-normal text-muted-foreground">
                    Peak: {listeningStats.peakHour} ({listeningStats.peakHourSessions} Sessions)
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingListening ? (
                <Skeleton className="h-[250px] w-full" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={listeningStats?.hourlyChartData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={11}
                      interval={1}
                      angle={-45}
                      textAnchor="end"
                      height={50}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number, name: string) => {
                        if (name === 'sessions') return [value, 'Sessions'];
                        if (name === 'durationMinutes') return [`${value} min`, 'Gesamtdauer'];
                        return [value, name];
                      }}
                    />
                    <Bar 
                      dataKey="sessions" 
                      name="sessions"
                      fill="hsl(var(--primary))" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Stream Type Distribution */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Radio className="h-5 w-5" />
                  Sender-Verteilung
                  {listeningStats?.externalStationCount ? (
                    <span className="ml-auto text-sm font-normal text-muted-foreground">
                      {listeningStats.externalStationCount} externe Sender
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingListening ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : (
                  <div className="space-y-4">
                    {listeningStats?.streamTypeData?.map((item, index) => {
                      const total = listeningStats.streamTypeData.reduce((sum, d) => sum + d.sessions, 0);
                      const percentage = total > 0 ? Math.round((item.sessions / total) * 100) : 0;
                      return (
                        <div key={item.name} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground">
                              {item.sessions.toLocaleString()} Sessions • {item.durationHours}h
                            </span>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all"
                              style={{ 
                                width: `${percentage}%`,
                                backgroundColor: index === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'
                              }}
                            />
                          </div>
                          <p className="text-xs text-muted-foreground text-right">{percentage}%</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Headphones className="h-5 w-5" />
                  Top Externe Sender
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingListening ? (
                  <Skeleton className="h-[200px] w-full" />
                ) : listeningStats?.topStations?.length ? (
                  <div className="space-y-3 max-h-[280px] overflow-y-auto">
                    {listeningStats.topStations.map((station, index) => (
                      <div 
                        key={station.id} 
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{station.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {station.uniqueListeners} Hörer • {station.durationHours}h
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{station.sessions}</p>
                          <p className="text-xs text-muted-foreground">Sessions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Radio className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">Keine externen Sender</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users & Locations Tab */}
        <TabsContent value="users" className="space-y-6">
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
                    <p className="text-xs text-muted-foreground">Neue Nutzer ({dateRange}T)</p>
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

          {/* Geo Map */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Nutzer & Partner Standorte
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative w-full h-[400px] rounded-lg overflow-hidden border bg-muted/20">
                <Suspense fallback={
                  <div className="flex flex-col items-center justify-center h-full bg-muted/50 rounded-lg gap-2">
                    <MapPin className="h-8 w-8 text-muted-foreground animate-pulse" />
                    <p className="text-muted-foreground">Karte wird geladen...</p>
                  </div>
                }>
                  <LeafletUserMap 
                    partnerLocations={partnerLocations || []}
                    topCities={userStats?.topCities || []}
                  />
                </Suspense>
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-secondary border-2 border-white shadow-sm" />
                  <span className="text-muted-foreground">Partner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent border-2 border-white shadow-sm" />
                  <span className="text-muted-foreground">Nutzer-Cluster</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
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
                      <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} width={80} />
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

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Bonus-Serien
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
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
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
          
          {/* Referral Share Analytics */}
          <ReferralShareAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}
