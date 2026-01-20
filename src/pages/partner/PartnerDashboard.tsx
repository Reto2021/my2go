import { useEffect, useState, useMemo } from 'react';
import { 
  Gift, 
  QrCode, 
  CheckCircle, 
  Clock,
  Star,
  MessageSquare,
  Coins,
  TrendingUp,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Zap,
  Users,
  Info,
  Calendar
} from 'lucide-react';
import { TalerLoopVisual } from '@/components/taler/TalerLoopVisual';
import { usePartner } from '@/components/partner/PartnerGuard';
import { 
  getPartnerStats, 
  getPartnerRedemptions, 
  getPartnerDailyStats,
  getPartnerDetails,
  PartnerStats, 
  RedemptionWithDetails,
  DailyStats
} from '@/lib/partner-helpers';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Link, useLocation } from 'react-router-dom';
import { format, subDays } from 'date-fns';
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
} from 'recharts';
import { Button } from '@/components/ui/button';
import { PartnerOnboardingTutorial } from '@/components/partner/PartnerOnboardingTutorial';
import { QRScanAnalytics } from '@/components/partner/QRScanAnalytics';
import { LiveKPICard } from '@/components/partner/LiveKPICard';
import { DashboardPDFExport } from '@/components/partner/DashboardPDFExport';
import { useGHLSync } from '@/hooks/useGHLSync';
import { toast } from 'sonner';
import type { Partner } from '@/lib/supabase-helpers';

const ONBOARDING_KEY = 'partner_onboarding_seen';

