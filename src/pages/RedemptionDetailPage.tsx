import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Gift, 
  Store, 
  Calendar,
  MapPin,
  Phone,
  ExternalLink
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { format, formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import talerCoin from '@/assets/taler-coin.png';

interface RedemptionDetail {
  id: string;
  redemption_code: string;
  qr_payload: string | null;
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
    terms: string | null;
    reward_type: string;
    value_amount: number | null;
    value_percent: number | null;
  } | null;
  partner: {
    id: string;
    name: string;
    logo_url: string | null;
    address_street: string | null;
    address_number: string | null;
    city: string | null;
    postal_code: string | null;
    phone: string | null;
    website: string | null;
  } | null;
}

const statusConfig = {
  pending: {
    label: 'Aktiv',
    description: 'Zeige diesen QR-Code beim Partner vor',
    icon: Clock,
    className: 'bg-accent/15 text-accent border-accent/30',
    bgClass: 'bg-accent/5',
  },
  used: {
    label: 'Eingelöst',
    description: 'Dieser Gutschein wurde erfolgreich eingelöst',
    icon: CheckCircle,
    className: 'bg-success/15 text-success border-success/30',
    bgClass: 'bg-success/5',
  },
  expired: {
    label: 'Abgelaufen',
    description: 'Die Gültigkeitsdauer ist abgelaufen',
    icon: AlertCircle,
    className: 'bg-muted text-muted-foreground border-border',
    bgClass: 'bg-muted/50',
  },
  cancelled: {
    label: 'Storniert',
    description: 'Dieser Gutschein wurde storniert',
    icon: XCircle,
    className: 'bg-destructive/15 text-destructive border-destructive/30',
    bgClass: 'bg-destructive/5',
  },
};

export default function RedemptionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [redemption, setRedemption] = useState<RedemptionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user && id) {
      fetchRedemption();
    }
  }, [user, authLoading, id, navigate]);

  const fetchRedemption = async () => {
    try {
      const { data, error } = await supabase
        .from('redemptions')
        .select(`
          id,
          redemption_code,
          qr_payload,
          status,
          taler_spent,
          created_at,
          expires_at,
          redeemed_at,
          reward:rewards(
            id, 
            title, 
            description, 
            image_url, 
            terms, 
            reward_type,
            value_amount,
            value_percent
          ),
          partner:partners(
            id, 
            name, 
            logo_url, 
            address_street, 
            address_number, 
            city, 
            postal_code, 
            phone,
            website
          )
        `)
        .eq('id', id)
        .eq('user_id', user!.id)
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        setError('Einlösung nicht gefunden');
        return;
      }
      
      setRedemption(data as unknown as RedemptionDetail);
    } catch (err) {
      console.error('Error fetching redemption:', err);
      setError('Fehler beim Laden der Einlösung');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !redemption) {
    return (
      <div className="container pb-24">
        <header className="py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Einlösung</h1>
        </header>
        <div className="text-center py-12">
          <p className="text-muted-foreground">{error || 'Nicht gefunden'}</p>
          <Button onClick={() => navigate('/my-redemptions')} className="mt-4">
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    );
  }

  const config = statusConfig[redemption.status];
  const StatusIcon = config.icon;
  const isPending = redemption.status === 'pending';
  const expiresAt = new Date(redemption.expires_at);
  const isExpiringSoon = isPending && expiresAt.getTime() - Date.now() < 24 * 60 * 60 * 1000;

  const partnerAddress = [
    redemption.partner?.address_street,
    redemption.partner?.address_number,
  ].filter(Boolean).join(' ');
  
  const partnerLocation = [
    redemption.partner?.postal_code,
    redemption.partner?.city,
  ].filter(Boolean).join(' ');

  const qrValue = redemption.qr_payload || redemption.redemption_code;

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border/50">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Gutschein-Details</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* Status Banner */}
        <div className={cn('rounded-2xl p-4', config.bgClass)}>
          <div className="flex items-center gap-3">
            <div className={cn('p-2 rounded-xl', config.className)}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold">{config.label}</p>
              <p className="text-sm text-muted-foreground">{config.description}</p>
            </div>
          </div>
        </div>

        {/* QR Code Section - Only for pending */}
        {isPending && (
          <Card className="overflow-hidden border-2 border-accent/30">
            <CardContent className="p-6">
              <div className="flex flex-col items-center">
                <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                  <QRCodeSVG 
                    value={qrValue} 
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">Einlösecode</p>
                <code className="text-2xl font-mono font-bold text-secondary tracking-wider">
                  {redemption.redemption_code}
                </code>
                
                {isExpiringSoon && (
                  <div className="mt-4 flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      Läuft in {formatDistanceToNow(expiresAt, { locale: de })} ab!
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reward Info */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              {redemption.reward?.image_url ? (
                <div className="flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden bg-muted">
                  <img
                    src={redemption.reward.image_url}
                    alt={redemption.reward.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Gift className="w-8 h-8 text-secondary" />
                </div>
              )}
              
              <div className="flex-1">
                <h2 className="font-bold text-lg text-foreground">
                  {redemption.reward?.title || 'Gutschein'}
                </h2>
                {redemption.reward?.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {redemption.reward.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <img src={talerCoin} alt="Taler" className="w-4 h-4" />
                  <span className="text-sm font-semibold text-secondary">
                    {redemption.taler_spent} Taler
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Partner Info */}
        {redemption.partner && (
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Store className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-semibold">Einlösbar bei</h3>
              </div>
              
              <div className="flex gap-4">
                {redemption.partner.logo_url ? (
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-muted">
                    <img
                      src={redemption.partner.logo_url}
                      alt={redemption.partner.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-muted flex items-center justify-center">
                    <Store className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 space-y-2">
                  <p className="font-semibold">{redemption.partner.name}</p>
                  
                  {(partnerAddress || partnerLocation) && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div>
                        {partnerAddress && <p>{partnerAddress}</p>}
                        {partnerLocation && <p>{partnerLocation}</p>}
                      </div>
                    </div>
                  )}
                  
                  {redemption.partner.phone && (
                    <a 
                      href={`tel:${redemption.partner.phone}`}
                      className="flex items-center gap-2 text-sm text-secondary hover:underline"
                    >
                      <Phone className="w-4 h-4" />
                      {redemption.partner.phone}
                    </a>
                  )}
                  
                  {redemption.partner.website && (
                    <a 
                      href={redemption.partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-secondary hover:underline"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Website besuchen
                    </a>
                  )}
                </div>
              </div>
              
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate(`/partner/${redemption.partner?.id}`)}
              >
                Partner-Seite öffnen
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Timeline / Details */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Zeitverlauf</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Eingelöst am</span>
                <span className="text-sm font-medium">
                  {format(new Date(redemption.created_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Gültig bis</span>
                <span className={cn(
                  'text-sm font-medium',
                  isExpiringSoon && 'text-destructive'
                )}>
                  {format(expiresAt, 'dd.MM.yyyy, HH:mm', { locale: de })}
                </span>
              </div>
              
              {redemption.status === 'used' && redemption.redeemed_at && (
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-sm text-muted-foreground">Beim Partner eingelöst</span>
                  <span className="text-sm font-medium text-success">
                    {format(new Date(redemption.redeemed_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        {redemption.reward?.terms && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Bedingungen</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {redemption.reward.terms}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Back Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => navigate('/my-redemptions')}
        >
          Zurück zur Übersicht
        </Button>
      </div>
    </div>
  );
}
