import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { 
  QrCode, 
  CreditCard, 
  Sticker, 
  FileText, 
  TrendingUp,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface QRScanAnalyticsProps {
  partnerId: string;
  className?: string;
}

interface ScanData {
  id: string;
  partner_id: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  scanned_at: string;
}

const CAMPAIGN_LABELS: Record<string, { label: string; icon: typeof QrCode; color: string }> = {
  'qr-card': { label: 'QR-Karte', icon: CreditCard, color: 'hsl(var(--primary))' },
  'sticker': { label: 'Aufkleber', icon: Sticker, color: 'hsl(var(--accent))' },
  'table-card': { label: 'Tischkarte', icon: FileText, color: 'hsl(var(--success))' },
  'other': { label: 'Sonstige', icon: ExternalLink, color: 'hsl(var(--muted-foreground))' },
};

export function QRScanAnalytics({ partnerId, className }: QRScanAnalyticsProps) {
  const { data: scans, isLoading } = useQuery({
    queryKey: ['qr-scans', partnerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('qr_scans')
        .select('*')
        .eq('partner_id', partnerId)
        .order('scanned_at', { ascending: false });

      if (error) throw error;
      return data as ScanData[];
    },
    enabled: !!partnerId,
  });

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="flex justify-center py-12">
          <LoadingSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!scans || scans.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            QR-Scan Analytics
          </CardTitle>
          <CardDescription>
            Verfolge, wie oft deine POS-Materialien gescannt werden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <QrCode className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Noch keine Scans</p>
            <p className="text-sm mt-1">
              Sobald Kunden deine QR-Codes scannen, siehst du hier die Statistiken.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate stats by campaign type
  const campaignStats = scans.reduce((acc, scan) => {
    const campaign = scan.utm_campaign || 'other';
    acc[campaign] = (acc[campaign] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Prepare pie chart data
  const pieData = Object.entries(campaignStats).map(([campaign, count]) => ({
    name: CAMPAIGN_LABELS[campaign]?.label || campaign,
    value: count,
    color: CAMPAIGN_LABELS[campaign]?.color || CAMPAIGN_LABELS.other.color,
  }));

  // Calculate daily scans for the last 14 days
  const last14Days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(new Date(), 13 - i);
    return {
      date: format(date, 'yyyy-MM-dd'),
      dateLabel: format(date, 'dd.MM', { locale: de }),
      scans: 0,
    };
  });

  scans.forEach(scan => {
    const scanDate = format(new Date(scan.scanned_at), 'yyyy-MM-dd');
    const dayData = last14Days.find(d => d.date === scanDate);
    if (dayData) {
      dayData.scans++;
    }
  });

  // Calculate total and today's scans
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayScans = scans.filter(s => format(new Date(s.scanned_at), 'yyyy-MM-dd') === today).length;
  const totalScans = scans.length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5 text-primary" />
          QR-Scan Analytics
        </CardTitle>
        <CardDescription>
          Verfolge, wie oft deine POS-Materialien gescannt werden
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 p-4 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium">Gesamt</span>
            </div>
            <p className="text-2xl font-bold">{totalScans}</p>
            <p className="text-xs text-muted-foreground">Scans</p>
          </div>
          <div className="rounded-xl bg-gradient-to-br from-success/10 to-success/5 p-4 border border-success/20">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground font-medium">Heute</span>
            </div>
            <p className="text-2xl font-bold">{todayScans}</p>
            <p className="text-xs text-muted-foreground">Scans</p>
          </div>
        </div>

        {/* Scans by Material Type */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Nach Material-Typ</h4>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(CAMPAIGN_LABELS).slice(0, 3).map(([key, { label, icon: Icon, color }]) => {
              const count = campaignStats[key] || 0;
              return (
                <div 
                  key={key}
                  className="rounded-lg border p-3 text-center"
                  style={{ borderColor: `${color}30` }}
                >
                  <Icon className="h-5 w-5 mx-auto mb-1" style={{ color }} />
                  <p className="text-lg font-bold">{count}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{label}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Daily Trend Chart */}
        <div>
          <h4 className="text-sm font-semibold mb-3">Letzte 14 Tage</h4>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={last14Days}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 9 }}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 9 }} 
                width={24} 
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value) => [`${value} Scans`, 'Scans']}
              />
              <Bar 
                dataKey="scans" 
                name="Scans" 
                fill="hsl(var(--primary))" 
                radius={[3, 3, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribution Pie Chart */}
        {pieData.length > 1 && (
          <div>
            <h4 className="text-sm font-semibold mb-3">Verteilung</h4>
            <div className="flex items-center gap-4">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={25}
                    outerRadius={45}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-1">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="h-2.5 w-2.5 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
