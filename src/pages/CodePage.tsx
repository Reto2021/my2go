import { useState, useRef } from 'react';
import { useSession, useBrowseMode } from '@/lib/session';
import { redeemCode } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, XCircle, Radio, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Rate limiting (max 5 attempts per day stored in session)
const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 30000; // 30 seconds between attempts

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
      
      // Update rate limiting
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
    <div className="animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4">
          <h1 className="text-xl font-bold">Code einlösen</h1>
        </div>
      </header>
      
      <div className="container py-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/10 mx-auto mb-4">
            <Radio className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-lg font-semibold mb-2">On-Air Code eingeben</h2>
          <p className="text-muted-foreground text-sm">
            Hörst du Radio 2Go? Gib den Code ein, der on Air genannt wird, und erhalte Bonus-Taler!
          </p>
        </div>
        
        {/* Browse Mode */}
        {isBrowseMode ? (
          <div className="text-center p-6 rounded-2xl bg-secondary/50">
            <p className="text-muted-foreground mb-4">
              Öffne deine Taler-Karte, um Codes einzulösen.
            </p>
            <Button 
              className="btn-gold"
              onClick={() => window.location.href = '/?token=demo'}
            >
              Karte öffnen
            </Button>
          </div>
        ) : result ? (
          /* Result State */
          <div className="card-elevated text-center animate-slide-up">
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
            
            <Button 
              variant={result.success ? 'default' : 'outline'}
              className="w-full"
              onClick={resetResult}
            >
              {result.success ? 'Weiteren Code eingeben' : 'Erneut versuchen'}
            </Button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Code eingeben..."
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="text-center text-xl font-mono uppercase h-14 tracking-widest"
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
            
            <Button 
              type="submit"
              className="btn-gold w-full"
              disabled={!code.trim() || isSubmitting || isOnCooldown || hasExceededLimit}
            >
              {isSubmitting ? 'Wird geprüft...' : 'Code einlösen'}
            </Button>
            
            <p className="text-xs text-muted-foreground text-center">
              Codes sind 24 Stunden gültig und können nur einmal eingelöst werden.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
