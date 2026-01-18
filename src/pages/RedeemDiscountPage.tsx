import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft, Ticket, CheckCircle2, Loader2, Crown, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const codeSchema = z.string()
  .trim()
  .min(1, 'Bitte gib einen Code ein')
  .max(50, 'Code zu lang')
  .regex(/^[A-Z0-9-]+$/i, 'Ungültiger Code-Format');

export default function RedeemDiscountPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRedeemed, setIsRedeemed] = useState(false);
  const [discountInfo, setDiscountInfo] = useState<{
    discount_percent: number;
    expires_at: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate code format
    const result = codeSchema.safeParse(code);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }

    if (!user) {
      toast.error('Bitte melde dich an');
      navigate('/auth');
      return;
    }

    setIsLoading(true);

    try {
      // Look up the discount code in system_settings
      const { data, error: fetchError } = await supabase
        .from('system_settings')
        .select('key, value')
        .eq('key', `plus_renewal_discount_${user.id}`)
        .single();

      if (fetchError || !data) {
        setError('Ungültiger oder abgelaufener Code');
        setIsLoading(false);
        return;
      }

      const discountData = data.value as {
        code: string;
        discount_percent: number;
        created_at: string;
        expires_at: string;
        used: boolean;
      };

      // Verify the code matches
      if (discountData.code.toUpperCase() !== code.toUpperCase()) {
        setError('Ungültiger Code');
        setIsLoading(false);
        return;
      }

      // Check if already used
      if (discountData.used) {
        setError('Dieser Code wurde bereits verwendet');
        setIsLoading(false);
        return;
      }

      // Check if expired
      if (new Date(discountData.expires_at) < new Date()) {
        setError('Dieser Code ist abgelaufen');
        setIsLoading(false);
        return;
      }

      // Mark code as used
      await supabase
        .from('system_settings')
        .update({
          value: { ...discountData, used: true },
          updated_at: new Date().toISOString()
        })
        .eq('key', `plus_renewal_discount_${user.id}`);

      setDiscountInfo({
        discount_percent: discountData.discount_percent,
        expires_at: discountData.expires_at
      });
      setIsRedeemed(true);
      toast.success(`${discountData.discount_percent}% Rabatt aktiviert!`);
    } catch (err) {
      console.error('Error redeeming code:', err);
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <Crown className="h-12 w-12 text-amber-500 mx-auto" />
          <h1 className="text-xl font-semibold">Anmeldung erforderlich</h1>
          <p className="text-muted-foreground">Bitte melde dich an, um deinen Rabattcode einzulösen.</p>
          <Button onClick={() => navigate('/auth')}>Jetzt anmelden</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Rabattcode einlösen</h1>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 animate-in">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 mx-auto">
            <Ticket className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold">Verlängerungsrabatt</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Gib deinen persönlichen Rabattcode ein, um einen Rabatt auf deine 2Go Plus Verlängerung zu erhalten.
          </p>
        </div>

        {isRedeemed ? (
          /* Success State */
          <div className="card-base p-8 text-center space-y-6 animate-in">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-success/10 mx-auto">
              <CheckCircle2 className="h-10 w-10 text-success" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-success">Rabatt aktiviert!</h3>
              <p className="text-muted-foreground">
                Dein {discountInfo?.discount_percent}% Rabatt wurde aktiviert und wird bei deiner nächsten Verlängerung automatisch angewendet.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                <span className="font-semibold text-amber-600">{discountInfo?.discount_percent}% gespart</span>
              </div>
              <p className="text-sm text-muted-foreground">
                bei deiner nächsten Plus-Verlängerung
              </p>
            </div>

            <Button 
              onClick={() => navigate('/settings')}
              className="w-full"
              size="lg"
            >
              <Crown className="h-5 w-5 mr-2" />
              Jetzt Plus verlängern
            </Button>
          </div>
        ) : (
          /* Input Form */
          <form onSubmit={handleSubmit} className="space-y-6 animate-in-delayed">
            <div className="card-base p-6 space-y-4">
              <label className="block">
                <span className="text-sm font-medium mb-2 block">Dein Rabattcode</span>
                <Input
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError(null);
                  }}
                  placeholder="PLUS10-XXXXXXXX"
                  className={cn(
                    "text-center text-lg font-mono tracking-wider h-14",
                    error && "border-destructive"
                  )}
                  maxLength={50}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
              </label>
              
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground text-center">
                Du findest deinen Code in der E-Mail, die wir dir gesendet haben.
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full h-14 text-base"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Ticket className="h-5 w-5 mr-2" />
                  Code einlösen
                </>
              )}
            </Button>
          </form>
        )}

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-muted/50 animate-in-delayed">
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-500" />
            Wie funktioniert's?
          </h4>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>1. Du erhältst per E-Mail einen persönlichen Rabattcode</li>
            <li>2. Gib den Code hier ein, um den Rabatt zu aktivieren</li>
            <li>3. Der Rabatt wird bei deiner nächsten Verlängerung angewendet</li>
            <li>4. Codes sind 7 Tage gültig und einmalig verwendbar</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
