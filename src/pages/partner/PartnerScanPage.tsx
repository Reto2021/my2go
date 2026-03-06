import { useState, useEffect, useRef, useCallback } from 'react';
import { usePartner } from '@/components/partner/PartnerGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  ShoppingCart, 
  Store, 
  CheckCircle, 
  Loader2,
  Coins,
  User,
  ArrowRight,
  RotateCcw,
  Camera,
  X,
  Grid3X3,
  Stamp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Html5Qrcode } from 'html5-qrcode';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { TalerIcon } from '@/components/icons/TalerIcon';

type TransactionType = 'visit' | 'purchase' | 'stamp';

interface TransactionResult {
  success: boolean;
  taler_awarded?: number;
  user_name?: string;
  new_balance?: number;
  error?: string;
}

interface StampResult {
  success: boolean;
  card?: {
    current_position: number;
    total_purchases: number;
    is_completed: boolean;
  };
  move_type?: string;
  is_new_shop?: boolean;
  partner_name?: string;
  sponsored_bonus?: { type: string; value: number; text: string } | null;
  milestone_reward?: { at_purchase: number; type: string; value: number; label?: string } | null;
  completion_reward?: { taler: number; description: string } | null;
  completion_blocked?: string | null;
  unique_shops?: number;
  required_purchases?: number;
  error?: string;
}

