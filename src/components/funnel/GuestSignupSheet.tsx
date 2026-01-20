import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Coins, Gift, Clock, ArrowRight, X } from 'lucide-react';
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
  
  const handleLater = () => {
    onClose();
  };
  
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8">
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="sr-only">Taler sichern</SheetTitle>
        </SheetHeader>
        
        <div className="text-center space-y-6">
          {/* Animated Taler Display */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="relative mx-auto"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-xl shadow-accent/30">
              <TalerIcon className="h-12 w-12 text-white" />
            </div>
            {/* Taler amount badge */}
            <motion.div
              initial={{ scale: 0, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="absolute -top-2 -right-2 bg-success text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg"
            >
              +{earnedTaler}
            </motion.div>
          </motion.div>
          
          {/* Message */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Deine Taler warten!
            </h2>
            <p className="text-muted-foreground">
              Du hast <span className="font-semibold text-foreground">{listeningMinutes} Minuten</span> Radio gehört 
              und <span className="font-semibold text-accent">{earnedTaler} Taler</span> verdient.
            </p>
          </div>
          
          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3 text-left">
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
              <Coins className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Taler sichern</p>
                <p className="text-xs text-muted-foreground">Nie wieder verlieren</p>
              </div>
            </div>
            <div className="flex items-start gap-2 p-3 rounded-xl bg-muted/50">
              <Gift className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground">Gutscheine</p>
                <p className="text-xs text-muted-foreground">Bei lokalen Partnern</p>
              </div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handleSignup}
              size="lg"
              className="w-full h-14 text-base font-semibold rounded-2xl group"
            >
              Kostenlos registrieren
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Button>
            
            <button
              onClick={handleLater}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Später erinnern
            </button>
          </div>
          
          {/* Trust note */}
          <p className="text-xs text-muted-foreground">
            Kostenlos • Keine Kreditkarte • Jederzeit kündbar
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
