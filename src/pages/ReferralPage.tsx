import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Copy, Share2, Users, Gift, Check, Loader2 } from 'lucide-react';
import { useAuth, useUserCode } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodeSVG } from 'qrcode.react';

export default function ReferralPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const userCode = useUserCode();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const referralCode = userCode?.permanent_code || '';
  const referralCount = profile?.referral_count || 0;
  
  // Build the referral link
  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/auth?ref=${encodeURIComponent(referralCode)}`;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Kopieren fehlgeschlagen');
    }
  };
  
  const handleShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }
    
    setIsSharing(true);
    try {
      await navigator.share({
        title: 'Radio 2Go Taler',
        text: `Melde dich bei Radio 2Go an und wir erhalten beide 25 Taler! Nutze meinen Code: ${referralCode}`,
        url: referralLink,
      });
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error).name !== 'AbortError') {
        handleCopy();
      }
    } finally {
      setIsSharing(false);
    }
  };
  
  if (!user) {
    return (
      <div className="min-h-screen pb-24 bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Bitte melde dich an.</p>
          <button 
            onClick={() => navigate('/auth')}
            className="btn-primary mt-4"
          >
            Zur Anmeldung
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen pb-24 bg-background">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
        <div className="container py-4 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 -ml-2">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold">Freunde einladen</h1>
        </div>
      </header>
      
      <div className="container py-6 space-y-6">
        {/* Hero Section */}
        <section className="animate-in text-center">
          <div className="h-20 w-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <Gift className="h-10 w-10 text-accent" />
          </div>
          <h2 className="text-2xl font-bold mb-2">25 Taler für euch beide!</h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Teile deinen persönlichen Empfehlungscode und erhalte 25 Taler, wenn sich ein Freund anmeldet.
          </p>
        </section>
        
        {/* Stats Card */}
        <section className="animate-in">
          <div className="card-base p-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Users className="h-5 w-5 text-accent" />
              <span className="text-3xl font-bold">{referralCount}</span>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {referralCount === 1 ? 'Freund geworben' : 'Freunde geworben'}
            </p>
            {referralCount > 0 && (
              <p className="text-sm text-accent font-medium text-center mt-1">
                = {referralCount * 25} Taler verdient
              </p>
            )}
          </div>
        </section>
        
        {/* QR Code */}
        <section className="animate-in">
          <div className="card-base p-6 flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl mb-4">
              <QRCodeSVG 
                value={referralLink}
                size={160}
                level="M"
                includeMargin={false}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Lass Freunde diesen QR-Code scannen
            </p>
          </div>
        </section>
        
        {/* Referral Code */}
        <section className="animate-in">
          <div className="card-base p-6">
            <p className="text-sm text-muted-foreground text-center mb-3">Dein Empfehlungscode</p>
            <div className="bg-muted/50 rounded-xl p-4 text-center">
              <p className="text-2xl font-mono font-bold tracking-widest text-foreground">
                {referralCode}
              </p>
            </div>
          </div>
        </section>
        
        {/* Action Buttons */}
        <section className="animate-in space-y-3">
          <button 
            onClick={handleShare}
            disabled={isSharing}
            className="btn-primary w-full"
          >
            {isSharing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Share2 className="h-5 w-5" />
            )}
            Link teilen
          </button>
          
          <button 
            onClick={handleCopy}
            className="btn-outline w-full"
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 text-success" />
                Kopiert!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5" />
                Link kopieren
              </>
            )}
          </button>
        </section>
        
        {/* How it works */}
        <section className="animate-in-delayed">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
            So funktioniert's
          </h3>
          <div className="space-y-4">
            <Step number={1} text="Teile deinen persönlichen Empfehlungslink" />
            <Step number={2} text="Dein Freund meldet sich mit dem Link an" />
            <Step number={3} text="Ihr erhaltet beide 25 Taler Bonus!" />
          </div>
        </section>
      </div>
    </div>
  );
}

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-bold text-accent">{number}</span>
      </div>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  );
}
