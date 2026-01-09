import { useEffect, useState } from 'react';
import { 
  Gift, 
  QrCode, 
  CheckCircle, 
  Clock,
  TrendingUp,
  Coins
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePartner } from '@/components/partner/PartnerGuard';
import { getPartnerStats, getPartnerRedemptions, PartnerStats, RedemptionWithDetails } from '@/lib/partner-helpers';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PartnerDashboard() {
  const { partnerInfo } = usePartner();
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const [recentRedemptions, setRecentRedemptions] = useState<RedemptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!partnerInfo?.partnerId) return;
      
      try {
        const [statsData, redemptionsData] = await Promise.all([
          getPartnerStats(partnerInfo.partnerId),
          getPartnerRedemptions(partnerInfo.partnerId),
        ]);
        
        setStats(statsData);
        setRecentRedemptions(redemptionsData.slice(0, 5));
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
      title: 'Aktive Rewards',
      value: stats?.activeRewards || 0,
      icon: Gift,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Taler eingelöst',
      value: stats?.totalTalerRedeemed || 0,
      icon: Coins,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

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
