import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  getRewardById, 
  redeemRewardById, 
  getRedemptionStatus,
  Reward,
  RewardRedemptionResult,
  RedemptionStatus 
} from '@/lib/api';
import { useSession, useBrowseMode } from '@/lib/session';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Coffee, 
  Ticket, 
  Gift, 
  Star, 
  MapPin, 
  Wallet,
  Clock,
  QrCode,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

const categoryIcons = {
  experience: Star,
  discount: Ticket,
  product: Gift,
  exclusive: Coffee,
};

const categoryLabels = {
  experience: 'Erlebnis',
  discount: 'Rabatt',
  product: 'Produkt',
  exclusive: 'Exklusiv',
};

// RAILGUARD: Redemption expires after 10 minutes
const REDEMPTION_EXPIRY_MINUTES = 10;

export default function RewardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, balance, refreshBalance } = useSession();
  const isBrowseMode = useBrowseMode();
  
  const [reward, setReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemption, setRedemption] = useState<RewardRedemptionResult | null>(null);
  const [redemptionStatus, setRedemptionStatus] = useState<RedemptionStatus | null>(null);
  const [redemptionError, setRedemptionError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  
  const loadReward = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(false);
    try {
      const data = await getRewardById(id);
      setReward(data);
    } catch (err) {
      console.error('Failed to load reward:', err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  useEffect(() => {
    loadReward();
  }, [id]);
  
  // RAILGUARD: Countdown timer for redemption expiry
  useEffect(() => {
    if (!redemption?.expiresAt) return;
    
    const updateTimer = () => {
      const expiresAt = new Date(redemption.expiresAt).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0) {
        // Redemption expired - refresh status from server
        pollRedemptionStatus();
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [redemption?.expiresAt]);
  
  // RAILGUARD: Poll redemption status from server (only source of truth)
  const pollRedemptionStatus = useCallback(async () => {
    if (!token || !redemption?.redemptionId) return;
    
    setIsPolling(true);
    try {
      const status = await getRedemptionStatus(token, redemption.redemptionId);
      setRedemptionStatus(status);
      
      // Refresh balance after status check (server is source of truth)
      if (status.status === 'used') {
        refreshBalance();
      }
    } catch (err) {
      console.error('Failed to poll redemption status:', err);
    } finally {
      setIsPolling(false);
    }
  }, [token, redemption?.redemptionId, refreshBalance]);
  
  // RAILGUARD: Points deduction NEVER in client
  // Only call server endpoint which handles all balance changes
  const handleRedeem = async () => {
    if (!token || !reward) return;
    
    setIsRedeeming(true);
    setRedemptionError(null);
    
    try {
      // Server handles: validation, points deduction, code generation
      const result = await redeemRewardById(token, reward.id);
      setRedemption(result);
      
      // Refresh balance from server (source of truth)
      refreshBalance();
    } catch (err) {
      console.error('Redemption failed:', err);
      setRedemptionError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
    } finally {
      setIsRedeeming(false);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleClose = () => {
    setRedemption(null);
    setRedemptionStatus(null);
    setRedemptionError(null);
    setTimeRemaining(null);
    navigate('/rewards');
  };
  
  if (isLoading) {
    return <PageLoader />;
  }
  
  if (error || !reward) {
    return (
      <div className="min-h-screen pb-24">
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
          <div className="container py-4 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="btn-ghost p-2">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">Reward</h1>
          </div>
        </header>
        <div className="container py-8">
          <ErrorState title="Reward nicht gefunden" onRetry={loadReward} />
        </div>
      </div>
    );
  }
  
  const Icon = categoryIcons[reward.category] || Gift;
  const canAfford = balance && balance.current >= reward.cost;
  const isExpired = timeRemaining !== null && timeRemaining === 0;
  const statusUsed = redemptionStatus?.status === 'used';
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold truncate">Reward Details</h1>
        </div>
      </header>
      
      {/* Content */}
      <div className="container py-6">
        {/* Redemption Overlay */}
        {(redemption || redemptionError) && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card-base p-6 max-w-sm w-full text-center animate-in shadow-strong">
              
              {/* Error State */}
              {redemptionError && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-destructive/10">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <h2 className="text-xl font-bold mb-2">Fehler</h2>
                  <p className="text-muted-foreground mb-4">{redemptionError}</p>
                  <button className="btn-secondary w-full" onClick={() => setRedemptionError(null)}>
                    Schliessen
                  </button>
                </>
              )}
              
              {/* Success: Active Redemption */}
              {redemption && !isExpired && !statusUsed && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-success/10">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  
                  <h2 className="text-xl font-bold mb-2">Erfolgreich eingelöst!</h2>
                  <p className="text-muted-foreground mb-4">
                    Zeige diesen Code beim Partner vor.
                  </p>
                  
                  {/* QR Code Placeholder - would use qrPayload */}
                  <div className="bg-white rounded-2xl p-4 mb-4 border border-border">
                    <div className="flex items-center justify-center h-32 w-32 mx-auto bg-muted rounded-xl mb-3">
                      <QrCode className="h-16 w-16 text-muted-foreground" />
                    </div>
                    
                    {/* Redemption Code */}
                    <p className="text-2xl font-mono font-bold text-secondary tracking-widest">
                      {redemption.redemptionCode}
                    </p>
                  </div>
                  
                  {/* RAILGUARD: Expiry Timer */}
                  {timeRemaining !== null && (
                    <div className={cn(
                      'flex items-center justify-center gap-2 p-3 rounded-xl mb-4',
                      timeRemaining < 60 ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent-foreground'
                    )}>
                      <Clock className="h-4 w-4" />
                      <span className="font-semibold tabular-nums">
                        Gültig für {formatTime(timeRemaining)}
                      </span>
                    </div>
                  )}
                  
                  {/* Refresh Status Button */}
                  <button 
                    className="btn-ghost w-full mb-3 text-muted-foreground"
                    onClick={pollRedemptionStatus}
                    disabled={isPolling}
                  >
                    <RefreshCw className={cn("h-4 w-4", isPolling && "animate-spin")} />
                    Status aktualisieren
                  </button>
                  
                  <button className="btn-primary w-full" onClick={handleClose}>
                    Fertig
                  </button>
                </>
              )}
              
              {/* Expired Redemption */}
              {redemption && isExpired && !statusUsed && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-destructive/10">
                    <AlertCircle className="h-8 w-8 text-destructive" />
                  </div>
                  
                  <h2 className="text-xl font-bold mb-2">Code abgelaufen</h2>
                  <p className="text-muted-foreground mb-4">
                    Dieser Einlösecode ist abgelaufen. Deine Taler wurden nicht abgezogen.
                  </p>
                  
                  <button className="btn-primary w-full" onClick={handleClose}>
                    Schliessen
                  </button>
                </>
              )}
              
              {/* Used Redemption */}
              {statusUsed && (
                <>
                  <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-success/10">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </div>
                  
                  <h2 className="text-xl font-bold mb-2">Eingelöst!</h2>
                  <p className="text-muted-foreground mb-4">
                    Dieser Reward wurde erfolgreich beim Partner eingelöst.
                  </p>
                  
                  {redemptionStatus?.usedAt && (
                    <p className="text-sm text-muted-foreground mb-4">
                      Eingelöst am {new Date(redemptionStatus.usedAt).toLocaleDateString('de-CH')}
                    </p>
                  )}
                  
                  <button className="btn-primary w-full" onClick={handleClose}>
                    Fertig
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Reward Content */}
        <div className="animate-in">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-accent/10">
              <Icon className="h-12 w-12 text-accent" />
            </div>
          </div>
          
          {/* Title & Cost */}
          <div className="text-center mb-6">
            <span className="badge-muted mb-3 inline-block">
              {categoryLabels[reward.category]}
            </span>
            <h2 className="text-display-sm mb-3">{reward.title}</h2>
            <span className="badge-accent text-base px-4 py-2">
              {reward.cost.toLocaleString('de-CH')} Taler
            </span>
          </div>
          
          {/* Description */}
          <div className="card-base p-4 mb-4">
            <h3 className="font-semibold mb-2">Beschreibung</h3>
            <p className="text-muted-foreground">{reward.description}</p>
          </div>
          
          {/* Partner Info */}
          <div className="card-base p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                <MapPin className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Einlösbar bei</p>
                <p className="font-semibold">{reward.partnerName}</p>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          {isBrowseMode ? (
            <div className="text-center p-6 rounded-2xl bg-primary/10 border border-primary/20">
              <p className="text-foreground font-medium mb-2">
                Zum Einlösen Karte öffnen
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Öffne deine 2Go Taler Karte, um diesen Reward einzulösen.
              </p>
              <button 
                className="btn-primary"
                onClick={() => window.location.href = '/?token=demo'}
              >
                <Wallet className="h-5 w-5" />
                Karte öffnen
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {!canAfford && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Du brauchst noch <span className="font-semibold text-foreground">{(reward.cost - (balance?.current || 0)).toLocaleString('de-CH')} Taler</span> für diesen Reward.
                  </p>
                </div>
              )}
              <button 
                className="btn-primary w-full"
                disabled={!canAfford || isRedeeming}
                onClick={handleRedeem}
              >
                {isRedeeming ? 'Wird eingelöst...' : `Für ${reward.cost.toLocaleString('de-CH')} Taler einlösen`}
              </button>
              <p className="text-xs text-center text-muted-foreground">
                Der Code ist {REDEMPTION_EXPIRY_MINUTES} Minuten gültig.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
