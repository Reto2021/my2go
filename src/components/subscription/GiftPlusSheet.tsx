import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Crown, 
  Sparkles, 
  Check, 
  Loader2, 
  Mail, 
  User,
  Heart,
  Send,
  PartyPopper,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Confetti } from '@/components/ui/confetti';

interface GiftPlusSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const giftOptions = [
  { 
    id: 'monthly', 
    name: '1 Monat', 
    price: 4.90, 
    priceId: 'price_gift_monthly',
    description: 'Perfekt zum Ausprobieren',
    popular: false,
  },
  { 
    id: 'yearly', 
    name: '1 Jahr', 
    price: 49, 
    priceId: 'price_gift_yearly',
    description: 'Das ultimative Geschenk',
    popular: true,
    savings: 9.80,
  },
];

const features = [
  'CHF-Rabatte bei allen Partnern',
  'Prozent-Rabatte & 2-für-1 Deals',
  'Exklusive Premium-Rewards',
];

type Step = 'select' | 'details' | 'success';

export function GiftPlusSheet({ open, onOpenChange }: GiftPlusSheetProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>('select');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const [recipientName, setRecipientName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [giftCode, setGiftCode] = useState('');

  const selectedGift = giftOptions.find(o => o.id === selectedOption);

  const handleProceed = () => {
    if (!selectedOption) {
      toast.error('Bitte wähle eine Option');
      return;
    }
    setStep('details');
  };

  const handlePurchaseGift = async () => {
    if (!user) {
      toast.error('Bitte melde dich an');
      return;
    }

    if (!recipientEmail) {
      toast.error('Bitte gib eine E-Mail-Adresse ein');
      return;
    }

    setIsLoading(true);
    try {
      // Create gift purchase through edge function
      const { data, error } = await supabase.functions.invoke('create-gift-checkout', {
        body: {
          giftType: selectedOption,
          recipientEmail,
          recipientName,
          personalMessage,
        },
      });

      if (error) throw error;

      if (data?.url) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else if (data?.giftCode) {
        // Direct gift code (for Taler redemption)
        setGiftCode(data.giftCode);
        setStep('success');
        setShowConfetti(true);
      }
    } catch (error) {
      console.error('Gift purchase error:', error);
      toast.error('Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('select');
    setSelectedOption(null);
    setRecipientName('');
    setRecipientEmail('');
    setPersonalMessage('');
    setGiftCode('');
    onOpenChange(false);
  };

  const copyGiftCode = () => {
    navigator.clipboard.writeText(giftCode);
    toast.success('Code kopiert!');
  };

  return (
    <>
      {showConfetti && <Confetti isActive={showConfetti} />}
      
      <Sheet open={open} onOpenChange={handleClose}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="text-left">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500">
                <Gift className="h-5 w-5 text-white" />
              </div>
              <SheetTitle className="text-xl">2Go Plus verschenken</SheetTitle>
            </div>
            <SheetDescription>
              Schenke jemandem Premium-Zugang zu allen Rewards
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Gift */}
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Features */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20">
                    <div className="flex items-center gap-2 mb-3 text-pink-600 dark:text-pink-400">
                      <Heart className="h-4 w-4" />
                      <span className="font-medium text-sm">Was du verschenkst</span>
                    </div>
                    <ul className="space-y-2">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <Check className="h-4 w-4 text-green-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Gift Options */}
                  <div className="space-y-3">
                    {giftOptions.map((option) => (
                      <Card
                        key={option.id}
                        className={cn(
                          "cursor-pointer transition-all border-2",
                          selectedOption === option.id
                            ? "border-pink-500 bg-pink-500/5"
                            : "border-transparent hover:border-pink-500/50",
                          option.popular && "ring-2 ring-pink-500/20"
                        )}
                        onClick={() => setSelectedOption(option.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                                selectedOption === option.id
                                  ? "border-pink-500 bg-pink-500"
                                  : "border-muted-foreground/30"
                              )}>
                                {selectedOption === option.id && (
                                  <Check className="h-3 w-3 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">{option.name}</span>
                                  {option.popular && (
                                    <Badge className="bg-pink-500 text-white text-xs">
                                      Beliebt
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {option.description}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold">CHF {option.price}</p>
                              {option.savings && (
                                <p className="text-xs text-green-600">
                                  Spare CHF {option.savings}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <Button 
                    onClick={handleProceed}
                    disabled={!selectedOption}
                    className="w-full gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                  >
                    Weiter
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Recipient Details */}
              {step === 'details' && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Selected Summary */}
                  {selectedGift && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-pink-500" />
                        <span className="font-medium">2Go Plus {selectedGift.name}</span>
                      </div>
                      <span className="font-bold">CHF {selectedGift.price}</span>
                    </div>
                  )}

                  {/* Recipient Info */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="recipientName" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Name des Beschenkten
                      </Label>
                      <Input
                        id="recipientName"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        placeholder="z.B. Anna"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recipientEmail" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        E-Mail-Adresse *
                      </Label>
                      <Input
                        id="recipientEmail"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="anna@example.com"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Der Geschenk-Code wird an diese Adresse gesendet
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Persönliche Nachricht (optional)
                      </Label>
                      <Textarea
                        id="message"
                        value={personalMessage}
                        onChange={(e) => setPersonalMessage(e.target.value)}
                        placeholder="Alles Gute zum Geburtstag! 🎉"
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setStep('select')}
                      className="flex-1"
                    >
                      Zurück
                    </Button>
                    <Button
                      onClick={handlePurchaseGift}
                      disabled={isLoading || !recipientEmail}
                      className="flex-1 gap-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Kaufen & Senden
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Success */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center"
                  >
                    <PartyPopper className="h-10 w-10 text-white" />
                  </motion.div>

                  <div>
                    <h3 className="text-xl font-bold mb-2">Geschenk gesendet! 🎁</h3>
                    <p className="text-muted-foreground">
                      {recipientName || 'Der Beschenkte'} erhält eine E-Mail mit dem Geschenk-Code
                    </p>
                  </div>

                  {giftCode && (
                    <div 
                      className="p-4 rounded-xl bg-muted cursor-pointer hover:bg-muted/80 transition-colors"
                      onClick={copyGiftCode}
                    >
                      <p className="text-xs text-muted-foreground mb-1">Geschenk-Code (zum Kopieren klicken)</p>
                      <p className="font-mono font-bold text-lg tracking-wider">{giftCode}</p>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-pink-500/10 border border-pink-500/20">
                    <div className="flex items-center gap-2 text-pink-600 dark:text-pink-400 mb-2">
                      <Sparkles className="h-4 w-4" />
                      <span className="font-medium">Was passiert jetzt?</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {recipientName || 'Der Beschenkte'} kann den Code unter{' '}
                      <span className="font-medium">/code</span> einlösen und 
                      sofort alle Premium-Rewards nutzen!
                    </p>
                  </div>

                  <Button onClick={handleClose} className="w-full">
                    Fertig
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
