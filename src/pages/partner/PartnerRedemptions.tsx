import { useEffect, useState } from 'react';
import { 
  QrCode, 
  CheckCircle, 
  XCircle,
  Clock,
  Gift,
  User,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePartner } from '@/components/partner/PartnerGuard';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getPartnerRedemptions, 
  confirmRedemption, 
  cancelRedemption,
  RedemptionWithDetails 
} from '@/lib/partner-helpers';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function PartnerRedemptions() {
  const { partnerInfo } = usePartner();
  const { user } = useAuth();
  const [redemptions, setRedemptions] = useState<RedemptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadRedemptions();
  }, [partnerInfo?.partnerId, statusFilter]);

  async function loadRedemptions() {
    if (!partnerInfo?.partnerId) return;
    
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter as 'pending' | 'used' | 'expired' | 'cancelled';
      const data = await getPartnerRedemptions(partnerInfo.partnerId, status);
      setRedemptions(data);
    } catch (error) {
      console.error('Error loading redemptions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(redemptionId: string) {
    if (!user) return;
    
    setProcessingId(redemptionId);
    const { success, error } = await confirmRedemption(redemptionId, user.id);
    setProcessingId(null);
    
    if (success) {
      toast.success('Einlösung bestätigt');
      loadRedemptions();
    } else {
      toast.error('Fehler: ' + error);
    }
  }

  async function handleCancel(redemptionId: string) {
    if (!confirm('Einlösung wirklich stornieren?')) return;
    
    setProcessingId(redemptionId);
    const { success, error } = await cancelRedemption(redemptionId);
    setProcessingId(null);
    
    if (success) {
      toast.success('Einlösung storniert');
      loadRedemptions();
    } else {
      toast.error('Fehler: ' + error);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="gap-1"><Clock className="h-3 w-3" /> Offen</Badge>;
      case 'used':
        return <Badge variant="default" className="gap-1 bg-green-600"><CheckCircle className="h-3 w-3" /> Eingelöst</Badge>;
      case 'expired':
        return <Badge variant="destructive" className="gap-1">Abgelaufen</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="gap-1">Storniert</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const pendingCount = redemptions.filter(r => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Einlösungen</h1>
          <p className="text-muted-foreground">
            {pendingCount > 0 
              ? `${pendingCount} offene Einlösungen warten auf Bestätigung`
              : 'Keine offenen Einlösungen'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="pending">Offen</SelectItem>
              <SelectItem value="used">Eingelöst</SelectItem>
              <SelectItem value="expired">Abgelaufen</SelectItem>
              <SelectItem value="cancelled">Storniert</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Redemptions List */}
      {redemptions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <QrCode className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">Keine Einlösungen</h3>
            <p className="text-muted-foreground">
              {statusFilter === 'all' 
                ? 'Es gibt noch keine Einlösungen für deine Rewards.'
                : `Keine Einlösungen mit Status "${statusFilter}" gefunden.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {redemptions.map((redemption) => (
            <Card key={redemption.id} className={redemption.status === 'pending' ? 'border-yellow-300 bg-yellow-50/50' : ''}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 flex-shrink-0">
                      <Gift className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold truncate">
                          {redemption.reward?.title || 'Unbekannter Reward'}
                        </h3>
                        {getStatusBadge(redemption.status)}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {redemption.user?.display_name || redemption.user?.email || 'Unbekannt'}
                        </span>
                        <span>
                          Code: <strong>{redemption.redemption_code}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Erstellt: {format(new Date(redemption.created_at), 'dd.MM.yyyy HH:mm', { locale: de })}
                        {redemption.status === 'pending' && (
                          <> • Läuft ab {formatDistanceToNow(new Date(redemption.expires_at), { locale: de, addSuffix: true })}</>
                        )}
                        {redemption.status === 'used' && redemption.redeemed_at && (
                          <> • Eingelöst: {format(new Date(redemption.redeemed_at), 'dd.MM.yyyy HH:mm', { locale: de })}</>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {redemption.status === 'pending' && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        onClick={() => handleConfirm(redemption.id)}
                        disabled={processingId === redemption.id}
                        className="gap-1"
                      >
                        {processingId === redemption.id ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Bestätigen
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCancel(redemption.id)}
                        disabled={processingId === redemption.id}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-lg">{redemption.taler_spent}</p>
                    <p className="text-xs text-muted-foreground">Taler</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
