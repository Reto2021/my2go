import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, QrCode, Coins } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Redemption {
  id: string;
  redemption_code: string;
  status: 'pending' | 'used' | 'expired' | 'cancelled';
  taler_spent: number;
  created_at: string;
  expires_at: string;
  redeemed_at: string | null;
  reward: {
    id: string;
    title: string;
    description: string | null;
    image_url: string | null;
  } | null;
  partner: {
    id: string;
    name: string;
    logo_url: string | null;
  } | null;
}

const statusConfig = {
  pending: {
    label: 'Offen',
    description: 'Beim Partner vorzeigen',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/30',
  },
  used: {
    label: 'Verwendet',
    description: 'Erfolgreich eingelöst',
    icon: CheckCircle,
    className: 'bg-success/15 text-success border-success/30',
  },
  expired: {
    label: 'Abgelaufen',
    description: 'Gültigkeit überschritten',
    icon: AlertCircle,
    className: 'bg-muted text-muted-foreground border-border',
  },
  cancelled: {
    label: 'Storniert',
    description: 'Wurde zurückgezogen',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
  },
};

export default function MyRedemptionsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'used' | 'expired'>('all');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchRedemptions();
    }
  }, [user, authLoading, navigate]);

  const fetchRedemptions = async () => {
    try {
      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          id,
          redemption_code,
          status,
          taler_spent,
          created_at,
          expires_at,
          redeemed_at,
          reward:rewards(id, title, description, image_url),
          partner:partners(id, name, logo_url)
        `)
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRedemptions((data as unknown as Redemption[]) || []);
    } catch (error) {
      console.error('Error fetching redemptions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper to compute effective status for filtering
  const getEffectiveStatus = (r: Redemption) => {
    const isExpired = new Date(r.expires_at).getTime() < Date.now();
    return (r.status === 'pending' && isExpired) ? 'expired' : r.status;
  };

  const filteredRedemptions = redemptions.filter((r) => {
    if (filter === 'all') return true;
    return getEffectiveStatus(r) === filter;
  });

  const stats = {
    total: redemptions.length,
    pending: redemptions.filter((r) => getEffectiveStatus(r) === 'pending').length,
    used: redemptions.filter((r) => getEffectiveStatus(r) === 'used').length,
    totalSpent: redemptions.filter((r) => getEffectiveStatus(r) === 'used').reduce((sum, r) => sum + r.taler_spent, 0),
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="container pb-24">
      {/* Header */}
      <div className="py-6">
        <h1 className="text-2xl font-bold text-foreground">Meine Gutscheine</h1>
        <p className="text-muted-foreground mt-1">
          Aktivierte Gutscheine und deren Status
        </p>
      </div>

      {/* Info Box explaining the flow */}
      <Card className="mb-6 bg-muted/30 border-border/50">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            <strong className="text-foreground">So funktioniert's:</strong> Aktiviere einen Gutschein mit deinen Taler. 
            Zeige den Code beim Partner vor – nach Bestätigung wird er als <span className="text-success font-medium">verwendet</span> markiert.
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Aktiviert</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Offen</p>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.used}</p>
            <p className="text-xs text-muted-foreground">Verwendet</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Alle' },
          { key: 'pending', label: 'Offen' },
          { key: 'used', label: 'Verwendet' },
          { key: 'expired', label: 'Abgelaufen' },
        ].map((tab) => (
          <Button
            key={tab.key}
            variant={filter === tab.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(tab.key as typeof filter)}
            className={cn(
              'rounded-full whitespace-nowrap',
              filter === tab.key && 'bg-secondary text-secondary-foreground'
            )}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Redemptions List */}
      {filteredRedemptions.length === 0 ? (
        <EmptyState
          icon={Gift}
          title={filter === 'all' ? 'Noch keine Gutscheine aktiviert' : 'Keine Ergebnisse'}
          description={
            filter === 'all'
              ? 'Aktiviere deinen ersten Gutschein mit Taler und er erscheint hier.'
              : 'Keine Gutscheine mit diesem Status gefunden.'
          }
          action={
            filter === 'all'
              ? { label: 'Gutscheine entdecken', onClick: () => navigate('/rewards') }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredRedemptions.map((redemption) => {
            const expiresAt = new Date(redemption.expires_at);
            const isExpired = expiresAt.getTime() < Date.now();
            // Show as expired if expires_at has passed and status is still pending
            const effectiveStatus = (redemption.status === 'pending' && isExpired) ? 'expired' : redemption.status;
            const config = statusConfig[effectiveStatus];
            const StatusIcon = config.icon;
            const isPending = effectiveStatus === 'pending';
            const isExpiringSoon = isPending && expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

            return (
              <Card
                key={redemption.id}
                className={cn(
                  'card-interactive overflow-hidden',
                  isPending && 'border-accent/30'
                )}
                onClick={() => navigate(`/my-redemptions/${redemption.id}`)}
              >
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* Image/Logo */}
                    <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-muted">
                      {redemption.reward?.image_url ? (
                        <img
                          src={redemption.reward.image_url}
                          alt={redemption.reward.title}
                          className="w-full h-full object-cover"
                        />
                      ) : redemption.partner?.logo_url ? (
                        <img
                          src={redemption.partner.logo_url}
                          alt={redemption.partner.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Gift className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {redemption.reward?.title || 'Gutschein'}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {redemption.partner?.name}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>

                      {/* Status & Details */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className={cn('text-xs', config.className)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Badge>
                        
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <Coins className="h-3.5 w-3.5" />
                          {redemption.taler_spent}
                        </span>

                        {isPending && (
                          <span className={cn(
                            'text-xs',
                            isExpiringSoon ? 'text-destructive font-medium' : 'text-muted-foreground'
                          )}>
                            Gültig bis {format(expiresAt, 'dd.MM.yyyy', { locale: de })}
                          </span>
                        )}
                      </div>

                      {/* Redemption Code for pending */}
                      {isPending && (
                        <div className="mt-3 flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                          <QrCode className="w-4 h-4 text-secondary" />
                          <code className="text-sm font-mono font-semibold text-secondary">
                            {redemption.redemption_code}
                          </code>
                        </div>
                      )}

                      {/* Redeemed info */}
                      {redemption.status === 'used' && redemption.redeemed_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Verwendet am {format(new Date(redemption.redeemed_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Total Spent Footer */}
      {stats.totalSpent > 0 && (
        <div className="mt-8 p-4 bg-secondary/5 rounded-2xl border border-secondary/20">
        <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Insgesamt eingelöst</span>
            <span className="inline-flex items-center gap-1.5 text-lg font-bold text-secondary">
              <Coins className="h-5 w-5" />
              {stats.totalSpent} Taler
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
