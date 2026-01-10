import { motion, AnimatePresence } from 'framer-motion';
import { Gift, ArrowRight, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent, SIGNUP_BONUS_TALER } from '@/lib/funnel-config';
import talerCoin from '@/assets/taler-coin.png';

interface BonusPromptSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSignup: () => void;
}

export function BonusPromptSheet({ isOpen, onClose, onSignup }: BonusPromptSheetProps) {
  const handleSignup = () => {
    trackFunnelEvent('signup_started');
    onSignup();
  };

  const handleClose = () => {
    trackFunnelEvent('signup_prompt_dismissed');
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
            className="fixed bottom-0 left-0 right-0 z-50 bg-card rounded-t-3xl shadow-2xl max-w-lg mx-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-muted" />
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="px-6 pb-8 pt-2">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="flex items-center justify-center mb-4"
              >
                <div className="relative">
                  <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center">
                    <img src={talerCoin} alt="" className="h-12 w-12" />
                  </div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full"
                  >
                    +{SIGNUP_BONUS_TALER}
                  </motion.div>
                </div>
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-center mb-2">
                Willst du die +{SIGNUP_BONUS_TALER} 2Go Taler sichern?
              </h2>

              {/* Description */}
              <p className="text-muted-foreground text-center mb-6">
                Registrieren dauert 10 Sekunden. Danach Gutscheine & Goodies nutzen.
              </p>

              {/* Time indicator */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-6">
                <Clock className="h-4 w-4" />
                <span>Nur 10 Sekunden</span>
              </div>

              {/* CTAs */}
              <div className="space-y-3">
                <Button
                  onClick={handleSignup}
                  size="lg"
                  className="w-full h-14 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
                >
                  <Gift className="h-5 w-5 mr-2" />
                  Bonus sichern
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>

                <button
                  onClick={handleClose}
                  className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Später
                </button>
              </div>

              {/* Trust line */}
              <p className="text-xs text-muted-foreground text-center mt-4">
                Kostenlos • lokal einlösbar • jederzeit abmelden
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
