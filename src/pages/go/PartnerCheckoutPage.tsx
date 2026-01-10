import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, ArrowLeft, ShoppingCart, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { 
  PLANS, 
  POS_KITS, 
  formatCHF,
  MWST_RATE,
  calculateMwSt,
  calculateBrutto,
  type PlanId, 
  type BillingInterval,
  type PosKitId 
} from "@/lib/partner-pricing";

export default function PartnerCheckoutPage() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const planId = (searchParams.get('plan') as PlanId) || 'growth';
  const interval = (searchParams.get('interval') as BillingInterval) || 'monthly';
  
  const [selectedPosKit, setSelectedPosKit] = useState<PosKitId | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const plan = PLANS[planId];
  
  if (!plan) {
    return (
      <div className="container max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Paket nicht gefunden</h1>
        <Button asChild>
          <Link to="/go/partner/pricing">Zurück zur Preisübersicht</Link>
        </Button>
      </div>
    );
  }

  const subscriptionPrice = interval === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice;
  const subscriptionPriceId = interval === 'yearly' ? plan.yearlyPriceId : plan.monthlyPriceId;
  const posKit = selectedPosKit ? POS_KITS[selectedPosKit] : null;
  
  // Netto amounts
  const nettoActivation = plan.activationFee;
  const nettoPosKit = posKit?.price || 0;
  const nettoTodayTotal = nettoActivation + nettoPosKit;
  
  // MwSt calculation
  const mwstAmount = calculateMwSt(nettoTodayTotal);
  const bruttoTodayTotal = calculateBrutto(nettoTodayTotal);
  
  // Subscription MwSt
  const subscriptionMwSt = calculateMwSt(subscriptionPrice);
  const subscriptionBrutto = calculateBrutto(subscriptionPrice);

  const handleCheckout = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-partner-checkout', {
        body: {
          planId,
          interval,
          activationPriceId: plan.activationPriceId,
          subscriptionPriceId,
          posKitPriceId: posKit?.priceId || null,
        }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Fehler beim Checkout",
        description: error.message || "Bitte versuche es erneut.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-20">
      <div className="container max-w-4xl mx-auto px-4">
        <Button
          variant="ghost"
          asChild
          className="mb-6"
        >
          <Link to="/go/partner/pricing">
            <ArrowLeft className="mr-2 w-4 h-4" />
            Zurück zur Preisübersicht
          </Link>
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold mb-2">Checkout</h1>
          <p className="text-muted-foreground mb-8">
            Schliesse deinen Kauf ab und starte mit My 2Go.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-8">
          {/* Main Content */}
          <div className="md:col-span-3 space-y-6">
            {/* Selected Plan */}
            <Card>
              <CardHeader className="pb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Gewähltes Paket
                </h2>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground">{plan.tagline}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      {formatCHF(interval === 'yearly' ? Math.round(plan.yearlyPrice / 12) : plan.monthlyPrice)}/Monat
                    </p>
                    <p className="text-xs text-muted-foreground">
                      exkl. MwSt • {interval === 'yearly' ? 'Jährliche Abrechnung' : 'Monatliche Abrechnung'}
                    </p>
                  </div>
                </div>
                
                <div className="p-3 rounded-lg bg-muted/50 text-sm">
                  <div className="flex justify-between mb-1">
                    <span>Activation Fee (einmalig, sofort fällig)</span>
                    <span className="font-medium">{formatCHF(plan.activationFee)} exkl. MwSt</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Abo-Gebühr (erst nach 30 Tagen Trial)</span>
                    <span>{formatCHF(subscriptionPrice)}/{interval === 'yearly' ? 'Jahr' : 'Monat'} exkl. MwSt</span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Check className="w-4 h-4" />
                  <span>30 Tage kostenloser Trial – erste Abo-Zahlung am Tag 31</span>
                </div>
              </CardContent>
            </Card>

            {/* POS Kit Selection */}
            <Card>
              <CardHeader className="pb-3">
                <h2 className="font-semibold flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  POS Kit hinzufügen (Optional)
                </h2>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.values(POS_KITS).map((kit) => (
                    <div
                      key={kit.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                        selectedPosKit === kit.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedPosKit(selectedPosKit === kit.id ? null : kit.id)}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox 
                          checked={selectedPosKit === kit.id}
                          onCheckedChange={(checked) => 
                            setSelectedPosKit(checked ? kit.id : null)
                          }
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">POS Kit {kit.name}</h4>
                              <p className="text-sm text-muted-foreground">{kit.description}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-semibold">{formatCHF(kit.price)}</span>
                              <p className="text-xs text-muted-foreground">exkl. MwSt</p>
                            </div>
                          </div>
                          <ul className="mt-2 text-xs text-muted-foreground space-y-1">
                            {kit.items.map((item, i) => (
                              <li key={i}>• {item}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <p className="text-xs text-muted-foreground mt-4">
                  Bei Auswahl eines POS Kits wird die Versandadresse im Onboarding erfasst.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="md:col-span-2">
            <Card className="sticky top-24">
              <CardHeader className="pb-3">
                <h2 className="font-semibold">Zusammenfassung</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{plan.name} - Activation Fee</span>
                    <span>{formatCHF(nettoActivation)}</span>
                  </div>
                  {posKit && (
                    <div className="flex justify-between">
                      <span>POS Kit {posKit.name}</span>
                      <span>{formatCHF(nettoPosKit)}</span>
                    </div>
                  )}
                </div>
                
                <Separator />
                
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Zwischensumme (netto)</span>
                    <span>{formatCHF(nettoTodayTotal)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>MwSt (8.1%)</span>
                    <span>{formatCHF(mwstAmount)}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold text-lg">
                  <span>Heute fällig</span>
                  <span>{formatCHF(bruttoTodayTotal)}</span>
                </div>
                <p className="text-xs text-muted-foreground">inkl. MwSt</p>
                
                <div className="text-sm text-muted-foreground p-3 rounded-lg bg-muted/50">
                  <p className="font-medium text-foreground mb-1">Nach 30 Tagen Trial:</p>
                  <div className="flex justify-between">
                    <span>Abo-Gebühr (netto)</span>
                    <span>{formatCHF(subscriptionPrice)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>+ MwSt (8.1%)</span>
                    <span>{formatCHF(subscriptionMwSt)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-foreground mt-1 pt-1 border-t">
                    <span>Total (brutto)</span>
                    <span>{formatCHF(subscriptionBrutto)}/{interval === 'yearly' ? 'Jahr' : 'Monat'}</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleCheckout}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                      Wird geladen...
                    </>
                  ) : (
                    <>
                      Jetzt bezahlen ({formatCHF(bruttoTodayTotal)})
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-center text-muted-foreground">
                  Mit dem Klick stimmst du unseren{" "}
                  <Link to="/go/legal/agb" className="underline hover:text-foreground">
                    AGB
                  </Link>{" "}
                  und{" "}
                  <Link to="/go/legal/datenschutz" className="underline hover:text-foreground">
                    Datenschutzbestimmungen
                  </Link>{" "}
                  zu.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
