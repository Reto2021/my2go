import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Coins, Gift, ArrowRight, Shield, Sparkles } from 'lucide-react';
import { TalerIcon } from '@/components/icons/TalerIcon';

interface GuestSignupSheetProps {
  isOpen: boolean;
  onClose: () => void;
  earnedTaler: number;
  listeningMinutes: number;
}

export function GuestSignupSheet({ 
  isOpen, 
  onClose, 
  earnedTaler, 
  listeningMinutes 
}: GuestSignupSheetProps) {
  const navigate = useNavigate();
  
  const handleSignup = () => {
    onClose();
    navigate('/auth?mode=signup');
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 pt-6">
        <SheetHeader className="text-center pb-2">
          <SheetTitle className="sr-only">Taler sichern</SheetTitle>
        </SheetHeader>
        
        <div className="text-center space-y-5">
          {/* Centered Taler icon with glow */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="relative"
            >
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full bg-accent/20 blur-xl scale-150" />
              
              <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-xl shadow-accent/25">
                <TalerIcon className="h-10 w-10 text-accent-foreground" />
              </div>
              
              {/* Badge */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring' }}
                className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 rounded-full shadow-lg border-2 border-card"
              >
                +{earnedTaler}
              </motion.div>
            </motion.div>
          </div>
          
          {/* Message */}
          <div className="space-y-1.5">
            <h2 className="text-xl font-bold text-foreground">
              Deine Taler warten!
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              <span className="font-semibold text-foreground">{listeningMinutes} Min.</span> gehört · <span className="font-semibold text-accent">{earnedTaler} Taler</span> verdient
            </p>
          </div>
          
          {/* Benefits row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: Coins, label: 'Taler\nsichern', color: 'text-accent' },
              { icon: Gift, label: 'Lokale\nGutscheine', color: 'text-primary' },
              { icon: Shield, label: 'Nie\nverlieren', color: 'text-muted-foreground' },
            ].map(({ icon: Icon, label, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/40"
              >
                <Icon className={`h-5 w-5 ${color}`} />
                <p className="text-xs font-medium text-foreground whitespace-pre-line leading-tight text-center">
                  {label}
                </p>
              </motion.div>
            ))}
          </div>
          
          {/* CTA */}
          <div className="space-y-3 pt-1">
            <Button 
              onClick={handleSignup}
              size="lg"
              className="w-full h-13 text-base font-semibold rounded-2xl group"
            >
              <Sparkles className="h-4 w-4 mr-1.5" />
              Kostenlos registrieren
              <ArrowRight className="h-4 w-4 ml-1.5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <button
              onClick={onClose}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Später erinnern
            </button>
          </div>
          
          {/* Trust */}
          <p className="text-xs text-muted-foreground">
            Kostenlos · Keine Kreditkarte · Jederzeit kündbar
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}