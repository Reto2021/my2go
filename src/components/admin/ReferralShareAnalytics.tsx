import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Send, Mail, Copy, Share2, TrendingUp, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChannelStats {
  channel: string;
  count: number;
  conversions: number;
}

interface ShareAnalytics {
  totalShares: number;
  totalConversions: number;
  conversionRate: number;
  byChannel: ChannelStats[];
  last7Days: { date: string; count: number }[];
}

const CHANNEL_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  whatsapp: { label: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]' },
  telegram: { label: 'Telegram', icon: Send, color: 'bg-[#0088cc]' },
  email: { label: 'Email', icon: Mail, color: 'bg-muted-foreground' },
  copy: { label: 'Link kopiert', icon: Copy, color: 'bg-primary' },
  native: { label: 'Native Share', icon: Share2, color: 'bg-accent' },
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
        }))
        .sort((a, b) => b.count - a.count);
      
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
      
      const totalShares = shares?.length || 0;
      const totalConversions = totalReferrals || 0;
      
      setAnalytics({
        totalShares,
        totalConversions,
        conversionRate: totalShares > 0 ? (totalConversions / totalShares) * 100 : 0,
        byChannel,
        last7Days,
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
  
  return (
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
        
        {/* Channel Breakdown */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Nach Kanal
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
                            {channel.conversions} Conv.
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
  );
}
