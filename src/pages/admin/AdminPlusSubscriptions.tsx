import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Crown, 
  Coins, 
  CreditCard, 
  Users, 
  TrendingUp,
  Calendar,
  Download
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))'];

const DATE_RANGE_OPTIONS = [
  { label: '7 Tage', value: 7 },
  { label: '30 Tage', value: 30 },
  { label: '90 Tage', value: 90 },
  { label: 'Alle', value: 365 },
];

export default function AdminPlusSubscriptions() {
  const [dateRange, setDateRange] = useState(30);

  // Fetch Plus subscription stats
  const { data: plusStats, isLoading } = useQuery({
    queryKey: ['admin-plus-stats', dateRange],
    queryFn: async () => {
      const startDate = subDays(new Date(), dateRange);

      // Get all profiles with subscription info
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, display_name, subscription_status, subscription_tier, subscription_ends_at, free_trial_started_at')
        .not('subscription_status', 'is', null);

      if (profilesError) throw profilesError;

      // Get Taler transactions for Plus
      const { data: talerTransactions, error: txError } = await supabase
        .from('transactions')
        .select('id, user_id, amount, created_at, description')
        .eq('source', 'system')
        .eq('type', 'spend')
        .ilike('description', '%2Go Plus%')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (txError) throw txError;

      // Calculate stats
      const activeSubscribers = profiles?.filter(p => 
        p.subscription_status === 'active' && 
        p.subscription_ends_at && 
        new Date(p.subscription_ends_at) > new Date()
      ) || [];

      const trialUsers = profiles?.filter(p => 
        p.subscription_status === 'trial' ||
        (p.free_trial_started_at && !p.subscription_tier)
      ) || [];

      const talerRedemptions = talerTransactions || [];
      const talerTotal = talerRedemptions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);

      // Tier distribution
      const tierDistribution = {
        monthly: activeSubscribers.filter(p => p.subscription_tier === 'monthly').length,
        yearly: activeSubscribers.filter(p => p.subscription_tier === 'yearly').length,
        taler: activeSubscribers.filter(p => p.subscription_tier === 'taler').length,
      };

      const tierData = [
        { name: 'Monatlich (CHF)', value: tierDistribution.monthly },
        { name: 'Jährlich (CHF)', value: tierDistribution.yearly },
        { name: 'Taler-Plus', value: tierDistribution.taler },
      ].filter(d => d.value > 0);

      // Daily Taler redemptions
      const dailyRedemptions = new Map<string, number>();
      talerRedemptions.forEach(tx => {
        const day = format(new Date(tx.created_at), 'yyyy-MM-dd');
        dailyRedemptions.set(day, (dailyRedemptions.get(day) || 0) + 1);
      });

      const dailyData = Array.from(dailyRedemptions.entries())
        .map(([date, count]) => ({
          date: format(new Date(date), 'dd.MM', { locale: de }),
          count
        }))
        .slice(-14);

      return {
        totalActive: activeSubscribers.length,
        totalTrial: trialUsers.length,
        talerRedemptions: talerRedemptions.length,
        talerTotal,
        tierData,
        dailyData,
        recentRedemptions: talerRedemptions.slice(0, 20),
        profiles
      };
    }
  });

  // Export CSV
  const handleExportCSV = () => {
    if (!plusStats?.recentRedemptions) return;

    const headers = ['Datum', 'User ID', 'Taler', 'Beschreibung'];
    const rows = plusStats.recentRedemptions.map(tx => [
      format(new Date(tx.created_at), 'dd.MM.yyyy HH:mm'),
      tx.user_id,
      Math.abs(tx.amount),
      tx.description || ''
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(';'))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `plus-taler-redemptions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Crown className="h-6 w-6 text-amber-500" />
            2Go Plus Übersicht
          </h1>
          <p className="text-muted-foreground">Abonnements und Taler-Einlösungen</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-2">
          {DATE_RANGE_OPTIONS.map(option => (
            <Button
              key={option.value}
              variant={dateRange === option.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(option.value)}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : plusStats?.totalActive}
                </p>
                <p className="text-xs text-muted-foreground">Aktive Abos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : plusStats?.totalTrial}
                </p>
                <p className="text-xs text-muted-foreground">Trial-Nutzer</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <Coins className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : plusStats?.talerRedemptions}
                </p>
                <p className="text-xs text-muted-foreground">Taler-Einlösungen</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : plusStats?.talerTotal?.toLocaleString('de-CH')}
                </p>
                <p className="text-xs text-muted-foreground">Taler ausgegeben</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tier Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Abo-Verteilung
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : plusStats?.tierData && plusStats.tierData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={plusStats.tierData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {plusStats.tierData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Noch keine Abonnements
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Taler Redemptions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5" />
              Taler-Plus Einlösungen (täglich)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : plusStats?.dailyData && plusStats.dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={plusStats.dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="hsl(var(--chart-1))" name="Einlösungen" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center text-muted-foreground">
                Noch keine Taler-Einlösungen
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Taler Redemptions Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Letzte Taler-Plus Einlösungen
            </CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportCSV}>
              <Download className="h-4 w-4 mr-2" />
              CSV Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : plusStats?.recentRedemptions && plusStats.recentRedemptions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Datum</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Taler</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plusStats.recentRedemptions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="font-medium">
                      {format(new Date(tx.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {tx.user_id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-amber-500/10 text-amber-600">
                        {Math.abs(tx.amount)} Taler
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-500/10 text-green-600">
                        30 Tage Plus
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Noch keine Taler-Plus Einlösungen im gewählten Zeitraum
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