export default function PartnerDashboard() {
  const { partnerInfo } = usePartner();
  const location = useLocation();
  const queryString = location.search;
  
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [previousStats, setPreviousStats] = useState<PartnerStats | null>(null);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<RedemptionWithDetails[]>([]);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<'7' | '14' | '30'>('14');
  
  const { createSubAccount, isLoading: ghlLoading } = useGHLSync();

  useEffect(() => {
    async function loadData() {
      if (!partnerInfo?.partnerId) return;
      
      const days = parseInt(selectedPeriod);
      
      try {
        const [statsData, redemptionsData, dailyData, partnerData] = await Promise.all([
          getPartnerStats(partnerInfo.partnerId),
          getPartnerRedemptions(partnerInfo.partnerId),
          getPartnerDailyStats(partnerInfo.partnerId, days),
          getPartnerDetails(partnerInfo.partnerId),
        ]);
        
        setStats(statsData);
        setRecentRedemptions(redemptionsData.slice(0, 5));
        setDailyStats(dailyData);
        setPartner(partnerData);

        // Calculate previous period stats for trend comparison
        // Use the daily stats to calculate the previous period totals
        if (dailyData.length >= days) {
          const currentPeriod = dailyData.slice(-days);
          const prevStart = dailyData.length >= days * 2 ? dailyData.slice(-days * 2, -days) : [];
          
          const currentRedemptions = currentPeriod.reduce((sum, d) => sum + d.redemptions, 0);
          const prevRedemptions = prevStart.reduce((sum, d) => sum + d.redemptions, 0);
          const currentTaler = currentPeriod.reduce((sum, d) => sum + d.taler, 0);
          const prevTaler = prevStart.reduce((sum, d) => sum + d.taler, 0);
          const currentReviews = currentPeriod.reduce((sum, d) => sum + d.reviews, 0);
          const prevReviews = prevStart.reduce((sum, d) => sum + d.reviews, 0);
          
          setPreviousStats({
            ...statsData,
            totalRedemptions: prevRedemptions,
            totalTalerRedeemed: prevTaler,
            totalReviews: prevReviews,
            pendingRedemptions: 0,
            completedRedemptions: prevRedemptions,
          });
        }

        // Check if onboarding should be shown
        const onboardingSeen = localStorage.getItem(`${ONBOARDING_KEY}_${partnerInfo.partnerId}`);
        if (!onboardingSeen) {
          setShowOnboarding(true);
        }

        // Auto-create GHL sub-account if not exists
        if (partnerData && !partnerData.ghl_location_id && partnerData.contact_email) {
          console.log('Auto-creating GHL sub-account for partner');
          createSubAccount({
            partnerId: partnerData.id,
            partnerName: partnerData.name,
            email: partnerData.contact_email,
            phone: partnerData.contact_phone || undefined,
            address: partnerData.address_street ? `${partnerData.address_street} ${partnerData.address_number || ''}`.trim() : undefined,
            city: partnerData.city || undefined,
            postalCode: partnerData.postal_code || undefined,
            website: partnerData.website || undefined,
            country: partnerData.country || 'CH',
          }).then(result => {
            if (result.success) {
              toast.success('GoHighLevel Sub-Account wurde erstellt!');
            }
          });
        }
      } catch (error) {
        console.error('Error loading partner data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, [partnerInfo?.partnerId, selectedPeriod]);
  
  // Calculate trend data for KPIs
  const trendData = useMemo(() => {
    if (!dailyStats.length) return null;
    
    const days = parseInt(selectedPeriod);
    const currentPeriod = dailyStats.slice(-days);
    const currentRedemptions = currentPeriod.reduce((sum, d) => sum + d.redemptions, 0);
    const currentTaler = currentPeriod.reduce((sum, d) => sum + d.taler, 0);
    const currentReviews = currentPeriod.reduce((sum, d) => sum + d.reviews, 0);
    
    return {
      redemptions: currentRedemptions,
      taler: currentTaler,
      reviews: currentReviews,
      prevRedemptions: previousStats?.totalRedemptions || 0,
      prevTaler: previousStats?.totalTalerRedeemed || 0,
      prevReviews: previousStats?.totalReviews || 0,
    };
  }, [dailyStats, selectedPeriod, previousStats]);

  const handleOnboardingComplete = () => {
    if (partnerInfo?.partnerId) {
      localStorage.setItem(`${ONBOARDING_KEY}_${partnerInfo.partnerId}`, 'true');
    }
    setShowOnboarding(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const periodLabel = selectedPeriod === '7' ? 'Letzte 7 Tage' 
    : selectedPeriod === '14' ? 'Letzte 14 Tage' 
    : 'Letzte 30 Tage';

  // Format chart data for display
  const chartData = dailyStats.map(d => ({
    ...d,
    dateLabel: format(new Date(d.date), 'dd.MM', { locale: de }),
  }));

  return (
    <>
      <PartnerOnboardingTutorial 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)}
        onComplete={handleOnboardingComplete}
      />
      
      <div className="space-y-6 animate-in">
        {/* Hero Welcome Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-accent p-6 text-primary-foreground">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iNCIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
          <div className="relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-5 w-5" />
                  <span className="text-sm font-medium opacity-90">Partner Portal</span>
                </div>
                <h1 className="text-2xl font-bold mb-1">
                  Hallo, {partnerInfo?.partnerName || 'Partner'}!
                </h1>
                <p className="text-sm opacity-80">
                  Hier ist dein Überblick für heute.
                </p>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                className="bg-white/20 hover:bg-white/30 text-white border-0"
                onClick={() => setShowOnboarding(true)}
              >
                <HelpCircle className="h-4 w-4 mr-1" />
                Tutorial
              </Button>
            </div>
            
            {/* Quick summary */}
            <div className="mt-4 flex gap-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Gift className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-bold">{stats?.activeRewards || 0}</p>
                  <p className="text-xs opacity-80">Aktive Rewards</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
                  <Users className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-lg font-bold">{stats?.totalRedemptions || 0}</p>
                  <p className="text-xs opacity-80">Einlösungen gesamt</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Period Selector & Export */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted/50">
            {(['7', '14', '30'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                  selectedPeriod === period 
                    ? 'bg-background shadow-sm text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {period}d
              </button>
            ))}
          </div>
          
          {stats && (
            <DashboardPDFExport
              partnerName={partnerInfo?.partnerName || 'Partner'}
              stats={stats}
              dailyStats={dailyStats}
              periodLabel={periodLabel}
            />
          )}
        </div>

        {/* Live KPI Cards - 2x2 Grid */}
        <div className="grid grid-cols-2 gap-3">
          <LiveKPICard
            title="Wartend"
            value={stats?.pendingRedemptions || 0}
            subtitle="Noch nicht abgeholt"
            icon={Clock}
            color="warning"
          />
          <LiveKPICard
            title="Bestätigt"
            value={stats?.completedRedemptions || 0}
            subtitle="Erfolgreich eingelöst"
            icon={CheckCircle}
            color="success"
            trend={trendData ? {
              current: trendData.redemptions,
              previous: trendData.prevRedemptions,
              label: 'Vorperiode',
            } : undefined}
          />
          <LiveKPICard
            title="Feedback"
            value={stats?.totalReviews || 0}
            subtitle="In-App Bewertungen"
            icon={MessageSquare}
            color="primary"
            trend={trendData ? {
              current: trendData.reviews,
              previous: trendData.prevReviews,
              label: 'Vorperiode',
            } : undefined}
          />
          <LiveKPICard
            title="Taler"
            value={stats?.totalTalerRedeemed || 0}
            subtitle="Gesamt eingelöst"
            icon={Coins}
            color="accent"
            trend={trendData ? {
              current: trendData.taler,
              previous: trendData.prevTaler,
              label: 'Vorperiode',
            } : undefined}
          />
        </div>

        {/* Rating Overview - Premium Card */}
        {stats && stats.totalReviews > 0 && (
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-warning/20 to-accent/20 flex items-center justify-center">
                  <Star className="h-7 w-7 text-warning fill-warning" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold">
                      {stats.avgRating?.toFixed(1) || '-'}
                    </span>
                    <span className="text-sm text-muted-foreground">/ 5</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-success font-semibold">
                      {Math.round((stats.positiveReviews / stats.totalReviews) * 100)}%
                    </span>
                    <span className="text-muted-foreground">positiv</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">{stats.totalReviews} Bewertungen</span>
                  </div>
                </div>
              </div>
              <Link 
                to={`/partner-portal/reviews${queryString}`}
                className="text-sm text-primary font-medium flex items-center gap-1 hover:underline"
              >
                Details <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions - Enhanced */}
        <div className="grid grid-cols-2 gap-3">
          {partnerInfo?.canConfirmRedemptions && (
            <Link 
              to={`/partner-portal/redemptions${queryString}`}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:border-primary/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <QrCode className="h-6 w-6 text-primary" />
                </div>
                <p className="font-semibold">Einlösungen</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.pendingRedemptions || 0} offen
                </p>
                {(stats?.pendingRedemptions || 0) > 0 && (
                  <div className="absolute top-2 right-2 h-3 w-3 rounded-full bg-warning animate-pulse" />
                )}
              </div>
            </Link>
          )}
          
          {partnerInfo?.canManageRewards && (
            <Link 
              to={`/partner-portal/rewards${queryString}`}
              className="group relative overflow-hidden rounded-xl border bg-card p-5 transition-all hover:shadow-lg hover:border-accent/30"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Gift className="h-6 w-6 text-accent" />
                </div>
                <p className="font-semibold">Rewards</p>
                <p className="text-sm text-muted-foreground">
                  {stats?.activeRewards || 0} aktiv
                </p>
              </div>
            </Link>
          )}
        </div>

        {/* Activity Chart - Enhanced */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Aktivität</h3>
                <p className="text-xs text-muted-foreground">Letzte 14 Tage</p>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                width={28} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar 
                dataKey="redemptions" 
                name="Einlösungen" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Taler Chart - Enhanced */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <Coins className="h-4 w-4 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Taler-Umsatz</h3>
              <p className="text-xs text-muted-foreground">Eingelöste Taler pro Tag</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis 
                dataKey="dateLabel" 
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 10 }} 
                width={32} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '12px',
                  fontSize: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
                formatter={(value) => [`${value} Taler`, 'Eingelöst']}
              />
              <defs>
                <linearGradient id="talerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="taler" 
                stroke="hsl(var(--accent))" 
                strokeWidth={2}
                fill="url(#talerGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Taler System Explainer for Partners */}
        <div className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold">So funktioniert's für Ihre Kunden</h3>
              <p className="text-xs text-muted-foreground">Erklären Sie den Taler-Kreislauf</p>
            </div>
          </div>
          <TalerLoopVisual variant="expanded" showValues />
          <p className="text-xs text-muted-foreground text-center mt-4">
            Hör Radio. Sammle Taler. Geniess vor Ort.
          </p>
        </div>

        {/* QR Scan Analytics */}
        {partnerInfo?.partnerId && (
          <QRScanAnalytics partnerId={partnerInfo.partnerId} />
        )}
        {partnerInfo?.canConfirmRedemptions && recentRedemptions.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
            <div className="flex items-center justify-between p-5 pb-3 border-b">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-success" />
                </div>
                <h3 className="font-semibold">Letzte Einlösungen</h3>
              </div>
              <Link 
                to={`/partner-portal/redemptions${queryString}`}
                className="text-sm text-primary font-medium hover:underline"
              >
                Alle anzeigen
              </Link>
            </div>
            
            <div className="divide-y divide-border">
              {recentRedemptions.map((redemption) => (
                <div 
                  key={redemption.id} 
                  className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0',
                      redemption.status === 'pending' ? 'bg-warning/15' :
                      redemption.status === 'used' ? 'bg-success/15' : 'bg-muted'
                    )}>
                      <Gift className={cn(
                        'h-5 w-5',
                        redemption.status === 'pending' ? 'text-warning' :
                        redemption.status === 'used' ? 'text-success' : 'text-muted-foreground'
                      )} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">
                        {redemption.reward?.title || 'Reward'}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {redemption.user?.display_name || redemption.user?.email || 'Nutzer'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <span className={cn(
                      'inline-block px-2.5 py-1 rounded-full text-xs font-semibold',
                      redemption.status === 'pending' ? 'bg-warning/15 text-warning' :
                      redemption.status === 'used' ? 'bg-success/15 text-success' :
                      'bg-muted text-muted-foreground'
                    )}>
                      {redemption.status === 'pending' ? 'Offen' :
                       redemption.status === 'used' ? 'Eingelöst' :
                       redemption.status === 'expired' ? 'Abgelaufen' : 'Storniert'}
                    </span>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(redemption.created_at), 'dd.MM HH:mm', { locale: de })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GHL Status Badge */}
        {partner?.ghl_location_id && (
          <div className="rounded-xl border border-success/20 bg-success/5 p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="font-semibold text-success">GoHighLevel verbunden</p>
                <p className="text-sm text-muted-foreground">
                  Sub-Account synchronisiert
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