export default function PartnerScanPage() {
  const { partnerInfo } = usePartner();
  const [userCode, setUserCode] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>('visit');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [stampResult, setStampResult] = useState<StampResult | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<HTMLDivElement>(null);

  // Fetch active collecting campaigns for this partner
  const { data: partnerCampaigns = [] } = useQuery({
    queryKey: ['partner-collecting-campaigns', partnerInfo?.partnerId],
    queryFn: async () => {
      if (!partnerInfo?.partnerId) return [];
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('collecting_campaigns' as any)
        .select('id, slug, title, subtitle, required_purchases, prize_description, prize_taler, grid_size')
        .eq('is_active', true)
        .or(`ends_at.is.null,ends_at.gte.${now}`);
      if (error) throw error;
      return (data as any[]) || [];
    },
    enabled: !!partnerInfo?.partnerId,
  });

  // Auto-select first campaign
  useEffect(() => {
    if (partnerCampaigns.length > 0 && !selectedCampaign) {
      setSelectedCampaign(partnerCampaigns[0].slug);
    }
  }, [partnerCampaigns, selectedCampaign]);

  // Stop scanner when component unmounts or scanner closes
  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.log('Scanner stop error:', err);
      }
      scannerRef.current = null;
    }
    setIsScannerOpen(false);
    setScannerError(null);
  }, []);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  const startScanner = useCallback(async () => {
    if (!scannerContainerRef.current) return;
    
    setIsScannerOpen(true);
    setScannerError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 100));
      
      scannerRef.current = new Html5Qrcode('qr-scanner-container');
      
      await scannerRef.current.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        (decodedText) => {
          setUserCode(decodedText.toUpperCase());
          toast.success('QR-Code erkannt!');
          stopScanner();
        },
        () => {}
      );
    } catch (err: any) {
      console.error('Scanner error:', err);
      setScannerError(
        err.message?.includes('NotAllowedError') || err.name === 'NotAllowedError'
          ? 'Kamera-Zugriff wurde verweigert. Bitte erlaube den Zugriff in den Browser-Einstellungen.'
          : err.message?.includes('NotFoundError') || err.name === 'NotFoundError'
          ? 'Keine Kamera gefunden.'
          : 'Kamera konnte nicht gestartet werden.'
      );
    }
  }, [stopScanner]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isScannerOpen && !result && !stampResult) {
        startScanner();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!isScannerOpen && !result && !stampResult) {
      inputRef.current?.focus();
    }
  }, [isScannerOpen, result, stampResult]);

  const handleStampSubmit = async () => {
    const trimmedCode = userCode.trim().toUpperCase();
    if (!trimmedCode || !partnerInfo?.partnerId || !selectedCampaign) return;

    setIsSubmitting(true);
    setStampResult(null);

    try {
      // The userCode could be the user's UUID or their permanent code
      // We need to resolve the user_id from the code
      // The collecting-card-scan expects partner_id and campaign_slug + auth token
      // But here the PARTNER is scanning the USER's code
      // So we need to look up the user from the code first
      
      const { data: userCodeData } = await supabase
        .from('user_codes' as any)
        .select('user_id')
        .eq('permanent_code', trimmedCode)
        .eq('is_active', true)
        .single() as any;

      const userId = (userCodeData as any)?.user_id || trimmedCode;

      // Call collecting-card-scan as service (partner acting on behalf of user)
      const response = await supabase.functions.invoke('collecting-card-scan', {
        body: {
          partner_id: partnerInfo.partnerId,
          campaign_slug: selectedCampaign,
          on_behalf_of_user: userId,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data as StampResult;
      setStampResult(data);

      if (data.success) {
        const msgs: string[] = [`Stempel gesetzt! (${data.card?.total_purchases}/${data.required_purchases})`];
        if (data.milestone_reward) msgs.push(`🎉 Meilenstein: +${data.milestone_reward.value} Taler`);
        if (data.sponsored_bonus) msgs.push(`⭐ Bonus: +${data.sponsored_bonus.value} Taler`);
        if (data.completion_reward) msgs.push(`🏆 Karte voll! ${data.completion_reward.description}`);
        toast.success(msgs.join('\n'));
      } else {
        toast.error(data.error || 'Stempel fehlgeschlagen');
      }
    } catch (error: any) {
      console.error('Stamp error:', error);
      setStampResult({
        success: false,
        error: error.message || 'Verbindungsfehler. Bitte versuche es erneut.',
      });
      toast.error('Fehler beim Stempeln');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (transactionType === 'stamp') {
      return handleStampSubmit();
    }
    
    const trimmedCode = userCode.trim().toUpperCase();
    if (!trimmedCode || !partnerInfo?.partnerId) return;

    if (transactionType === 'purchase' && (!purchaseAmount || parseFloat(purchaseAmount) <= 0)) {
      toast.error('Bitte gib einen gültigen Betrag ein');
      return;
    }

    setIsSubmitting(true);
    setResult(null);

    try {
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
    setStampResult(null);
    setUserCode('');
    setPurchaseAmount('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const hasActiveResult = result || stampResult;
  const isSuccess = result?.success || stampResult?.success;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Kunden scannen</h1>
        <p className="text-muted-foreground">
          Scanne den QR-Code oder gib den Code manuell ein
        </p>
      </div>

      {/* Camera Scanner Modal */}
      {isScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col">
          <div className="flex items-center justify-between p-4 text-white">
            <h2 className="text-lg font-semibold">QR-Code scannen</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={stopScanner}
              className="text-white hover:bg-white/20"
            >
              <X className="h-6 w-6" />
            </Button>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="relative w-full max-w-sm">
              {scannerError ? (
                <div className="text-center text-white p-8">
                  <Camera className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-red-400 mb-4">{scannerError}</p>
                  <Button onClick={stopScanner} variant="secondary">
                    Schliessen
                  </Button>
                </div>
              ) : (
                <>
                  <div 
                    id="qr-scanner-container" 
                    ref={scannerContainerRef}
                    className="w-full aspect-square rounded-xl overflow-hidden"
                  />
                  <p className="text-center text-white/70 text-sm mt-4">
                    Halte den QR-Code des Kunden in den Rahmen
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {hasActiveResult ? (
        // Result State
        stampResult ? (
          // Stamp Result
          <Card className={cn(
            'overflow-hidden',
            stampResult.success ? 'border-accent/50 bg-accent/5' : 'border-destructive/50 bg-destructive/5'
          )}>
            <CardContent className="p-6 text-center">
              {stampResult.success ? (
                <>
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                    {stampResult.card?.is_completed ? (
                      <CheckCircle className="h-8 w-8 text-accent" />
                    ) : (
                      <Grid3X3 className="h-8 w-8 text-accent" />
                    )}
                  </div>
                  
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    {stampResult.card?.is_completed ? '🏆 Karte voll!' : 'Stempel gesetzt!'}
                  </h2>

                  {/* Progress */}
                  <div className="mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-2xl font-bold text-accent">
                        {stampResult.card?.total_purchases}
                      </span>
                      <span className="text-muted-foreground">/ {stampResult.required_purchases}</span>
                    </div>
                    <Progress 
                      value={(stampResult.card?.total_purchases ?? 0) / (stampResult.required_purchases ?? 1) * 100} 
                      className="h-3 mb-1" 
                    />
                    <p className="text-xs text-muted-foreground">
                      {stampResult.is_new_shop ? '🆕 Neuer Shop!' : '🔄 Erneuter Besuch'}
                    </p>
                  </div>

                  {/* Milestone */}
                  {stampResult.milestone_reward && (
                    <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-accent/10 mb-3">
                      <TalerIcon className="h-5 w-5" />
                      <span className="font-bold text-accent">
                        +{stampResult.milestone_reward.value} Bonus-Taler
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({stampResult.milestone_reward.label})
                      </span>
                    </div>
                  )}

                  {/* Sponsored bonus */}
                  {stampResult.sponsored_bonus && (
                    <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 mb-3">
                      <TalerIcon className="h-5 w-5" />
                      <span className="font-bold text-primary">
                        +{stampResult.sponsored_bonus.value} Taler
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({stampResult.sponsored_bonus.text})
                      </span>
                    </div>
                  )}

                  {/* Completion reward */}
                  {stampResult.completion_reward && (
                    <div className="p-4 rounded-xl bg-accent/15 border border-accent/30 mb-4">
                      <p className="font-bold text-accent mb-1">🎉 Preis freigeschaltet!</p>
                      <p className="text-sm text-muted-foreground">{stampResult.completion_reward.description}</p>
                      {stampResult.completion_reward.taler > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-2">
                          <TalerIcon className="h-4 w-4" />
                          <span className="font-bold text-accent">+{stampResult.completion_reward.taler} Taler</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Completion blocked */}
                  {stampResult.completion_blocked && (
                    <p className="text-sm text-amber-600 mb-3">⚠️ {stampResult.completion_blocked}</p>
                  )}

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
                  <h2 className="text-xl font-bold text-foreground mb-2">Fehler</h2>
                  <p className="text-muted-foreground mb-6">{stampResult.error}</p>
                  <Button onClick={handleReset} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Erneut versuchen
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        ) : (
          // Regular Transaction Result
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
                  <h2 className="text-xl font-bold text-foreground mb-2">Erfolgreich!</h2>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <span className="text-lg font-semibold">{result?.user_name}</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-accent/10 mb-4">
                    <Coins className="h-6 w-6 text-accent" />
                    <span className="text-2xl font-bold text-accent">+{result?.taler_awarded} Taler</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Neues Guthaben: {result?.new_balance?.toLocaleString('de-CH')} Taler
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
                  <h2 className="text-xl font-bold text-foreground mb-2">Fehler</h2>
                  <p className="text-muted-foreground mb-6">{result?.error}</p>
                  <Button onClick={handleReset} variant="outline" className="w-full">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Erneut versuchen
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )
      ) : (
        // Input Form
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* QR Scanner Button */}
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={startScanner}
            className="w-full h-20 text-lg border-dashed border-2 hover:border-accent hover:bg-accent/5"
          >
            <Camera className="h-8 w-8 mr-3" />
            <div className="text-left">
              <div className="font-semibold">Kamera öffnen</div>
              <div className="text-sm text-muted-foreground font-normal">
                QR-Code mit Kamera scannen
              </div>
            </div>
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                oder manuell eingeben
              </span>
            </div>
          </div>

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
                placeholder="2GO-XXXXX"
                value={userCode}
                onChange={(e) => setUserCode(e.target.value.toUpperCase())}
                className="h-14 text-center text-xl font-mono font-bold uppercase tracking-wider"
                maxLength={20}
                autoComplete="off"
                autoCapitalize="characters"
              />
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
                className={cn(
                  "grid gap-3",
                  partnerCampaigns.length > 0 ? "grid-cols-3" : "grid-cols-2"
                )}
              >
                <Label
                  htmlFor="visit"
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    transactionType === 'visit'
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  )}
                >
                  <RadioGroupItem value="visit" id="visit" className="sr-only" />
                  <Store className="h-6 w-6" />
                  <span className="font-semibold text-sm">Besuch</span>
                  <span className="text-xs text-muted-foreground">+5 Taler</span>
                </Label>
                
                <Label
                  htmlFor="purchase"
                  className={cn(
                    'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all',
                    transactionType === 'purchase'
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-accent/50'
                  )}
                >
                  <RadioGroupItem value="purchase" id="purchase" className="sr-only" />
                  <ShoppingCart className="h-6 w-6" />
                  <span className="font-semibold text-sm">Einkauf</span>
                  <span className="text-xs text-muted-foreground">1 Taler/CHF</span>
                </Label>

                {partnerCampaigns.length > 0 && (
                  <Label
                    htmlFor="stamp"
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all relative',
                      transactionType === 'stamp'
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <RadioGroupItem value="stamp" id="stamp" className="sr-only" />
                    <Grid3X3 className="h-6 w-6" />
                    <span className="font-semibold text-sm">Stempel</span>
                    <span className="text-xs text-muted-foreground">Sammelkarte</span>
                    <Badge className="absolute -top-2 -right-2 text-[9px] px-1.5 py-0.5 bg-primary text-primary-foreground">
                      NEU
                    </Badge>
                  </Label>
                )}
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

          {/* Campaign Selector (for stamp mode) */}
          {transactionType === 'stamp' && partnerCampaigns.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5" />
                  Sammelkarte wählen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {partnerCampaigns.map((campaign: any) => (
                  <button
                    key={campaign.id}
                    type="button"
                    onClick={() => setSelectedCampaign(campaign.slug)}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all',
                      selectedCampaign === campaign.slug
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Grid3X3 className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{campaign.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{campaign.subtitle}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {campaign.required_purchases} Stempel
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-14 text-lg"
            disabled={
              !userCode.trim() || 
              isSubmitting || 
              (transactionType === 'purchase' && (!purchaseAmount || parseFloat(purchaseAmount) <= 0)) ||
              (transactionType === 'stamp' && !selectedCampaign)
            }
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Verarbeite...
              </>
            ) : transactionType === 'stamp' ? (
              <>
                <Grid3X3 className="h-5 w-5 mr-2" />
                Stempel setzen
                <ArrowRight className="h-5 w-5 ml-2" />
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
