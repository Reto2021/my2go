import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getRewardById, redeemReward, Reward } from '@/lib/api';
import { useSession, useBrowseMode } from '@/lib/session';
import { PageLoader } from '@/components/ui/loading-spinner';
import { ErrorState } from '@/components/ui/error-state';
import { ArrowLeft, CheckCircle2, XCircle, Coffee, Ticket, Gift, Star, MapPin, Wallet } from 'lucide-react';
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

export default function RewardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, balance, refreshBalance } = useSession();
  const isBrowseMode = useBrowseMode();
  
  const [reward, setReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemptionResult, setRedemptionResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
  } | null>(null);
  
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
  
  const handleRedeem = async () => {
    if (!token || !reward) return;
    
    setIsRedeeming(true);
    try {
      const result = await redeemReward(token, reward.id);
      setRedemptionResult({
        success: result.success,
        message: result.message,
        code: result.redemptionCode,
      });
      if (result.success) {
        refreshBalance();
      }
    } catch (err) {
      setRedemptionResult({
        success: false,
        message: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
      });
    } finally {
      setIsRedeeming(false);
    }
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
        {/* Redemption Result Overlay */}
        {redemptionResult && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="card-base p-6 max-w-sm w-full text-center animate-in shadow-strong">
              <div className={cn(
                'flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4',
                redemptionResult.success ? 'bg-success/10' : 'bg-destructive/10'
              )}>
                {redemptionResult.success ? (
                  <CheckCircle2 className="h-8 w-8 text-success" />
                ) : (
                  <XCircle className="h-8 w-8 text-destructive" />
                )}
              </div>
              
              <h2 className="text-xl font-bold mb-2">
                {redemptionResult.success ? 'Erfolgreich!' : 'Fehler'}
              </h2>
              
              <p className="text-muted-foreground mb-4">
                {redemptionResult.message}
              </p>
              
              {redemptionResult.code && (
                <div className="bg-muted rounded-2xl p-4 mb-4">
                  <p className="text-sm text-muted-foreground mb-1">Dein Code:</p>
                  <p className="text-2xl font-mono font-bold text-accent tracking-widest">
                    {redemptionResult.code}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Zeige diesen Code beim Partner vor.
                  </p>
                </div>
              )}
              
              <button 
                className="btn-primary w-full"
                onClick={() => {
                  setRedemptionResult(null);
                  if (redemptionResult.success) {
                    navigate('/rewards');
                  }
                }}
              >
                {redemptionResult.success ? 'Fertig' : 'Schliessen'}
              </button>
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Einlösbar bei</p>
                <p className="font-semibold">{reward.partnerName}</p>
              </div>
            </div>
          </div>
          
          {/* Action Button */}
          {isBrowseMode ? (
            <div className="text-center p-6 rounded-2xl bg-muted/50">
              <p className="text-muted-foreground text-sm mb-4">
                Öffne deine Taler-Karte, um Rewards einzulösen.
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
                <p className="text-center text-sm text-muted-foreground">
                  Du brauchst noch {reward.cost - (balance?.current || 0)} Taler für diesen Reward.
                </p>
              )}
              <button 
                className="btn-primary w-full"
                disabled={!canAfford || isRedeeming}
                onClick={handleRedeem}
              >
                {isRedeeming ? 'Wird eingelöst...' : `Für ${reward.cost} Taler einlösen`}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
