import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Confetti } from '@/components/ui/confetti';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { Gift, Radio, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FirstTalerCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  talerAmount: number;
  isGuest?: boolean;
}

export function FirstTalerCelebration({ 
  isOpen, 
  onClose, 
  talerAmount,
  isGuest = false 
}: FirstTalerCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      // Trigger confetti with a slight delay
      const timer = setTimeout(() => setShowConfetti(true), 200);
      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
    }
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <>
      <Confetti 
        isActive={showConfetti} 
        duration={4000} 
        particleCount={60}
        playSound={true}
      />
      
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] bg-background/95 backdrop-blur-md flex items-center justify-center p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, y: 50 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 50 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-full max-w-sm text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Celebration Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="relative mx-auto mb-6"
            >
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-accent via-accent to-primary flex items-center justify-center shadow-2xl shadow-accent/40">
                <TalerIcon className="h-14 w-14 text-white" />
              </div>
              
              {/* Sparkle decorations */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.5 }}
                className="absolute -top-2 -right-2 text-3xl"
              >
                ✨
              </motion.div>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.6 }}
                className="absolute -bottom-1 -left-3 text-2xl"
              >
                🎉
              </motion.div>
              
              {/* Amount badge */}
              <motion.div
                initial={{ scale: 0, x: 20 }}
                animate={{ scale: 1, x: 0 }}
                transition={{ type: 'spring', delay: 0.4 }}
                className="absolute -top-3 -right-4 bg-success text-white font-bold px-4 py-2 rounded-full shadow-lg text-lg"
              >
                +{talerAmount}
              </motion.div>
            </motion.div>
            
            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-3xl font-black text-foreground mb-3"
            >
              Deine ersten Taler! 🎊
            </motion.h1>
            
            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-6"
            >
              {isGuest ? (
                <>Du hast <span className="font-bold text-accent">{talerAmount} Taler</span> durch Radio hören verdient!</>
              ) : (
                <>Glückwunsch! Du hast <span className="font-bold text-accent">{talerAmount} Taler</span> verdient.</>
              )}
            </motion.p>
            
            {/* How it works - Quick reminder */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card border border-border rounded-2xl p-4 mb-6"
            >
              <p className="text-sm font-semibold text-foreground mb-3">
                So sammelst du weiter:
              </p>
              <div className="flex justify-center gap-4 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center">
                    <Radio className="h-5 w-5 text-accent" />
                  </div>
                  <span className="text-xs text-muted-foreground">Radio hören</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">Einkaufen</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-success" />
                  </div>
                  <span className="text-xs text-muted-foreground">Einlösen</span>
                </div>
              </div>
            </motion.div>
            
            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <Button 
                onClick={onClose}
                size="lg"
                className="w-full h-14 text-base font-semibold rounded-2xl"
              >
                Weiter sammeln
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}
