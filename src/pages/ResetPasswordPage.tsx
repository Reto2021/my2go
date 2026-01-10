import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Lock, Loader2, ArrowRight, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { toast } from 'sonner';

const passwordSchema = z.string().min(6, 'Mindestens 6 Zeichen');

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  
  // Check if user has a valid recovery session
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Check if this is a recovery session
      if (session) {
        setIsValidSession(true);
      } else {
        // Listen for recovery event
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (event === 'PASSWORD_RECOVERY') {
            setIsValidSession(true);
          }
        });
        
        // Give it a moment for the recovery event
        setTimeout(() => {
          setIsCheckingSession(false);
        }, 2000);
        
        return () => subscription.unsubscribe();
      }
      
      setIsCheckingSession(false);
    };
    
    checkSession();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate password
    const result = passwordSchema.safeParse(password);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    // Check passwords match
    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        setError(error.message);
      } else {
        setIsSuccess(true);
        toast.success('Passwort erfolgreich geändert!');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!isValidSession && !isCheckingSession) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 container flex flex-col justify-center py-8">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="flex justify-center mb-6">
              <TalerIcon size={80} />
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Link ungültig</h1>
            <p className="text-muted-foreground mb-8">
              Dieser Link zum Zurücksetzen des Passworts ist ungültig oder abgelaufen. 
              Bitte fordere einen neuen Link an.
            </p>
            
            <button
              onClick={() => navigate('/forgot-password')}
              className="btn-primary w-full h-14"
            >
              Neuen Link anfordern
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 container flex flex-col justify-center py-8">
          <div className="max-w-md mx-auto w-full text-center">
            <div className="flex justify-center mb-6">
              <div className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold mb-4">Passwort geändert!</h1>
            <p className="text-muted-foreground mb-8">
              Dein Passwort wurde erfolgreich geändert. Du kannst dich jetzt mit deinem neuen Passwort anmelden.
            </p>
            
            <button
              onClick={() => navigate('/')}
              className="btn-primary w-full h-14"
            >
              Zur Startseite
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Content */}
      <div className="flex-1 container flex flex-col justify-center py-8">
        <div className="max-w-md mx-auto w-full">
          {/* Hero */}
          <div className="text-center mb-8 animate-in">
            <div className="flex justify-center mb-4">
              <TalerIcon size={80} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Neues Passwort</h1>
            <p className="text-muted-foreground">
              Wähle ein sicheres Passwort mit mindestens 6 Zeichen.
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 animate-in-delayed">
            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Neues Passwort</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mindestens 6 Zeichen"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  className={cn(
                    'w-full h-12 pl-12 pr-12 rounded-2xl',
                    'bg-muted border-2',
                    error ? 'border-destructive' : 'border-transparent',
                    'placeholder:text-muted-foreground/60',
                    'focus:outline-none focus:border-accent focus:bg-background',
                    'transition-all duration-200'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Passwort bestätigen</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Passwort wiederholen"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError(null);
                  }}
                  className={cn(
                    'w-full h-12 pl-12 pr-4 rounded-2xl',
                    'bg-muted border-2',
                    error ? 'border-destructive' : 'border-transparent',
                    'placeholder:text-muted-foreground/60',
                    'focus:outline-none focus:border-accent focus:bg-background',
                    'transition-all duration-200'
                  )}
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="btn-primary w-full h-14 text-base"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Passwort ändern
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}