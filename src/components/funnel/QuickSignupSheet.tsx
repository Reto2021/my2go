import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { trackFunnelEvent, SIGNUP_BONUS_TALER } from '@/lib/funnel-config';
import { toast } from 'sonner';
import talerCoin from '@/assets/taler-coin.png';

interface QuickSignupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  partnerSlug?: string;
  campaignSlug?: string;
}

type SignupMethod = 'email' | 'phone';
type SignupStep = 'method' | 'input' | 'verify';

export function QuickSignupSheet({ 
  isOpen, 
  onClose, 
  onSuccess,
  partnerSlug,
  campaignSlug
}: QuickSignupSheetProps) {
  const [step, setStep] = useState<SignupStep>('method');
  const [method, setMethod] = useState<SignupMethod>('email');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMethodSelect = (selectedMethod: SignupMethod) => {
    setMethod(selectedMethod);
    setStep('input');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (method === 'email') {
        // Simple email/password signup
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/u/welcome`,
            data: {
              funnel_source: 'b2c_acquisition',
              partner_slug: partnerSlug,
              campaign_slug: campaignSlug,
            }
          }
        });

        if (signupError) {
          if (signupError.message.includes('already registered')) {
            // Try to sign in instead
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (signInError) {
              setError('E-Mail bereits registriert. Passwort falsch?');
              setIsLoading(false);
              return;
            }
          } else {
            throw signupError;
          }
        }

        trackFunnelEvent('signup_completed', { method: 'email' });
        onSuccess();
      } else {
        // Phone signup - placeholder for OTP flow
        toast.info('Telefon-Verifizierung kommt bald!');
        setIsLoading(false);
        return;
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('method');
    setEmail('');
    setPhone('');
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-w-lg mx-auto max-h-[90vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2 sticky top-0 bg-card">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors z-10"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="px-6 pb-8 pt-2">
              {/* Bonus badge */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <img src={talerCoin} alt="" className="h-6 w-6" />
                <span className="font-bold text-accent">+{SIGNUP_BONUS_TALER} Taler Bonus</span>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-2">
                {step === 'method' && 'Schnell registrieren'}
                {step === 'input' && (method === 'email' ? 'Mit E-Mail anmelden' : 'Mit Telefon anmelden')}
              </h2>

              <p className="text-muted-foreground text-center mb-6">
                10 Sekunden – dann sind die Taler auf deinem Konto.
              </p>

              {/* Step: Method Selection */}
              {step === 'method' && (
                <div className="space-y-3">
                  <Button
                    onClick={() => handleMethodSelect('email')}
                    variant="outline"
                    size="lg"
                    className="w-full h-14 text-base font-medium rounded-2xl border-2 hover:border-primary"
                  >
                    <Mail className="h-5 w-5 mr-3" />
                    Mit E-Mail weitermachen
                  </Button>

                  <Button
                    onClick={() => handleMethodSelect('phone')}
                    variant="outline"
                    size="lg"
                    className="w-full h-14 text-base font-medium rounded-2xl border-2 hover:border-primary"
                    disabled
                  >
                    <Phone className="h-5 w-5 mr-3" />
                    Mit Telefon (bald verfügbar)
                  </Button>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">oder</span>
                    </div>
                  </div>

                  {/* Social logins - placeholder */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl"
                      disabled
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 h-12 rounded-2xl"
                      disabled
                    >
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                      </svg>
                      Apple
                    </Button>
                  </div>
                </div>
              )}

              {/* Step: Email/Phone Input */}
              {step === 'input' && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {method === 'email' ? (
                    <>
                      <div>
                        <Input
                          type="email"
                          placeholder="deine@email.ch"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="h-14 text-base rounded-2xl"
                          autoFocus
                        />
                      </div>
                      <div>
                        <Input
                          type="password"
                          placeholder="Passwort wählen (min. 6 Zeichen)"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          minLength={6}
                          className="h-14 text-base rounded-2xl"
                        />
                      </div>
                    </>
                  ) : (
                    <div>
                      <Input
                        type="tel"
                        placeholder="+41 79 123 45 67"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="h-14 text-base rounded-2xl"
                        autoFocus
                      />
                    </div>
                  )}

                  {error && (
                    <p className="text-sm text-destructive text-center">{error}</p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isLoading}
                    className="w-full h-14 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Registrieren & Bonus holen
                      </>
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setStep('method')}
                    className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← Zurück
                  </button>
                </form>
              )}

              {/* Trust line */}
              <p className="text-xs text-muted-foreground text-center mt-6">
                Mit der Registrierung akzeptierst du unsere{' '}
                <a href="/u/legal/terms" className="underline">AGB</a>
                {' '}und{' '}
                <a href="/u/legal/privacy" className="underline">Datenschutzrichtlinie</a>.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
