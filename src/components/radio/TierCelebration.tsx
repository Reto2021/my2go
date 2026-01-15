import { motion, AnimatePresence } from 'framer-motion';
import { X, Radio } from 'lucide-react';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { Confetti } from '@/components/ui/confetti';

interface TierCelebrationProps {
  isVisible: boolean;
  talerAmount: number;
  onDismiss: () => void;
}

export function TierCelebration({ isVisible, talerAmount, onDismiss }: TierCelebrationProps) {
  return (
    <>
      {/* Confetti Animation */}
      <Confetti isActive={isVisible} particleCount={60} playSound={true} />
      
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
              className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[100] flex items-center justify-center sm:w-[90%] sm:max-w-sm pointer-events-none"
            >
              <div className="relative w-full max-w-xs pointer-events-auto">
                {/* Glow effect */}
                <div className="absolute inset-2 bg-accent/30 rounded-3xl blur-xl animate-pulse" />
                
                {/* Main card */}
                <div className="relative bg-gradient-to-br from-accent via-accent to-primary/80 rounded-3xl p-5 shadow-2xl shadow-accent/40 border border-accent/50 overflow-hidden">
                  {/* Dismiss button */}
                  <button
                    onClick={onDismiss}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center shadow-lg z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  {/* Sparkles - now inside card bounds */}
                  <motion.div
                    className="absolute top-2 left-3 text-xl"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    className="absolute top-3 left-1/2 text-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.4 }}
                  >
                    🎊
                  </motion.div>
                  <motion.div
                    className="absolute bottom-3 right-3 text-xl"
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    🎉
                  </motion.div>
                  <motion.div
                    className="absolute bottom-3 left-3 text-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.5 }}
                  >
                    ⭐
                  </motion.div>
                  
                  <div className="flex flex-col items-center text-center gap-3 pt-2">
                    {/* Animated coin */}
                    <motion.div
                      className="h-14 w-14 rounded-2xl bg-white/20 flex items-center justify-center"
                      animate={{ 
                        rotate: [0, -10, 10, -5, 5, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                    >
                      <TalerIcon className="h-8 w-8 text-accent-foreground" />
                    </motion.div>
                    
                    <div>
                      <p className="text-sm text-accent-foreground/80 font-medium mb-1">
                        🎯 Neues Tier erreicht!
                      </p>
                      <motion.p
                        className="text-2xl font-bold text-accent-foreground"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ delay: 0.3 }}
                      >
                        +{talerAmount} Taler
                      </motion.p>
                      <p className="text-xs text-accent-foreground/70 mt-1">
                        Weiter so! Du sammelst fleissig.
                      </p>
                    </div>
                    
                    {/* Continue Button */}
                    <motion.button
                      onClick={onDismiss}
                      className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-accent-foreground font-semibold py-2.5 px-5 rounded-xl transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Radio className="h-4 w-4" />
                      Weiter hören
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
