import { motion, AnimatePresence } from 'framer-motion';
import { Coins, X, Sparkles } from 'lucide-react';
import { TalerIcon } from '@/components/icons/TalerIcon';

interface TierCelebrationProps {
  isVisible: boolean;
  talerAmount: number;
  onDismiss: () => void;
}

export function TierCelebration({ isVisible, talerAmount, onDismiss }: TierCelebrationProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99]"
            onClick={onDismiss}
          />
          
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100]"
          >
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 bg-accent/30 rounded-2xl blur-xl animate-pulse" />
            
            {/* Main card */}
            <div className="relative bg-gradient-to-br from-accent via-accent to-primary/80 rounded-2xl p-4 shadow-2xl shadow-accent/40 border border-accent/50">
              {/* Dismiss button */}
              <button
                onClick={onDismiss}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background flex items-center justify-center shadow-lg"
              >
                <X className="h-3 w-3" />
              </button>
              
              {/* Sparkles */}
              <motion.div
                className="absolute -top-3 -left-3 text-xl"
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                transition={{ delay: 0.2 }}
              >
                ✨
              </motion.div>
              <motion.div
                className="absolute -bottom-2 -right-3 text-xl"
                initial={{ scale: 0, rotate: 45 }}
                animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                transition={{ delay: 0.3 }}
              >
                🎉
              </motion.div>
              
              <div className="flex items-center gap-3">
                {/* Animated coin */}
                <motion.div
                  className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center"
                  animate={{ 
                    rotate: [0, -10, 10, -5, 5, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <TalerIcon className="h-7 w-7 text-accent-foreground" />
                </motion.div>
                
                <div>
                  <p className="text-xs text-accent-foreground/80 font-medium">
                    Neues Tier erreicht!
                  </p>
                  <motion.p
                    className="text-2xl font-bold text-accent-foreground"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ delay: 0.3 }}
                  >
                    +{talerAmount} Taler
                  </motion.p>
                </div>
              </div>
            </div>
          </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
