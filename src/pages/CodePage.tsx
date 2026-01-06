import { useState, useRef } from 'react';
import { useSession, useBrowseMode } from '@/lib/session';
import { redeemCode } from '@/lib/api';
import { CheckCircle2, XCircle, Radio, Sparkles, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30000;

export default function CodePage() {
  const { token, refreshBalance } = useSession();
  const isBrowseMode = useBrowseMode();
  
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    pointsEarned?: number;
  } | null>(null);
  
  const [attempts, setAttempts] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const isOnCooldown = cooldownEnd && Date.now() < cooldownEnd;
  const hasExceededLimit = attempts >= MAX_ATTEMPTS;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token || !code.trim() || isSubmitting || isOnCooldown || hasExceededLimit) {
      return;
    }
    
    setIsSubmitting(true);
    setResult(null);
    
    try {
      const response = await redeemCode(token, code.trim());
      setResult({
        success: response.success,
        message: response.message,
        pointsEarned: response.pointsEarned,
      });
      
      if (response.success) {
        setCode('');
        refreshBalance();
      }
      
      setAttempts(prev => prev + 1);
      setCooldownEnd(Date.now() + COOLDOWN_MS);
      
    } catch (err) {
      setResult({
        success: false,
        message: 'Ein Fehler ist aufgetreten. Bitte versuche es später erneut.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const resetResult = () => {
    setResult(null);
    inputRef.current?.focus();
  };
  
  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <h1 className="text-display-sm">Code einlösen</h1>
        </div>
      </header>
      
      <div className="container py-8">
        {/* Hero */}
        <div className="text-center mb-8 animate-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 mx-auto mb-4">
            <Radio className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-lg font-semibold mb-2">On-Air Code eingeben</h2>
          <p className="text-muted-foreground">
            Hörst du Radio 2Go? Gib den Code ein und erhalte Bonus-Taler!
          </p>
        </div>
        
        {/* Browse Mode */}
        {isBrowseMode ? (
          <div className="text-center p-6 rounded-2xl bg-muted/50 animate-in-delayed">
            <p className="text-muted-foreground mb-4">
              Öffne deine Taler-Karte, um Codes einzulösen.
            </p>
            <button 
              className="btn-primary"
              onClick={() => window.location.href = '/?token=demo'}
            >
              <Wallet className="h-5 w-5" />
              Karte öffnen
            </button>
          </div>
        ) : result ? (
          /* Result State */
          <div className="card-base p-6 text-center animate-in">
            <div className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full mx-auto mb-4',
              result.success ? 'bg-success/10' : 'bg-destructive/10'
            )}>
              {result.success ? (
                <CheckCircle2 className="h-8 w-8 text-success" />
              ) : (
                <XCircle className="h-8 w-8 text-destructive" />
              )}
            </div>
            
            {result.success && result.pointsEarned && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-accent" />
                <span className="text-2xl font-bold text-accent">
                  +{result.pointsEarned} Taler
                </span>
              </div>
            )}
            
            <p className={cn(
              'mb-6',
              result.success ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {result.message}
            </p>
            
            <button 
              className={result.success ? 'btn-primary w-full' : 'btn-secondary w-full'}
              onClick={resetResult}
            >
              {result.success ? 'Weiteren Code eingeben' : 'Erneut versuchen'}
            </button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="space-y-6 animate-in-delayed">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                placeholder="CODE"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className={cn(
                  'w-full h-16 text-center text-2xl font-mono uppercase tracking-[0.3em]',
                  'bg-muted border-2 border-transparent rounded-2xl',
                  'placeholder:text-muted-foreground/50 placeholder:tracking-[0.3em]',
                  'focus:outline-none focus:border-primary focus:bg-background',
                  'transition-all duration-200'
                )}
                maxLength={12}
                disabled={hasExceededLimit}
              />
            </div>
            
            {hasExceededLimit ? (
              <p className="text-sm text-destructive text-center">
                Du hast das Tageslimit erreicht. Versuche es morgen wieder.
              </p>
            ) : isOnCooldown ? (
              <p className="text-sm text-muted-foreground text-center">
                Bitte warte einen Moment vor dem nächsten Versuch.
              </p>
            ) : null}
            
            <button 
              type="submit"
              className="btn-primary w-full"
              disabled={!code.trim() || isSubmitting || isOnCooldown || hasExceededLimit}
            >
              {isSubmitting ? 'Wird geprüft...' : 'Code einlösen'}
            </button>
            
            <p className="text-xs text-muted-foreground text-center">
              Codes sind 24h gültig und können nur einmal eingelöst werden.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
