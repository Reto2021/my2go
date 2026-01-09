import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { 
  getRewardById, 
  redeemReward,
  Reward,
  Redemption 
} from '@/lib/supabase-helpers';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, useBalance } from '@/contexts/AuthContext';
import { useSettings } from '@/lib/settings';
import { useRadioStore } from '@/lib/radio-store';
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
  RefreshCw,
  AlertCircle,
  Percent,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Map reward_type to icons and labels
const rewardTypeIcons = {
  experience: Star,
  fixed_discount: Ticket,
  percent_discount: Percent,
  free_item: Gift,
  topup_bonus: Sparkles,
};

const rewardTypeLabels = {
  experience: 'Erlebnis',
  fixed_discount: 'Rabatt',
  percent_discount: 'Prozent-Rabatt',
  free_item: 'Gratis-Produkt',
  topup_bonus: 'Bonus',
};

// RAILGUARD: Redemption expires after 10 minutes
const REDEMPTION_EXPIRY_MINUTES = 10;

export default function RewardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { balance, refreshBalance } = useBalance();
  const { soundEnabled, vibrationEnabled } = useSettings();
  const { isPlaying: isRadioPlaying } = useRadioStore();
  
  const [reward, setReward] = useState<Reward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redemption, setRedemption] = useState<Redemption | null>(null);
  const [redemptionError, setRedemptionError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [redemptionStatus, setRedemptionStatus] = useState<'pending' | 'used' | 'expired' | 'cancelled' | null>(null);
  
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
    if (!redemption?.expires_at) return;
    
    const updateTimer = () => {
      const expiresAt = new Date(redemption.expires_at).getTime();
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
      setTimeRemaining(remaining);
      
      if (remaining === 0 && redemptionStatus === 'pending') {
        setRedemptionStatus('expired');
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [redemption?.expires_at, redemptionStatus]);
  
  // RAILGUARD: Poll redemption status from server (only source of truth)
  const pollRedemptionStatus = useCallback(async () => {
    if (!user || !redemption?.id) return;
    
    setIsPolling(true);
    try {
      const { data, error: fetchError } = await supabase
        .from('redemptions')
        .select('status, redeemed_at')
        .eq('id', redemption.id)
        .single();
      
      if (!fetchError && data) {
        setRedemptionStatus(data.status);
        
        // Refresh balance after status check (server is source of truth)
        if (data.status === 'used') {
          refreshBalance();
        }
      }
    } catch (err) {
      console.error('Failed to poll redemption status:', err);
    } finally {
      setIsPolling(false);
    }
  }, [user, redemption?.id, refreshBalance]);
  
  // RAILGUARD: Points deduction handled by supabase-helpers
  const handleRedeem = async () => {
    if (!user || !reward) return;
    
    setIsRedeeming(true);
    setRedemptionError(null);
    
    try {
      const result = await redeemReward(
        user.id,
        reward.id,
        reward.partner_id,
        reward.taler_cost
      );
      
      if (result.error) {
        triggerHapticFeedback('error');
        playFeedbackSound('error');
        setRedemptionError(result.error);
      } else if (result.redemption) {
        setRedemption(result.redemption);
        setRedemptionStatus('pending');
        
        // Haptic + Sound feedback on success (mobile devices)
        triggerHapticFeedback('success');
        playFeedbackSound('success');
        
        // Refresh balance from server (source of truth)
        refreshBalance();
      }
    } catch (err) {
      console.error('Redemption failed:', err);
      triggerHapticFeedback('error');
      playFeedbackSound('error');
      setRedemptionError('Ein Fehler ist aufgetreten. Bitte versuche es später erneut.');
    } finally {
      setIsRedeeming(false);
    }
  };
  
  // Haptic feedback helper using Web Vibration API
  const triggerHapticFeedback = useCallback((type: 'success' | 'error' | 'light') => {
    if (!vibrationEnabled || !navigator.vibrate) return;
    
    switch (type) {
      case 'success':
        navigator.vibrate([50, 50, 100]);
        break;
      case 'error':
        navigator.vibrate(200);
        break;
      case 'light':
        navigator.vibrate(10);
        break;
    }
  }, [vibrationEnabled]);
  
  // Sound feedback using Web Audio API (works on iOS)
  const playFeedbackSound = useCallback((type: 'success' | 'error') => {
    if (!soundEnabled || isRadioPlaying) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      if (type === 'success') {
        oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.4);
      } else {
        oscillator.frequency.setValueAtTime(349.23, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(261.63, audioContext.currentTime + 0.15);
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      }
    } catch (e) {
      console.log('Web Audio API not available');
    }
  }, [soundEnabled, isRadioPlaying]);
  
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
  
  if (isLoading || authLoading) {
    return <PageLoader />;
  }
  
  if (error || !reward) {
    return (
      <div className="min-h-screen pb-24">
        <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
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
  
  const Icon = rewardTypeIcons[reward.reward_type] || Gift;
  const canAfford = balance && balance.taler_balance >= reward.taler_cost;
  const isExpired = redemptionStatus === 'expired' || (timeRemaining !== null && timeRemaining === 0);
  const statusUsed = redemptionStatus === 'used';
  const isLoggedIn = !!user;
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
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
        <AnimatePresence>
          {(redemption || redemptionError) && (
            <motion.div 
              className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div 
                className="card-base p-6 max-w-sm w-full text-center shadow-strong"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
              >
                
                {/* Error State */}
                {redemptionError && (
                  <>
                    <motion.div 
                      className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-destructive/10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 15, stiffness: 400, delay: 0.1 }}
                    >
                      <XCircle className="h-8 w-8 text-destructive" />
                    </motion.div>
                    <motion.h2 
                      className="text-xl font-bold mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      Fehler
                    </motion.h2>
                    <motion.p 
                      className="text-muted-foreground mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {redemptionError}
                    </motion.p>
                    <motion.button 
                      className="btn-secondary w-full" 
                      onClick={() => setRedemptionError(null)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Schliessen
                    </motion.button>
                  </>
                )}
                
                {/* Success: Active Redemption */}
                {redemption && !isExpired && !statusUsed && (
                  <>
                    <motion.div 
                      className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-success/10"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200, delay: 0.1 }}
                    >
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </motion.div>
                    
                    <motion.h2 
                      className="text-xl font-bold mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      Erfolgreich eingelöst!
                    </motion.h2>
                    <motion.p 
                      className="text-muted-foreground mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.25 }}
                    >
                      Zeige diesen Code beim Partner vor.
                    </motion.p>
                    
                    {/* Real QR Code */}
                    <motion.div 
                      className="bg-white rounded-2xl p-4 mb-4 border border-border"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300, delay: 0.3 }}
                    >
                      <div className="flex items-center justify-center mb-3">
                        <QRCodeSVG 
                          value={redemption.qr_payload || redemption.redemption_code}
                          size={140}
                          level="M"
                          includeMargin={false}
                          bgColor="#ffffff"
                          fgColor="#000000"
                        />
                      </div>
                      
                      {/* Redemption Code */}
                      <motion.p 
                        className="text-2xl font-mono font-bold text-secondary tracking-widest"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {redemption.redemption_code}
                      </motion.p>
                    </motion.div>
                    
                    {/* RAILGUARD: Expiry Timer */}
                    {timeRemaining !== null && (
                      <motion.div 
                        className={cn(
                          'flex items-center justify-center gap-2 p-3 rounded-xl mb-4',
                          timeRemaining < 60 ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent-foreground'
                        )}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                      >
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold tabular-nums">
                          Gültig für {formatTime(timeRemaining)}
                        </span>
                      </motion.div>
                    )}
                    
                    {/* Refresh Status Button */}
                    <motion.button 
                      className="btn-ghost w-full mb-3 text-muted-foreground"
                      onClick={pollRedemptionStatus}
                      disabled={isPolling}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <RefreshCw className={cn("h-4 w-4", isPolling && "animate-spin")} />
                      Status aktualisieren
                    </motion.button>
                    
                    <motion.button 
                      className="btn-primary w-full" 
                      onClick={handleClose}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.55 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Fertig
                    </motion.button>
                  </>
                )}
                
                {/* Expired Redemption */}
                {redemption && isExpired && !statusUsed && (
                  <>
                    <motion.div 
                      className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-destructive/10"
                      initial={{ scale: 0 }}
                      animate={{ scale: [0, 1.2, 1] }}
                      transition={{ duration: 0.4 }}
                    >
                      <AlertCircle className="h-8 w-8 text-destructive" />
                    </motion.div>
                    
                    <motion.h2 
                      className="text-xl font-bold mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      Code abgelaufen
                    </motion.h2>
                    <motion.p 
                      className="text-muted-foreground mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Dieser Einlösecode ist abgelaufen. Deine Taler wurden bereits abgezogen.
                    </motion.p>
                    
                    <motion.button 
                      className="btn-primary w-full" 
                      onClick={handleClose}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Schliessen
                    </motion.button>
                  </>
                )}
                
                {/* Used Redemption */}
                {statusUsed && (
                  <>
                    <motion.div 
                      className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-success/10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12, stiffness: 200 }}
                    >
                      <CheckCircle2 className="h-8 w-8 text-success" />
                    </motion.div>
                    
                    <motion.h2 
                      className="text-xl font-bold mb-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      Eingelöst!
                    </motion.h2>
                    <motion.p 
                      className="text-muted-foreground mb-4"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      Dieser Reward wurde erfolgreich beim Partner eingelöst.
                    </motion.p>
                    
                    <motion.button 
                      className="btn-primary w-full" 
                      onClick={handleClose}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Fertig
                    </motion.button>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Reward Content */}
        <div className="animate-in">
          {/* Icon & Image */}
          <div className="flex justify-center mb-6">
            {reward.image_url ? (
              <div className="h-32 w-full max-w-xs rounded-2xl overflow-hidden bg-muted">
                <img 
                  src={reward.image_url} 
                  alt={reward.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-accent/10">
                <Icon className="h-12 w-12 text-accent" />
              </div>
            )}
          </div>
          
          {/* Title & Cost */}
          <div className="text-center mb-6">
            <span className="badge-muted mb-3 inline-block">
              {rewardTypeLabels[reward.reward_type]}
            </span>
            <h2 className="text-display-sm mb-3">{reward.title}</h2>
            <span className="badge-accent text-base px-4 py-2">
              {reward.taler_cost.toLocaleString('de-CH')} Taler
            </span>
          </div>
          
          {/* Description */}
          {reward.description && (
            <div className="card-base p-4 mb-4">
              <h3 className="font-semibold mb-2">Beschreibung</h3>
              <p className="text-muted-foreground">{reward.description}</p>
            </div>
          )}
          
          {/* Value Info */}
          {(reward.value_amount || reward.value_percent) && (
            <div className="card-base p-4 mb-4">
              <h3 className="font-semibold mb-2">Wert</h3>
              <p className="text-muted-foreground">
                {reward.value_amount && `CHF ${reward.value_amount.toFixed(2)}`}
                {reward.value_percent && `${reward.value_percent}% Rabatt`}
              </p>
            </div>
          )}
          
          {/* Terms */}
          {reward.terms && (
            <div className="card-base p-4 mb-4">
              <h3 className="font-semibold mb-2">Bedingungen</h3>
              <p className="text-muted-foreground text-sm">{reward.terms}</p>
            </div>
          )}
          
          {/* Partner Info */}
          {reward.partner && (
            <div className="card-base p-4 mb-6">
              <div className="flex items-center gap-4">
                {reward.partner.logo_url ? (
                  <img 
                    src={reward.partner.logo_url} 
                    alt={reward.partner.name}
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                    <MapPin className="h-6 w-6 text-secondary" />
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">Einlösbar bei</p>
                  <p className="font-semibold">{reward.partner.name}</p>
                  {reward.partner.city && (
                    <p className="text-sm text-muted-foreground">{reward.partner.city}</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Stock Info */}
          {reward.stock_remaining !== null && reward.stock_remaining <= 10 && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-warning/10 mb-4">
              <AlertCircle className="h-5 w-5 text-warning flex-shrink-0" />
              <p className="text-sm text-warning">
                Nur noch <span className="font-semibold">{reward.stock_remaining}</span> verfügbar!
              </p>
            </div>
          )}
          
          {/* Action Button */}
          {!isLoggedIn ? (
            <div className="text-center p-6 rounded-2xl bg-primary/10 border border-primary/20">
              <p className="text-foreground font-medium mb-2">
                Zum Einlösen bitte anmelden
              </p>
              <p className="text-muted-foreground text-sm mb-4">
                Melde dich an, um diesen Reward einzulösen.
              </p>
              <button 
                className="btn-primary"
                onClick={() => navigate('/auth')}
              >
                <Wallet className="h-5 w-5" />
                Anmelden
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {!canAfford && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted">
                  <AlertCircle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Du brauchst noch <span className="font-semibold text-foreground">{(reward.taler_cost - (balance?.taler_balance || 0)).toLocaleString('de-CH')} Taler</span> für diesen Reward.
                  </p>
                </div>
              )}
              <button 
                className="btn-primary w-full"
                disabled={!canAfford || isRedeeming}
                onClick={handleRedeem}
              >
                {isRedeeming ? 'Wird eingelöst...' : `Für ${reward.taler_cost.toLocaleString('de-CH')} Taler einlösen`}
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
