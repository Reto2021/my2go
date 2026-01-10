import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, PartyPopper, Calendar, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Confetti } from "@/components/ui/confetti";

export default function PartnerThankYouPage() {
  const [searchParams] = useSearchParams();
  const [showConfetti, setShowConfetti] = useState(true);
  
  const sessionId = searchParams.get('session_id');
  const hasPosKit = searchParams.get('pos_kit') === 'true';

  useEffect(() => {
    // Track checkout completed event
    if (typeof window !== 'undefined' && 'gtag' in window) {
      (window as any).gtag('event', 'checkout_completed', {
        session_id: sessionId,
        has_pos_kit: hasPosKit
      });
    }
    
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [sessionId, hasPosKit]);

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
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Willkommen bei My 2Go! 🎉
          </h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            Deine Zahlung war erfolgreich. Dein 30-Tage-Trial startet jetzt.
          </p>
          
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
                      Fülle deine Firmendaten aus, damit wir dein Setup starten können.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">2</span>
                  </div>
                  <div>
                    <h3 className="font-medium">Kickoff-Call buchen (optional)</h3>
                    <p className="text-sm text-muted-foreground">
                      15 Minuten mit unserem Team, um alles zu besprechen.
                    </p>
                  </div>
                </div>
                
                {hasPosKit && (
                  <div className="flex items-start gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-primary" />
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
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-primary" />
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
              <Link to="/partner-portal">
                Zum Partner-Dashboard
              </Link>
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-8">
            Du erhältst in Kürze eine Bestätigungs-E-Mail mit allen Details.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
