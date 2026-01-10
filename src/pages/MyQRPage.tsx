import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Coins, Copy, Check, Sparkles, Store, Gift, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface UserCode {
  permanent_code: string;
  qr_payload: string | null;
}

export default function MyQRPage() {
  const navigate = useNavigate();
  const { user, balance, isLoading: authLoading } = useAuth();
  const [userCode, setUserCode] = useState<UserCode | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchUserCode();
    }
  }, [user, authLoading, navigate]);

  const fetchUserCode = async () => {
    try {
      const { data, error } = await supabase
        .from('user_codes')
        .select('permanent_code, qr_payload')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .single();

      if (error) throw error;
      setUserCode(data);
    } catch (error) {
      console.error('Error fetching user code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!userCode) return;
    
    try {
      await navigator.clipboard.writeText(userCode.permanent_code);
      setCopied(true);
      toast.success('Code kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kopieren fehlgeschlagen');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-12 text-center">
        <p className="text-muted-foreground mb-4">Bitte melde dich an, um deinen QR-Code zu sehen.</p>
        <Button onClick={() => navigate('/auth')}>Anmelden</Button>
      </div>
    );
  }

  const qrValue = userCode?.qr_payload || userCode?.permanent_code || user.id;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-20 z-40 bg-background/95 backdrop-blur-lg">
        <div className="container py-4">
          <h1 className="text-display-sm">Mein QR-Code</h1>
        </div>
      </header>

      <div className="container py-6 space-y-6">
        {/* QR Code Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col items-center">
              {/* Balance Badge */}
              {balance && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 mb-6">
                  <Coins className="h-4 w-4 text-accent" />
                  <span className="font-bold text-accent">
                    {balance.taler_balance.toLocaleString('de-CH')} Taler
                  </span>
                </div>
              )}

              {/* QR Code */}
              <div className="bg-white p-4 rounded-2xl shadow-lg mb-4">
                <QRCodeSVG
                  value={qrValue}
                  size={200}
                  level="H"
                  includeMargin={false}
                  bgColor="#ffffff"
                  fgColor="#0a4d68"
                />
              </div>

              {/* User Code */}
              {userCode && (
                <button
                  onClick={handleCopy}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl transition-all',
                    'bg-muted hover:bg-muted/80'
                  )}
                >
                  <code className="font-mono font-bold text-lg tracking-wider text-secondary">
                    {userCode.permanent_code}
                  </code>
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">So funktioniert's</h3>
                <p className="text-sm text-muted-foreground">
                  Zeige diesen QR-Code bei unseren Partnern vor. 
                  Für Einkäufe oder Besuche erhältst du automatisch Taler gutgeschrieben!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefits */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-success/5 border-success/20">
            <CardContent className="p-4 text-center">
              <Gift className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Taler bei Besuch</p>
              <p className="font-bold text-success">+5 Taler</p>
            </CardContent>
          </Card>
          <Card className="bg-accent/5 border-accent/20">
            <CardContent className="p-4 text-center">
              <Sparkles className="h-6 w-6 text-accent mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Pro CHF 10 Umsatz</p>
              <p className="font-bold text-accent">+10 Taler</p>
            </CardContent>
          </Card>
        </div>

        {/* CTA to Partners */}
        <Button asChild variant="outline" className="w-full h-12">
          <Link to="/partner">
            <Store className="h-4 w-4 mr-2" />
            Partner in der Nähe finden
            <ArrowRight className="h-4 w-4 ml-auto" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
