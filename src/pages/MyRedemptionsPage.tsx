import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, Clock, CheckCircle, XCircle, AlertCircle, ChevronRight, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import talerCoin from '@/assets/taler-coin.png';

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
    label: 'Aktiv',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/30',
  },
  used: {
    label: 'Eingelöst',
    icon: CheckCircle,
    className: 'bg-success/15 text-success border-success/30',
  },
  expired: {
    label: 'Abgelaufen',
    icon: AlertCircle,
    className: 'bg-muted text-muted-foreground border-border',
  },
  cancelled: {
    label: 'Storniert',
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

  const filteredRedemptions = redemptions.filter((r) => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  const stats = {
    total: redemptions.length,
    pending: redemptions.filter((r) => r.status === 'pending').length,
    used: redemptions.filter((r) => r.status === 'used').length,
    totalSpent: redemptions.filter((r) => r.status === 'used').reduce((sum, r) => sum + r.taler_spent, 0),
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
        <h1 className="text-2xl font-bold text-foreground">Meine Einlösungen</h1>
        <p className="text-muted-foreground mt-1">
          Übersicht deiner eingelösten Gutscheine
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="bg-card border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            <p className="text-xs text-muted-foreground">Gesamt</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/10 border-accent/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{stats.pending}</p>
            <p className="text-xs text-muted-foreground">Aktiv</p>
          </CardContent>
        </Card>
        <Card className="bg-success/10 border-success/30">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-success">{stats.used}</p>
            <p className="text-xs text-muted-foreground">Eingelöst</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'Alle' },
          { key: 'pending', label: 'Aktiv' },
          { key: 'used', label: 'Eingelöst' },
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
          title={filter === 'all' ? 'Noch keine Einlösungen' : 'Keine Ergebnisse'}
          description={
            filter === 'all'
              ? 'Löse deinen ersten Gutschein ein und er erscheint hier.'
              : 'Keine Einlösungen mit diesem Status gefunden.'
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
            const config = statusConfig[redemption.status];
            const StatusIcon = config.icon;
            const isPending = redemption.status === 'pending';
            const expiresAt = new Date(redemption.expires_at);
            const isExpiringSoon = isPending && expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

            return (
              <Card
                key={redemption.id}
                className={cn(
                  'card-interactive overflow-hidden',
                  isPending && 'border-accent/30'
                )}
                onClick={() => navigate(`/rewards/${redemption.reward?.id}`)}
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
                        
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <img src={talerCoin} alt="Taler" className="w-3.5 h-3.5" />
                          <span>{redemption.taler_spent}</span>
                        </div>

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
                          Eingelöst am {format(new Date(redemption.redeemed_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
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
            <div className="flex items-center gap-2">
              <img src={talerCoin} alt="Taler" className="w-5 h-5" />
              <span className="text-lg font-bold text-secondary">{stats.totalSpent} Taler</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
