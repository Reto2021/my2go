import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  CheckCircle2, 
  ArrowRight, 
  PartyPopper, 
  Calendar, 
  Package, 
  Download, 
  QrCode, 
  FileText, 
  Loader2,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function PartnerThankYouPage() {
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);
  const [isActivating, setIsActivating] = useState(true);
  const [activationResult, setActivationResult] = useState<{
    success: boolean;
    partnerId?: string;
    partnerCode?: string;
    planId?: string;
    needsOnboarding?: boolean;
    error?: string;
  } | null>(null);
  
  const sessionId = searchParams.get('session_id');
  const hasPosKit = searchParams.get('pos_kit') === 'true';

  useEffect(() => {
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Activate partner on page load
    const activatePartner = async () => {
      if (!sessionId) {
        setIsActivating(false);
        setActivationResult({ success: false, error: "Keine Session-ID gefunden" });
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('activate-partner', {
          body: { sessionId }
        });

        if (error) throw error;

        setActivationResult(data);
        
        // Track checkout completed event
        if (typeof window !== 'undefined' && 'gtag' in window) {
          (window as any).gtag('event', 'checkout_completed', {
            session_id: sessionId,
            has_pos_kit: hasPosKit,
            partner_id: data?.partnerId
          });
        }

        if (data?.success) {
          toast.success("Partner-Account aktiviert! 🎉");
        }
      } catch (error) {
        console.error('Activation error:', error);
        setActivationResult({ 
          success: false, 
          error: error instanceof Error ? error.message : "Aktivierung fehlgeschlagen" 
        });
      } finally {
        setIsActivating(false);
      }
    };

    activatePartner();
  }, [sessionId, hasPosKit]);

  const planName = activationResult?.planId 
    ? activationResult.planId.charAt(0).toUpperCase() + activationResult.planId.slice(1)
    : 'Starter';

  return (
    <div className="py-12 md:py-20 min-h-[80vh] flex items-center">
      <Confetti isActive={showConfetti} playSound={false} />
      
      <div className="container max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {isActivating ? (
            <div className="py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Aktiviere deinen Partner-Account...</p>
            </div>
          ) : activationResult?.error ? (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h1 className="text-2xl font-bold mb-4">Fast geschafft!</h1>
              <p className="text-muted-foreground mb-6">
                Deine Zahlung war erfolgreich, aber wir konnten deinen Account nicht automatisch aktivieren.
                Bitte starte das Onboarding manuell.
              </p>
              <Button asChild size="lg">
                <Link to="/go/partner/onboarding">
                  Onboarding starten
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </>
          ) : (
            <>
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                Willkommen bei My 2Go! 🎉
              </h1>
              
              <p className="text-lg text-muted-foreground mb-2">
                Deine Zahlung war erfolgreich. Dein 30-Tage-Trial startet jetzt.
              </p>
              
              {activationResult?.partnerCode && (
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8">
                  <span className="text-sm text-muted-foreground">Dein Partner-Code:</span>
                  <span className="font-mono font-bold text-primary">{activationResult.partnerCode}</span>
                </div>
              )}
              
              {/* Quick Actions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <a href="#" onClick={(e) => { e.preventDefault(); toast.info("QR-Code wird nach Onboarding verfügbar"); }}>
                    <QrCode className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-xs font-medium">QR-Code</p>
                  </a>
                </Card>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Aufkleber werden nach Onboarding verfügbar"); }}>
                    <Download className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-xs font-medium">Aufkleber</p>
                  </a>
                </Card>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Logo wird nach Onboarding verfügbar"); }}>
                    <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-xs font-medium">Logo</p>
                  </a>
                </Card>
                <Card className="p-4 hover:bg-muted/50 transition-colors cursor-pointer">
                  <a href="#" onClick={(e) => { e.preventDefault(); toast.info("Flyer werden nach Onboarding verfügbar"); }}>
                    <FileText className="w-6 h-6 text-primary mx-auto mb-2" />
                    <p className="text-xs font-medium">Flyer</p>
                  </a>
                </Card>
              </div>
              
              <Card className="mb-8 text-left">
                <CardContent className="p-6">
                  <h2 className="font-semibold mb-4 flex items-center gap-2">
                    <PartyPopper className="w-5 h-5 text-primary" />
                    Nächste Schritte
                  </h2>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">1</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Onboarding abschliessen</h3>
                        <p className="text-sm text-muted-foreground">
                          Firmeninfos, Logo, Öffnungszeiten eingeben – dann bist du startklar!
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">2</span>
                      </div>
                      <div>
                        <h3 className="font-medium">Erstes Reward erstellen</h3>
                        <p className="text-sm text-muted-foreground">
                          Leg dein erstes Angebot an (z.B. 10% Rabatt, Gratis Kaffee).
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm font-bold text-primary">3</span>
                      </div>
                      <div>
                        <h3 className="font-medium">POS-Material platzieren</h3>
                        <p className="text-sm text-muted-foreground">
                          QR-Code drucken, Aufkleber anbringen – und los geht's!
                        </p>
                      </div>
                    </div>
                    
                    {hasPosKit && (
                      <div className="flex items-start gap-4 pt-2 border-t">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                          <Package className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <h3 className="font-medium">POS Kit Versand</h3>
                          <p className="text-sm text-muted-foreground">
                            Dein POS Kit wird nach Abschluss des Onboardings versendet.
                          </p>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                        <Calendar className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-medium">In 7 Tagen startklar</h3>
                        <p className="text-sm text-muted-foreground">
                          Dein My 2Go Setup ist innerhalb einer Woche einsatzbereit.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild size="lg">
                  <Link to="/go/partner/onboarding">
                    Jetzt Onboarding starten
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Link>
                </Button>
                
                <Button asChild variant="outline" size="lg">
                  <Link to="/partner/dashboard">
                    Zum Partner-Dashboard
                  </Link>
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-8">
                Du erhältst in Kürze eine Bestätigungs-E-Mail mit allen Details.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
