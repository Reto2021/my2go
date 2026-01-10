import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { redeemAirDropCode } from '@/lib/supabase-helpers';
import { CheckCircle2, XCircle, Music, Sparkles, Wallet, Coins, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CodePage() {
  const navigate = useNavigate();
  const { user, balance, refreshBalance, isLoading: authLoading } = useAuth();
  
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    status: 'ok' | 'error';
    message: string;
    pointsAwarded?: number;
  } | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-focus input on mount when logged in
  useEffect(() => {
    if (user && !authLoading) {
      inputRef.current?.focus();
    }
  }, [user, authLoading]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCode = code.trim().toUpperCase();
    if (!user || !trimmedCode || isSubmitting) return;
    
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const response = await redeemAirDropCode(user.id, trimmedCode);
      
      if (response.success) {
        // Refresh balance to get new total
        await refreshBalance();
        
        setResult({
          status: 'ok',
          message: 'Code erfolgreich eingelöst!',
          pointsAwarded: response.talerAwarded,
        });
        setCode('');
      } else {
        setResult({
          status: 'error',
          message: response.error || 'Ungültiger Code',
        });
      }
    } catch (err) {
      console.error('Redeem error:', err);
      setResult({
        status: 'error',
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
  
  // Show loading state while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen pb-24 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
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
        
        {/* Not logged in - Show login prompt */}
        {!user ? (
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
              onClick={() => navigate('/auth')}
            >
              <Wallet className="h-5 w-5" />
              Jetzt anmelden & Codes einlösen
            </button>
          </div>
        ) : result ? (
          /* Result State */
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
                {balance && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-secondary/10 mb-6">
                    <Coins className="h-4 w-4 text-secondary" />
                    <span className="text-sm font-semibold text-secondary">
                      Neues Guthaben: {balance.taler_balance.toLocaleString('de-CH')} Taler
                    </span>
                  </div>
                )}
                
                <button className="btn-primary w-full" onClick={handleReset}>
                  Weiteren Code eingeben
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
            
            {/* Error State */}
            {!isSuccess && (
              <>
                <div className="flex h-14 w-14 items-center justify-center rounded-full mx-auto mb-4 bg-muted-foreground/10">
                  <XCircle className="h-7 w-7 text-muted-foreground" />
                </div>
                
                <p className="text-foreground font-medium mb-2">
                  {result.message}
                </p>
                
                <p className="text-sm text-muted-foreground mb-6">
                  Überprüfe die Schreibweise und versuche es erneut.
                </p>
                
                <button 
                  className="btn-secondary w-full"
                  onClick={handleReset}
                >
                  Erneut versuchen
                </button>
              </>
            )}
          </div>
        ) : (
          /* Input Form */
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
                maxLength={20}
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
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Prüfe...
                </span>
              ) : (
                'Einlösen'
              )}
            </button>
            
            <p className="text-xs text-muted-foreground text-center">
              Codes sind zeitlich begrenzt gültig · 1x pro Code
            </p>
          </form>
        )}
        
        {/* Current balance indicator (when logged in) */}
        {user && !result && balance && (
          <div className="flex items-center justify-center gap-2 mt-8 p-3 rounded-xl bg-muted/50">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Aktuell: <span className="font-semibold text-foreground">{balance.taler_balance.toLocaleString('de-CH')} Taler</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
