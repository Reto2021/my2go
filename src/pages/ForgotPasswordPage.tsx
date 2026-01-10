import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft, Mail, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { TalerIcon } from '@/components/icons/TalerIcon';

const emailSchema = z.string().trim().email('Ungültige E-Mail-Adresse');

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      setError(result.error.errors[0].message);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) {
        // Don't reveal if email exists for security
        setIsSuccess(true);
      } else {
        setIsSuccess(true);
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setIsLoading(false);
    }
  };
  
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
            
            <h1 className="text-2xl font-bold mb-4">E-Mail gesendet!</h1>
            <p className="text-muted-foreground mb-8">
              Falls ein Konto mit <strong>{email}</strong> existiert, erhältst du in Kürze eine E-Mail mit einem Link zum Zurücksetzen deines Passworts.
            </p>
            
            <button
              onClick={() => navigate('/auth')}
              className="btn-primary w-full h-14"
            >
              Zurück zur Anmeldung
              <ArrowRight className="h-5 w-5" />
            </button>
            
            <p className="text-sm text-muted-foreground mt-6">
              Keine E-Mail erhalten?{' '}
              <button 
                onClick={() => setIsSuccess(false)}
                className="text-accent hover:underline font-semibold"
              >
                Erneut senden
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="container py-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
          <ArrowLeft className="h-5 w-5" />
        </button>
      </header>
      
      {/* Content */}
      <div className="flex-1 container flex flex-col justify-center py-8">
        <div className="max-w-md mx-auto w-full">
          {/* Hero */}
          <div className="text-center mb-8 animate-in">
            <div className="flex justify-center mb-4">
              <TalerIcon size={80} />
            </div>
            <h1 className="text-2xl font-bold mb-2">Passwort vergessen?</h1>
            <p className="text-muted-foreground">
              Kein Problem! Gib deine E-Mail-Adresse ein und wir senden dir einen Link zum Zurücksetzen.
            </p>
          </div>
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4 animate-in-delayed">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium">E-Mail-Adresse</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="deine@email.ch"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
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
                  autoComplete="email"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email}
              className="btn-primary w-full h-14 text-base"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Link senden
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
          
          {/* Back to login */}
          <div className="mt-6 text-center">
            <button
              onClick={() => navigate('/auth')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Zurück zur <span className="font-semibold text-accent">Anmeldung</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}