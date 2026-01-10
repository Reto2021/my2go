import { useState, useEffect, useRef } from 'react';
import { usePartner } from '@/components/partner/PartnerGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  QrCode, 
  ShoppingCart, 
  Store, 
  CheckCircle, 
  Loader2,
  Coins,
  User,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type TransactionType = 'visit' | 'purchase';

interface TransactionResult {
  success: boolean;
  taler_awarded?: number;
  user_name?: string;
  new_balance?: number;
  error?: string;
}

export default function PartnerScanPage() {
  const { partnerInfo } = usePartner();
  const [userCode, setUserCode] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>('visit');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedCode = userCode.trim().toUpperCase();
    if (!trimmedCode || !partnerInfo?.partnerId) return;

    if (transactionType === 'purchase' && (!purchaseAmount || parseFloat(purchaseAmount) <= 0)) {
      toast.error('Bitte gib einen gültigen Betrag ein');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await supabase.functions.invoke('partner-transaction', {
        body: {
          user_code: trimmedCode,
          transaction_type: transactionType,
          amount: transactionType === 'purchase' ? parseFloat(purchaseAmount) : undefined,
          partner_id: partnerInfo.partnerId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data as TransactionResult;
      setResult(data);

      if (data.success) {
        toast.success(`${data.taler_awarded} Taler an ${data.user_name} vergeben!`);
      } else {
        toast.error(data.error || 'Transaktion fehlgeschlagen');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      setResult({
        success: false,
        error: 'Verbindungsfehler. Bitte versuche es erneut.',
      });
      toast.error('Verbindungsfehler');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setUserCode('');
    setPurchaseAmount('');
    setTransactionType('visit');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const isSuccess = result?.success;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kunden scannen</h1>
        <p className="text-muted-foreground">
          Scanne den QR-Code oder gib den Code manuell ein
        </p>
      </div>

      {result ? (
        // Result State
        <Card className={cn(
          'overflow-hidden',
          isSuccess ? 'border-success/50 bg-success/5' : 'border-destructive/50 bg-destructive/5'
        )}>
          <CardContent className="p-6 text-center">
            {isSuccess ? (
              <>
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-success" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Erfolgreich!
                </h2>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <span className="text-lg font-semibold">{result.user_name}</span>
                </div>

                <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-accent/10 mb-4">
                  <Coins className="h-6 w-6 text-accent" />
                  <span className="text-2xl font-bold text-accent">
                    +{result.taler_awarded} Taler
                  </span>
                </div>

                <p className="text-sm text-muted-foreground mb-6">
                  Neues Guthaben: {result.new_balance?.toLocaleString('de-CH')} Taler
                </p>

                <Button onClick={handleReset} className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Nächster Kunde
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-destructive" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Fehler
                </h2>
                
                <p className="text-muted-foreground mb-6">
                  {result.error}
                </p>

                <Button onClick={handleReset} variant="outline" className="w-full">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Erneut versuchen
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        // Input Form
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Code Input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Kunden-Code
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                ref={inputRef}
                type="text"
                placeholder="2GO-XXXXX oder scannen"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                className="h-14 text-center text-xl font-mono font-bold uppercase tracking-wider"
                maxLength={20}
                autoComplete="off"
                autoCapitalize="characters"
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Lasse den Kunden seinen QR-Code zeigen oder gib den Code ein
              </p>
            </CardContent>
          </Card>

          {/* Transaction Type */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Art der Transaktion</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={transactionType}
                onValueChange={(v) => setTransactionType(v as TransactionType)}
                className="grid grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="visit"
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    transactionType === 'visit'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="visit" id="visit" className="sr-only" />
                  <Store className="h-6 w-6" />
                  <span className="font-semibold">Besuch</span>
                  <span className="text-xs text-muted-foreground">+5 Taler</span>
                </Label>
                
                <Label
                  htmlFor="purchase"
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    transactionType === 'purchase'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <RadioGroupItem value="purchase" id="purchase" className="sr-only" />
                  <ShoppingCart className="h-6 w-6" />
                  <span className="font-semibold">Einkauf</span>
                  <span className="text-xs text-muted-foreground">1 Taler/CHF</span>
                </Label>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Purchase Amount (conditional) */}
          {transactionType === 'purchase' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Einkaufsbetrag</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
                    CHF
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={purchaseAmount}
                    onChange={(e) => setPurchaseAmount(e.target.value)}
                    className="h-14 text-center text-xl font-bold pl-14"
                    min="0"
                    step="0.01"
                  />
                </div>
                {purchaseAmount && parseFloat(purchaseAmount) > 0 && (
                  <p className="text-sm text-accent font-semibold text-center mt-2">
                    = {Math.floor(parseFloat(purchaseAmount))} Taler
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg"
            disabled={!userCode.trim() || isSubmitting || (transactionType === 'purchase' && (!purchaseAmount || parseFloat(purchaseAmount) <= 0))}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Verarbeite...
              </>
            ) : (
              <>
                <Coins className="h-5 w-5 mr-2" />
                Taler vergeben
                <ArrowRight className="h-5 w-5 ml-2" />
              </>
            )}
          </Button>
        </form>
      )}
    </div>
  );
}
