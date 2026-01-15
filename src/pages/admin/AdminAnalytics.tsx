import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
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
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const DATE_RANGE_OPTIONS = [
  { label: '7 Tage', value: 7 },
  { label: '30 Tage', value: 30 },
  { label: '90 Tage', value: 90 },
];

export default function AdminAnalytics() {
  const [dateRange, setDateRange] = useState(30);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    const fetchToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-mapbox-token');
        if (!error && data?.token) {
          setMapboxToken(data.token);
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
      }
    };
    fetchToken();
  }, []);

  // Fetch listening stats
  const { data: listeningStats, isLoading: loadingListening } = useQuery({
    queryKey: ['admin-listening-stats', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);
      
      const { data: sessions, error } = await supabase
        .from('radio_listening_sessions')
        .select('started_at, duration_seconds, taler_awarded')
        .gte('started_at', startDate.toISOString())
        .order('started_at', { ascending: true });
      
      if (error) throw error;
      
      const dailyStats = new Map<string, { sessions: number; duration: number; taler: number }>();
      const hourlyStats = new Map<number, { sessions: number; duration: number }>();
      
      // Initialize all hours
      for (let i = 0; i < 24; i++) {
        hourlyStats.set(i, { sessions: 0, duration: 0 });
      }
      
      sessions?.forEach(session => {
        const sessionDate = new Date(session.started_at);
        const day = format(sessionDate, 'yyyy-MM-dd');
        const hour = sessionDate.getHours();
        
        // Daily stats
        const existing = dailyStats.get(day) || { sessions: 0, duration: 0, taler: 0 };
        dailyStats.set(day, {
          sessions: existing.sessions + 1,
          duration: existing.duration + (session.duration_seconds || 0),
          taler: existing.taler + (session.taler_awarded || 0)
        });
        
        // Hourly stats
        const hourlyExisting = hourlyStats.get(hour) || { sessions: 0, duration: 0 };
        hourlyStats.set(hour, {
          sessions: hourlyExisting.sessions + 1,
          duration: hourlyExisting.duration + (session.duration_seconds || 0)
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
      
      const totalSessions = sessions?.length || 0;
      const totalDuration = sessions?.reduce((sum, s) => sum + (s.duration_seconds || 0), 0) || 0;
      const totalTaler = sessions?.reduce((sum, s) => sum + (s.taler_awarded || 0), 0) || 0;
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
        peakHourSessions: peakHour?.[1].sessions || 0
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
        { name: 'Kein Streak', value: profiles?.filter(p => !p.current_streak || p.current_streak === 0).length || 0 },
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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [8.2275, 46.8182], // Switzerland center
      zoom: 7,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken]);

  // Add markers for partners and user clusters
  useEffect(() => {
    if (!map.current || !partnerLocations) return;

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.mapboxgl-marker');
    existingMarkers.forEach(marker => marker.remove());

    // Add partner markers
    partnerLocations.forEach(partner => {
      if (partner.lat && partner.lng) {
        const el = document.createElement('div');
        el.className = 'partner-marker';
        el.style.cssText = `
          width: 24px;
          height: 24px;
          background: hsl(var(--primary));
          border: 2px solid white;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        `;
        
        new mapboxgl.Marker(el)
          .setLngLat([partner.lng, partner.lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<div style="padding: 8px; font-family: system-ui;"><strong>${partner.name}</strong><br/>${partner.city || ''}</div>`)
          )
          .addTo(map.current!);
      }
    });

    // Add user cluster markers based on city data
    if (userStats?.topCities) {
      // Swiss city coordinates (approximate)
      const cityCoords: Record<string, [number, number]> = {
        'Zürich': [8.5417, 47.3769],
        'Bern': [7.4474, 46.9480],
        'Basel': [7.5886, 47.5596],
        'Genf': [6.1432, 46.2044],
        'Lausanne': [6.6323, 46.5197],
        'Winterthur': [8.7290, 47.5001],
        'St. Gallen': [9.3767, 47.4245],
        'Luzern': [8.3093, 47.0502],
        'Lugano': [8.9511, 46.0037],
        'Biel': [7.2467, 47.1368],
        'Thun': [7.6280, 46.7580],
        'Aarau': [8.0444, 47.3925],
        'Chur': [9.5316, 46.8508],
        'Zug': [8.5159, 47.1662],
        'Schaffhausen': [8.6333, 47.6958],
      };

      userStats.topCities.forEach(cityData => {
        const coords = cityCoords[cityData.name];
        if (coords && cityData.name !== 'Unbekannt') {
          const el = document.createElement('div');
          const size = Math.min(60, 20 + cityData.value * 2);
          el.style.cssText = `
            width: ${size}px;
            height: ${size}px;
            background: hsla(var(--accent), 0.7);
            border: 2px solid hsl(var(--accent));
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
            box-shadow: 0 2px 12px rgba(0,0,0,0.4);
          `;
          el.textContent = String(cityData.value);
          
          new mapboxgl.Marker(el)
            .setLngLat(coords)
            .setPopup(
              new mapboxgl.Popup({ offset: 25 })
                .setHTML(`<div style="padding: 8px; font-family: system-ui;"><strong>${cityData.name}</strong><br/>${cityData.value} Nutzer</div>`)
            )
            .addTo(map.current!);
        }
      });
    }
  }, [partnerLocations, userStats?.topCities]);

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
          <h1 className="text-2xl font-bold text-foreground">User Behavior Analytics</h1>
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
              <div className="relative w-full h-[400px] rounded-lg overflow-hidden">
                {mapboxToken ? (
                  <div ref={mapContainer} className="absolute inset-0" />
                ) : (
                  <div className="flex items-center justify-center h-full bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Karte wird geladen...</p>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-6 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-primary border-2 border-white" />
                  <span className="text-muted-foreground">Partner</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-accent/70 border-2 border-accent" />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
