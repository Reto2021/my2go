import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Mail, TrendingUp, TrendingDown, Users, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { de } from 'date-fns/locale';

interface OptInStats {
  totalUsers: number;
  optedInUsers: number;
  optInRate: number;
  last7DaysRate: number;
  previousRate: number;
  trendData: { date: string; rate: number; optIns: number; total: number }[];
}

export function MarketingOptInWidget() {
  const [stats, setStats] = useState<OptInStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadOptInStats() {
      setIsLoading(true);
      try {
        // Get all profiles with marketing consent info
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, marketing_consent, marketing_consent_at, created_at');

        if (error) throw error;

        const totalUsers = profiles?.length || 0;
        const optedInUsers = profiles?.filter(p => p.marketing_consent === true).length || 0;
        const optInRate = totalUsers > 0 ? (optedInUsers / totalUsers) * 100 : 0;

        // Calculate last 7 days vs previous 7 days
        const now = new Date();
        const last7Days = subDays(now, 7);
        const previous7Days = subDays(now, 14);

        const last7DaysProfiles = profiles?.filter(p => 
          new Date(p.created_at) >= last7Days
        ) || [];
        const last7DaysOptIns = last7DaysProfiles.filter(p => p.marketing_consent === true).length;
        const last7DaysRate = last7DaysProfiles.length > 0 
          ? (last7DaysOptIns / last7DaysProfiles.length) * 100 
          : 0;

        const previous7DaysProfiles = profiles?.filter(p => 
          new Date(p.created_at) >= previous7Days && new Date(p.created_at) < last7Days
        ) || [];
        const previous7DaysOptIns = previous7DaysProfiles.filter(p => p.marketing_consent === true).length;
        const previousRate = previous7DaysProfiles.length > 0 
          ? (previous7DaysOptIns / previous7DaysProfiles.length) * 100 
          : 0;

        // Build trend data for chart (last 30 days)
        const last30Days = subDays(now, 30);
        const dateRange = eachDayOfInterval({ start: last30Days, end: now });
        
        const trendData = dateRange.map(date => {
          const dayStart = startOfDay(date);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          
          const dayProfiles = profiles?.filter(p => {
            const created = new Date(p.created_at);
            return created >= dayStart && created < dayEnd;
          }) || [];
          
          const dayOptIns = dayProfiles.filter(p => p.marketing_consent === true).length;
          const dayRate = dayProfiles.length > 0 ? (dayOptIns / dayProfiles.length) * 100 : 0;
          
          return {
            date: format(date, 'dd.MM', { locale: de }),
            rate: Math.round(dayRate),
            optIns: dayOptIns,
            total: dayProfiles.length,
          };
        });

        setStats({
          totalUsers,
          optedInUsers,
          optInRate,
          last7DaysRate,
          previousRate,
          trendData,
        });
      } catch (error) {
        console.error('Failed to load opt-in stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadOptInStats();
  }, []);

  const trend = stats ? stats.last7DaysRate - stats.previousRate : 0;
  const trendUp = trend >= 0;

  return (
    <div className="card-base p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-bold">Marketing Opt-In</h2>
        </div>
        {stats && (
          <div className={cn(
            "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-full",
            trendUp ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
          )}>
            {trendUp ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingDown className="h-4 w-4" />
            )}
            {trendUp ? '+' : ''}{trend.toFixed(1)}%
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 bg-muted rounded-xl" />
            <div className="h-20 bg-muted rounded-xl" />
          </div>
          <div className="h-32 bg-muted rounded-xl" />
        </div>
      ) : stats ? (
        <>
          {/* Main Stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-4 rounded-xl bg-primary/10">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Opt-In Rate</span>
              </div>
              <p className="text-2xl font-bold text-primary">
                {stats.optInRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.optedInUsers.toLocaleString('de-CH')} von {stats.totalUsers.toLocaleString('de-CH')}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Letzte 7 Tage</span>
              </div>
              <p className="text-2xl font-bold">
                {stats.last7DaysRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground">
                vs. {stats.previousRate.toFixed(1)}% Vorwoche
              </p>
            </div>
          </div>

          {/* Trend Chart */}
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.trendData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                <XAxis 
                  dataKey="date" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  hide 
                  domain={[0, 100]}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'rate') return [`${value}%`, 'Opt-In Rate'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Datum: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Info Text */}
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Tägliche Opt-In Rate der letzten 30 Tage
          </p>
        </>
      ) : (
        <p className="text-center text-muted-foreground py-4">
          Keine Daten verfügbar
        </p>
      )}
    </div>
  );
}
