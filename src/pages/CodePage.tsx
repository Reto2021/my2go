import { useState, useRef, useEffect } from 'react';
import { useSession, useBrowseMode } from '@/lib/session';
import { redeemOnAirCode } from '@/lib/api';
import { CheckCircle2, XCircle, Music, Sparkles, Wallet, Coins, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CodePage() {
  const { session, balance, refreshBalance, loginWithToken } = useSession();
  const isBrowseMode = useBrowseMode();
  
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    status: 'ok' | 'invalid' | 'expired' | 'used' | 'rate_limited';
    message: string;
    pointsAwarded?: number;
    newBalance?: number;
  } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus input on mount
  useEffect(() => {
    if (!isBrowseMode) {
      inputRef.current?.focus();
    }
  }, [isBrowseMode]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCode = code.trim();
    if (!session?.hasSession || !trimmedCode || isSubmitting) return;
    
    setIsSubmitting(true);
    setResult(null);
    
    try {
      // RAILGUARD: Server handles rate limits, cooldowns, validation
      // No token needed - auth via httpOnly cookie
      const response = await redeemOnAirCode(trimmedCode);
      
      setResult({
        status: response.status,
        message: response.message,
        pointsAwarded: response.pointsAwarded,
        newBalance: response.newBalance,
      });
      
      if (response.status === 'ok') {
        setCode('');
        refreshBalance();
      }
    } catch (err) {
      setResult({
        status: 'invalid',
        message: 'Verbindungsfehler. Prüfe deine Internetverbindung.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReset = () => {
    setResult(null);
    setCode('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };
  
  const isSuccess = result?.status === 'ok';
  const isRateLimited = result?.status === 'rate_limited';
  
  // Helper for next step hints
  const getNextStepHint = (status: string): string => {
    switch (status) {
      case 'invalid':
        return 'Überprüfe die Schreibweise und versuche es erneut.';
      case 'expired':
        return 'Höre Radio 2Go für neue Codes!';
      case 'used':
        return 'Warte auf den nächsten Code in der Sendung.';
      case 'rate_limited':
        return 'Versuch es später nochmal.';
      default:
        return '';
    }
  };
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
        <div className="container py-4">
          <h1 className="text-display-sm">Radio-Code einlösen</h1>
        </div>
      </header>
      
      <div className="container py-6">
        {/* Hero - compact */}
        <div className="text-center mb-6 animate-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10 mx-auto mb-3">
            <Music className="h-8 w-8 text-accent" />
          </div>
          <p className="text-muted-foreground text-sm">
            Hörst du Radio 2Go? Codes werden während der Sendung genannt!
          </p>
        </div>
        
        {/* Browse Mode - Better explanation */}
        {isBrowseMode ? (
          <div className="text-center p-6 rounded-2xl bg-primary/10 border border-primary/20 animate-in">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-6 w-6 text-accent" />
            </div>
            <h3 className="text-foreground font-bold text-lg mb-2">
              So funktioniert's
            </h3>
            <div className="text-sm text-muted-foreground mb-4 space-y-2">
              <p>1️⃣ Höre Radio 2Go im Player</p>
              <p>2️⃣ Warte auf den Code während der Sendung</p>
              <p>3️⃣ Gib den Code hier ein und sammle Taler!</p>
            </div>
            <button 
              className="btn-primary"
              onClick={() => loginWithToken('demo')}
            >
              <Wallet className="h-5 w-5" />
              Jetzt anmelden & Codes einlösen
            </button>
          </div>
        ) : result ? (
          /* Result State - Fast feedback */
          <div className={cn(
            'rounded-3xl p-6 text-center animate-in',
            isSuccess ? 'bg-success/5 border-2 border-success/20' : 'bg-muted'
          )}>
            {/* Success State */}
            {isSuccess && (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4 bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                
                {/* Points earned - big and bold */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-accent" />
                  <span className="text-3xl font-extrabold text-accent tabular-nums">
                    +{result.pointsAwarded}
                  </span>
                  <span className="text-lg font-semibold text-accent">Taler</span>
                </div>
                
                <p className="text-foreground font-medium mb-4">
                  {result.message}
                </p>
                
                {/* New balance */}
                {result.newBalance && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/10 mb-6">
                    <Coins className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-semibold text-secondary">
                      Neues Guthaben: {result.newBalance.toLocaleString('de-CH')} Taler
                    </span>
                  </div>
                )}
                
                <button className="btn-primary w-full" onClick={handleReset}>
                  Weiteren Code eingeben
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
            
            {/* Error State - Friendly with next step */}
            {!isSuccess && (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full mx-auto mb-4 bg-muted-foreground/10">
                  <XCircle className="h-7 w-7 text-muted-foreground" />
                </div>
                
                <p className="text-foreground font-medium mb-2">
                  {result.message}
                </p>
                
                {/* Next step hint */}
                <p className="text-sm text-muted-foreground mb-6">
                  {getNextStepHint(result.status)}
                </p>
                
                <button 
                  className="btn-secondary w-full"
                  onClick={handleReset}
                  disabled={isRateLimited}
                >
                  {isRateLimited ? 'Später versuchen' : 'Erneut versuchen'}
                </button>
              </>
            )}
          </div>
        ) : (
          /* Input Form - Ultra fast flow */
          <form onSubmit={handleSubmit} className="space-y-4 animate-in">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="CODE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={cn(
                  'w-full h-16 text-center text-2xl font-mono font-bold uppercase tracking-[0.25em]',
                  'bg-card border-2 border-border rounded-2xl',
                  'placeholder:text-muted-foreground/40 placeholder:font-normal',
                  'focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10',
                  'transition-all duration-150'
                )}
                maxLength={12}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
              />
            </div>
            
            <button 
              type="submit"
              className="btn-primary w-full h-14 text-base"
              disabled={!code.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-accent-foreground/30 border-t-accent-foreground rounded-full animate-spin" />
                  Prüfe...
                </span>
              ) : (
                'Einlösen'
              )}
            </button>
            
            <p className="text-xs text-muted-foreground text-center">
              Codes sind 24h gültig · 1x pro Code
            </p>
          </form>
        )}
        
        {/* Current balance indicator (session mode) */}
        {!isBrowseMode && !result && balance && (
          <div className="flex items-center justify-center gap-2 mt-8 p-3 rounded-xl bg-muted/50">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Aktuell: <span className="font-semibold text-foreground">{balance.current.toLocaleString('de-CH')} Taler</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
