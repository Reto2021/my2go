import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, Mail, Copy, Share2, TrendingUp, Users, Trophy, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ChannelStats {
  channel: string;
  count: number;
  conversions: number;
  conversionRate: number;
}

interface TopReferrer {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  referralCount: number;
  totalBonus: number;
}

interface ShareAnalytics {
  totalShares: number;
  totalConversions: number;
  conversionRate: number;
  byChannel: ChannelStats[];
  last7Days: { date: string; count: number }[];
  topReferrers: TopReferrer[];
}

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; chartColor: string }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]', chartColor: '#25D366' },
  telegram: { label: 'Telegram', icon: Send, color: 'bg-[#0088cc]', chartColor: '#0088cc' },
  email: { label: 'Email', icon: Mail, color: 'bg-muted-foreground', chartColor: '#71717a' },
  copy: { label: 'Link kopiert', icon: Copy, color: 'bg-primary', chartColor: 'hsl(var(--primary))' },
  native: { label: 'Native Share', icon: Share2, color: 'bg-accent', chartColor: 'hsl(var(--accent))' },
};

export function ReferralShareAnalytics() {
  const [analytics, setAnalytics] = useState<ShareAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadAnalytics();
  }, []);
  
  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      // Get all share events
      const { data: shares, error } = await supabase
        .from('referral_shares')
        .select('*')
        .order('shared_at', { ascending: false });
      
      if (error) throw error;
      
      // Get total referrals for conversion calculation
      const { count: totalReferrals } = await supabase
        .from('referrals')
        .select('*', { count: 'exact', head: true });
      
      // Calculate stats by channel
      const channelCounts: Record<string, { count: number; conversions: number }> = {};
      
      (shares || []).forEach(share => {
        if (!channelCounts[share.channel]) {
          channelCounts[share.channel] = { count: 0, conversions: 0 };
        }
        channelCounts[share.channel].count++;
        if (share.converted_referral_id) {
          channelCounts[share.channel].conversions++;
        }
      });
      
      const byChannel: ChannelStats[] = Object.entries(channelCounts)
        .map(([channel, stats]) => ({
          channel,
          count: stats.count,
          conversions: stats.conversions,
          conversionRate: stats.count > 0 ? (stats.conversions / stats.count) * 100 : 0,
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate);
      
      // Calculate last 7 days
      const last7Days: { date: string; count: number }[] = [];
      const today = new Date();
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const count = (shares || []).filter(s => 
          s.shared_at.startsWith(dateStr)
        ).length;
        last7Days.push({ date: dateStr, count });
      }
      
      // Get top referrers
      const { data: referrals } = await supabase
        .from('referrals')
        .select('referrer_id, referrer_bonus')
        .eq('status', 'completed');
      
      // Aggregate by referrer
      const referrerStats: Record<string, { count: number; bonus: number }> = {};
      (referrals || []).forEach(ref => {
        if (!referrerStats[ref.referrer_id]) {
          referrerStats[ref.referrer_id] = { count: 0, bonus: 0 };
        }
        referrerStats[ref.referrer_id].count++;
        referrerStats[ref.referrer_id].bonus += ref.referrer_bonus;
      });
      
      // Get top 5 referrer IDs
      const topReferrerIds = Object.entries(referrerStats)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5)
        .map(([id]) => id);
      
      // Fetch profiles for top referrers
      let topReferrers: TopReferrer[] = [];
      if (topReferrerIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name, avatar_url')
          .in('id', topReferrerIds);
        
        topReferrers = topReferrerIds.map(id => {
          const profile = profiles?.find(p => p.id === id);
          const stats = referrerStats[id];
          return {
            userId: id,
            displayName: profile?.display_name || 
              [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 
              'Unbekannt',
            avatarUrl: profile?.avatar_url || null,
            referralCount: stats.count,
            totalBonus: stats.bonus,
          };
        });
      }
      
      const totalShares = shares?.length || 0;
      const totalConversions = totalReferrals || 0;
      
      setAnalytics({
        totalShares,
        totalConversions,
        conversionRate: totalShares > 0 ? (totalConversions / totalShares) * 100 : 0,
        byChannel,
        last7Days,
        topReferrers,
      });
    } catch (error) {
      console.error('Failed to load share analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Referral Share Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-muted rounded-xl" />
            <div className="h-32 bg-muted rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!analytics) return null;
  
  const maxCount = Math.max(...analytics.byChannel.map(c => c.count), 1);
  const maxDayCount = Math.max(...analytics.last7Days.map(d => d.count), 1);
  
  // Prepare chart data for conversion rate
  const conversionChartData = analytics.byChannel.map(channel => {
    const config = CHANNEL_CONFIG[channel.channel] || { label: channel.channel, chartColor: '#888' };
    return {
      name: config.label,
      rate: Number(channel.conversionRate.toFixed(1)),
      shares: channel.count,
      conversions: channel.conversions,
      color: config.chartColor,
    };
  });
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Referral Share Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-bold">{analytics.totalShares}</p>
              <p className="text-sm text-muted-foreground">Total Shares</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-bold text-success">{analytics.totalConversions}</p>
              <p className="text-sm text-muted-foreground">Conversions</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-muted/50">
              <p className="text-3xl font-bold text-accent">{analytics.conversionRate.toFixed(1)}%</p>
              <p className="text-sm text-muted-foreground">Conv. Rate</p>
            </div>
          </div>
          
          {/* Conversion Rate Bar Chart */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Conversion-Rate pro Kanal
            </h4>
            {conversionChartData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Noch keine Share-Daten vorhanden
              </p>
            ) : (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={conversionChartData} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      tickFormatter={(v) => `${v}%`}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={100}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value}%`, 'Conversion-Rate']}
                      labelFormatter={(label) => label}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
                              <p className="font-semibold">{label}</p>
                              <p className="text-sm text-muted-foreground">
                                {data.conversions} von {data.shares} Shares
                              </p>
                              <p className="text-lg font-bold text-primary">{data.rate}%</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                      {conversionChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          
          {/* Channel Breakdown */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Shares nach Kanal
            </h4>
            <div className="space-y-3">
              {analytics.byChannel.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Noch keine Share-Daten vorhanden
                </p>
              ) : (
                analytics.byChannel.map(channel => {
                  const config = CHANNEL_CONFIG[channel.channel] || { 
                    label: channel.channel, 
                    icon: Share2, 
                    color: 'bg-muted' 
                  };
                  const Icon = config.icon;
                  const percentage = (channel.count / maxCount) * 100;
                  
                  return (
                    <div key={channel.channel} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className={cn('h-6 w-6 rounded-lg flex items-center justify-center', config.color)}>
                            <Icon className="h-3.5 w-3.5 text-white" />
                          </div>
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="tabular-nums font-semibold">{channel.count}</span>
                          {channel.conversions > 0 && (
                            <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                              {channel.conversions} Conv. ({channel.conversionRate.toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn('h-full rounded-full transition-all duration-500', config.color)}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          
          {/* Last 7 Days Chart */}
          <div>
            <h4 className="font-semibold mb-3">Letzte 7 Tage</h4>
            <div className="flex items-end gap-1 h-24">
              {analytics.last7Days.map((day, index) => {
                const height = maxDayCount > 0 ? (day.count / maxDayCount) * 100 : 0;
                const date = new Date(day.date);
                const dayName = date.toLocaleDateString('de-CH', { weekday: 'short' });
                
                return (
                  <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground tabular-nums">{day.count}</span>
                    <div 
                      className="w-full bg-primary/80 rounded-t-sm transition-all duration-300 min-h-[4px]"
                      style={{ height: `${Math.max(height, 5)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{dayName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Top Referrers Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Top Referrers
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.topReferrers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Noch keine Empfehlungen vorhanden
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.topReferrers.map((referrer, index) => (
                <div 
                  key={referrer.userId} 
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold text-sm">
                    {index + 1}
                  </div>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={referrer.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {referrer.displayName.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{referrer.displayName}</p>
                    <p className="text-xs text-muted-foreground">
                      {referrer.referralCount} Empfehlung{referrer.referralCount !== 1 ? 'en' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{referrer.totalBonus}</p>
                    <p className="text-xs text-muted-foreground">Taler verdient</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}