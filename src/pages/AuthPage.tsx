import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { signIn, signUp } from '@/lib/supabase-helpers';
import { z } from 'zod';
import { Mail, Lock, User, ArrowRight, Loader2, Gift, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { PhoneInput } from '@/components/ui/phone-input';
import { HeroDynamic } from '@/components/ui/HeroDynamic';
import { HeroAnimations } from '@/components/ui/HeroAnimations';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';

const emailSchema = z.string().email('Ungültige E-Mail-Adresse');
const passwordSchema = z.string().min(6, 'Mindestens 6 Zeichen');
const firstNameSchema = z.string().min(1, 'Vorname ist erforderlich').max(50, 'Maximal 50 Zeichen');
const phoneSchema = z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Ungültige Telefonnummer (z.B. +41791234567 oder +4915123456789)');

export default function AuthPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; phone?: string; firstName?: string; marketing?: string; terms?: string }>({});
  
  // Check for referral code in URL
  const referralCode = searchParams.get('ref') || '';
  
  // If referral code is present, default to signup mode
  useEffect(() => {
    if (referralCode) {
      setMode('signup');
    }
  }, [referralCode]);
  
  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/');
      }
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        // Process referral after signup
        if (event === 'SIGNED_IN' && referralCode) {
          processReferral(session.user.id, referralCode);
        }
        navigate('/');
      }
    });
    
    return () => subscription.unsubscribe();
  }, [navigate, referralCode]);
  
  const processReferral = async (userId: string, code: string) => {
    try {
      const { data, error } = await supabase.rpc('process_referral', {
        _referred_user_id: userId,
        _referral_code: code
      });
      
      const result = data as { success?: boolean; referred_bonus?: number } | null;
      
      if (result?.success) {
        toast({
          title: 'Empfehlungsbonus! 🎁',
          description: `Du hast ${result.referred_bonus} Taler durch die Empfehlung erhalten!`,
        });
      }
    } catch (error) {
      console.error('Referral processing error:', error);
    }
  };
  
  const validateForm = (): boolean => {
    const newErrors: { email?: string; password?: string; phone?: string; firstName?: string; marketing?: string; terms?: string } = {};
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = e.errors[0].message;
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (mode === 'signup') {
      try {
        firstNameSchema.parse(firstName);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.firstName = e.errors[0].message;
        }
      }
      
      try {
        phoneSchema.parse(phone);
      } catch (e) {
        if (e instanceof z.ZodError) {
          newErrors.phone = e.errors[0].message;
        }
      }
      
      // Marketing consent is required for signup
      if (!marketingConsent) {
        newErrors.marketing = 'Bitte stimme zu, um fortzufahren';
      }
      
      // Terms acceptance is required for signup (Swiss nDSG compliance)
      if (!termsAccepted) {
        newErrors.terms = 'Bitte akzeptiere die AGB und Datenschutzerklärung';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      
      if (error) {
        toast({
          title: 'Google-Anmeldung fehlgeschlagen',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      toast({
        title: 'Fehler',
        description: 'Google-Anmeldung konnte nicht gestartet werden.',
        variant: 'destructive',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      if (mode === 'signup') {
        const { data, error } = await signUp(email, password, firstName, phone, marketingConsent);
        
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'E-Mail bereits registriert',
              description: 'Bitte melde dich an oder verwende eine andere E-Mail.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Registrierung fehlgeschlagen',
              description: error.message,
              variant: 'destructive',
            });
          }
          return;
        }
        
        // Store terms acceptance timestamp (Swiss nDSG compliance)
        if (data?.user) {
          await supabase
            .from('profiles')
            .update({ terms_accepted_at: new Date().toISOString() })
            .eq('id', data.user.id);
        }
        
        toast({
          title: 'Willkommen! 🎉',
          description: 'Dein Konto wurde erstellt. Du erhältst 50 Willkommens-Taler!',
        });
      } else {
        const { data, error } = await signIn(email, password);
        
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: 'Anmeldung fehlgeschlagen',
              description: 'E-Mail oder Passwort ist falsch.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Anmeldung fehlgeschlagen',
              description: error.message,
              variant: 'destructive',
            });
          }
          return;
        }
        
        toast({
          title: 'Willkommen zurück!',
          description: 'Du wurdest erfolgreich angemeldet.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const { timeOfDay } = useTimeOfDay();
  const showBirds = timeOfDay !== 'night';

  return (
    <div className="min-h-screen bg-background flex flex-col -mt-20">
      {/* Dynamic Hero Background */}
      <section className="relative overflow-hidden pt-20" style={{ minHeight: '28vh' }}>
        <HeroDynamic />
        {showBirds && <HeroAnimations />}
        
        {/* Bottom gradient fade */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-24 z-[4] pointer-events-none"
          style={{ background: 'linear-gradient(to top, hsl(var(--background)), transparent)' }}
        />
        
        {/* Taler icon on hero */}
        <div className="container relative z-10 flex flex-col items-center justify-end pb-2" style={{ minHeight: '8vh' }}>
          <div className="drop-shadow-lg">
            <TalerIcon size={80} />
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="flex-1 container flex flex-col py-4">
        <div className="max-w-md mx-auto w-full">
          {/* Title */}
          <div className="text-center mb-6 animate-in">
            <h1 className="text-2xl font-bold mb-2">
              {mode === 'login' ? 'Willkommen zurück!' : 'Jetzt registrieren'}
            </h1>
            <p className="text-muted-foreground">
              {mode === 'login' 
                ? 'Melde dich an, um deine Taler zu verwalten.' 
                : 'Erstelle dein Konto und erhalte 50 Willkommens-Taler!'}
            </p>
          </div>
          
          {/* Referral Banner */}
          {mode === 'signup' && referralCode && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/10 border border-primary/20 mb-4 animate-in">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Du wurdest eingeladen!</p>
                <p className="text-sm text-muted-foreground">Code: {referralCode}</p>
              </div>
            </div>
          )}
          
          {/* Signup Bonus Banner */}
          {mode === 'signup' && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-accent/10 border border-accent/20 mb-6 animate-in">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20">
                <Gift className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {referralCode ? '75 Willkommens-Taler' : '50 Willkommens-Taler'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {referralCode ? '50 + 25 Empfehlungsbonus!' : 'Sofort nach der Registrierung'}
                </p>
              </div>
            </div>
          )}
          
          {/* Form - Email/Password only */}
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 animate-in-delayed">
            {/* First Name (required for signup) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Vorname *</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Dein Vorname"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setErrors(prev => ({ ...prev, firstName: undefined }));
                    }}
                    className={cn(
                      'w-full h-12 pl-12 pr-4 rounded-2xl',
                      'bg-muted border-2',
                      errors.firstName ? 'border-destructive' : 'border-transparent',
                      'placeholder:text-muted-foreground/60',
                      'focus:outline-none focus:border-accent focus:bg-background',
                      'transition-all duration-200'
                    )}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-sm text-destructive">{errors.firstName}</p>
                )}
              </div>
            )}
            
            {/* Phone (required for signup) */}
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefon *</label>
                <PhoneInput
                  value={phone}
                  onChange={(val) => {
                    setPhone(val);
                    setErrors(prev => ({ ...prev, phone: undefined }));
                  }}
                  error={!!errors.phone}
                  variant="auth"
                  placeholder="79 123 45 67"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive">{errors.phone}</p>
                )}
              </div>
            )}
            
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">E-Mail</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="deine@email.ch"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  className={cn(
                    'w-full h-12 pl-12 pr-4 rounded-2xl',
                    'bg-muted border-2',
                    errors.email ? 'border-destructive' : 'border-transparent',
                    'placeholder:text-muted-foreground/60',
                    'focus:outline-none focus:border-accent focus:bg-background',
                    'transition-all duration-200'
                  )}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Passwort</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder={mode === 'signup' ? 'Mindestens 6 Zeichen' : 'Dein Passwort'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  className={cn(
                    'w-full h-12 pl-12 pr-4 rounded-2xl',
                    'bg-muted border-2',
                    errors.password ? 'border-destructive' : 'border-transparent',
                    'placeholder:text-muted-foreground/60',
                    'focus:outline-none focus:border-accent focus:bg-background',
                    'transition-all duration-200'
                  )}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
              {mode === 'login' && (
                <a 
                  href="/forgot-password" 
                  className="text-sm text-accent hover:underline"
                >
                  Passwort vergessen?
                </a>
              )}
            </div>
            
            {/* Marketing Opt-in - REQUIRED for signup, placed before submit button */}
            {mode === 'signup' && (
              <div className={cn(
                "p-4 rounded-2xl border-2 transition-all",
                errors.marketing 
                  ? "border-destructive bg-destructive/5" 
                  : marketingConsent 
                    ? "border-primary/30 bg-primary/5" 
                    : "border-transparent bg-muted/50"
              )}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="marketingConsent"
                    checked={marketingConsent}
                    onChange={(e) => {
                      setMarketingConsent(e.target.checked);
                      setErrors(prev => ({ ...prev, marketing: undefined }));
                    }}
                    className="mt-0.5 h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-foreground block">
                      🎁 Ja, ich will exklusive Vorteile! *
                    </span>
                    <span className="text-xs text-muted-foreground block leading-relaxed">
                      Ich möchte per E-Mail, SMS und WhatsApp über <strong>exklusive Aktionen, Bonus-Taler und Partner-Angebote</strong> informiert werden. 
                      Abmeldung jederzeit möglich.
                    </span>
                  </div>
                </label>
                {errors.marketing && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <span>⚠️</span> {errors.marketing}
                  </p>
                )}
              </div>
            )}

            {/* Terms & Privacy Acceptance - Required for signup (Swiss nDSG) */}
            {mode === 'signup' && (
              <div className={cn(
                "p-4 rounded-2xl border-2 transition-all",
                errors.terms 
                  ? "border-destructive bg-destructive/5" 
                  : termsAccepted 
                    ? "border-primary/30 bg-primary/5" 
                    : "border-transparent bg-muted/50"
              )}>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    id="termsAccepted"
                    checked={termsAccepted}
                    onChange={(e) => {
                      setTermsAccepted(e.target.checked);
                      setErrors(prev => ({ ...prev, terms: undefined }));
                    }}
                    className="mt-0.5 h-5 w-5 rounded border-border text-primary focus:ring-primary accent-primary"
                  />
                  <div className="space-y-1">
                    <span className="text-sm text-foreground block leading-relaxed">
                      Ich akzeptiere die{' '}
                      <a href="/agb" target="_blank" className="text-accent underline hover:no-underline">AGB</a>
                      {' '}und{' '}
                      <a href="/datenschutz" target="_blank" className="text-accent underline hover:no-underline">Datenschutzerklärung</a>
                      {' '}und stimme der Erhebung meiner Nutzungsdaten (inkl. Radio-Hördaten) gemäss der Datenschutzerklärung zu. *
                    </span>
                  </div>
                </label>
                {errors.terms && (
                  <p className="text-sm text-destructive mt-2 flex items-center gap-1">
                    <span>⚠️</span> {errors.terms}
                  </p>
                )}
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full h-14 text-base"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Anmelden' : 'Registrieren'}
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
            
            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-background px-3 text-muted-foreground">oder</span>
              </div>
            </div>
            
            {/* Google Sign In */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="w-full h-12 flex items-center justify-center gap-3 rounded-2xl border-2 border-muted-foreground/20 bg-background hover:bg-muted/50 transition-colors font-medium"
            >
              {isGoogleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Mit Google {mode === 'login' ? 'anmelden' : 'registrieren'}
                </>
              )}
            </button>
          </form>
          
          {/* Toggle Mode - More Prominent */}
          <div className="mt-6 p-4 rounded-2xl bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {mode === 'login' ? 'Noch kein Konto?' : 'Bereits registriert?'}
            </p>
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setErrors({});
              }}
              className="font-semibold text-accent hover:underline transition-colors"
            >
              {mode === 'login' ? 'Jetzt kostenlos registrieren' : 'Hier anmelden'}
            </button>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="container pb-8 space-y-2">
        <p className="text-xs text-muted-foreground text-center">
          Mit der Registrierung akzeptierst du unsere{' '}
          <a href="/agb" className="text-secondary hover:underline">Nutzungsbedingungen</a>
          {' '}und{' '}
          <a href="/datenschutz" className="text-secondary hover:underline">Datenschutzerklärung</a>.
        </p>
        <p className="text-xs text-muted-foreground text-center">
          <a href="/impressum" className="hover:underline">Impressum</a>
        </p>
      </footer>
    </div>
  );
}
