import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Check, Sparkles, Loader2, Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useSubscription, TALER_PLUS_COST, TALER_PLUS_DAYS } from '@/hooks/useSubscription';
import { useAuth, useBalance } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PlusUpgradeSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: 'reward' | 'settings' | 'banner';
}

const features = [
  'CHF-Rabatte bei Partnern einlösen',
  'Prozent-Rabatte nutzen',
  '2-für-1 Angebote freischalten',
  'Alle Premium-Rewards verfügbar',
  'Exklusive Partner-Deals',
];

export function PlusUpgradeSheet({ open, onOpenChange, trigger }: PlusUpgradeSheetProps) {
  const { user } = useAuth();
  const { balance, refreshBalance } = useBalance();
  const { createCheckout, isSubscribed, isTrial, trialDaysRemaining, redeemWithTaler } = useSubscription();
  const [isLoading, setIsLoading] = useState<'monthly' | 'yearly' | 'taler' | null>(null);

  const canAffordTaler = balance && balance.taler_balance >= TALER_PLUS_COST;

  const handleCheckout = async (tier: 'monthly' | 'yearly') => {
    if (!user) {
      toast.error('Bitte melde dich an, um 2Go Plus zu abonnieren');
      onOpenChange(false);
      return;
    }

    setIsLoading(tier);
    try {
      await createCheckout(tier);
      onOpenChange(false);
    } catch (error) {
      toast.error('Fehler beim Starten des Checkouts');
    } finally {
      setIsLoading(null);
    }
  };

  const handleTalerRedemption = async () => {
    if (!user) {
      toast.error('Bitte melde dich an');
      onOpenChange(false);
      return;
    }

    if (!canAffordTaler) {
      toast.error(`Du brauchst mindestens ${TALER_PLUS_COST} Taler`);
      return;
    }

    setIsLoading('taler');
    try {
      const result = await redeemWithTaler();
      if (result.success) {
        toast.success(result.message || '2Go Plus aktiviert!');
        refreshBalance();
        onOpenChange(false);
      } else {
        toast.error(result.error || 'Fehler beim Einlösen');
      }
    } catch (error) {
      toast.error('Fehler beim Einlösen');
    } finally {
      setIsLoading(null);
    }
  };

  if (isSubscribed && !isTrial) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="text-left">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500">
              <Crown className="h-5 w-5 text-white" />
            </div>
            <SheetTitle className="text-xl">2Go Plus</SheetTitle>
          </div>
          <SheetDescription>
            Schalte alle Premium-Rewards frei und spare bei unseren Partnern
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Trial Banner */}
          {isTrial && trialDaysRemaining && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30"
            >
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <Sparkles className="h-4 w-4" />
                <span className="font-medium">
                  Noch {trialDaysRemaining} Tage kostenlos testen
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Danach endet dein Testzugang automatisch
              </p>
            </motion.div>
          )}

          {/* Features */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Was ist enthalten?
            </h4>
            <ul className="space-y-2">
              {features.map((feature, i) => (
                <motion.li
                  key={feature}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3"
                >
                  <div className="h-5 w-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-green-600" />
                  </div>
                  <span className="text-sm">{feature}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Taler Redemption Option */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Mit Taler freischalten
            </h4>
            <Card 
              className={cn(
                "cursor-pointer transition-all border-2",
                canAffordTaler 
                  ? "border-amber-500/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10 hover:border-amber-500" 
                  : "opacity-60 border-muted",
                isLoading === 'taler' && "opacity-70 pointer-events-none"
              )}
              onClick={canAffordTaler ? handleTalerRedemption : undefined}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-500/20">
                      <Coins className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold">{TALER_PLUS_DAYS} Tage 2Go Plus</p>
                      <p className="text-sm text-muted-foreground">Mit deinen Talern bezahlen</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-amber-600">{TALER_PLUS_COST}</p>
                    <p className="text-xs text-muted-foreground">Taler</p>
                  </div>
                </div>
                {!canAffordTaler && balance && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Du hast {balance.taler_balance.toLocaleString('de-CH')} Taler (brauchst {TALER_PLUS_COST})
                  </p>
                )}
                {isLoading === 'taler' && (
                  <div className="mt-3 flex justify-center">
                    <Loader2 className="h-5 w-5 animate-spin text-amber-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Pricing Cards */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Oder als Abo
            </h4>
            <div className="grid gap-3">
              {/* Monthly */}
              <Card 
                className={cn(
                  "cursor-pointer transition-all hover:border-accent",
                  isLoading === 'monthly' && "opacity-70 pointer-events-none"
                )}
                onClick={() => handleCheckout('monthly')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">Monatlich</p>
                      <p className="text-sm text-muted-foreground">Flexibel kündbar</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">CHF 4.90</p>
                      <p className="text-xs text-muted-foreground">pro Monat inkl. MwSt.</p>
                    </div>
                  </div>
                  {isLoading === 'monthly' && (
                    <div className="mt-3 flex justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Yearly */}
              <Card 
                className={cn(
                  "cursor-pointer transition-all border-accent bg-accent/5 hover:bg-accent/10",
                  isLoading === 'yearly' && "opacity-70 pointer-events-none"
                )}
                onClick={() => handleCheckout('yearly')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">Jährlich</p>
                        <Badge className="bg-green-500 text-white text-xs">
                          Spare CHF 9.80
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">2 Monate gratis</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold">CHF 49</p>
                      <p className="text-xs text-muted-foreground">pro Jahr inkl. MwSt.</p>
                    </div>
                  </div>
                  {isLoading === 'yearly' && (
                    <div className="mt-3 flex justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Terms */}
          <p className="text-xs text-center text-muted-foreground">
            Mit dem Abschluss stimmst du unseren{' '}
            <a href="/agb" className="underline">AGB</a> und{' '}
            <a href="/datenschutz" className="underline">Datenschutzbestimmungen</a> zu.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
