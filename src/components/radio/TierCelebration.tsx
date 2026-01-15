import { motion, AnimatePresence } from 'framer-motion';
import { X, Radio, ChevronRight, Clock } from 'lucide-react';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { Confetti } from '@/components/ui/confetti';

interface NextTierInfo {
  name: string;
  reward: number;
  secondsRemaining: number;
}

interface TierCelebrationProps {
  isVisible: boolean;
  talerAmount: number;
  tierName?: string;
  nextTierInfo?: NextTierInfo | null;
  onDismiss: () => void;
}

function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} Sek.`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (secs === 0) {
    return `${minutes} Min.`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')} Min.`;
}

export function TierCelebration({ isVisible, talerAmount, tierName, nextTierInfo, onDismiss }: TierCelebrationProps) {
  return (
    <>
      {/* Confetti Animation */}
      <Confetti isActive={isVisible} particleCount={80} playSound={true} />
      
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99]"
              onClick={onDismiss}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            >
              <div className="relative w-full max-w-xs pointer-events-auto">
                {/* Glow effect */}
                <div className="absolute inset-0 bg-accent/40 rounded-3xl blur-2xl animate-pulse" />
                
                {/* Main card */}
                <div className="relative bg-gradient-to-br from-accent via-accent to-primary/80 rounded-3xl p-6 shadow-2xl shadow-accent/40 border border-accent/50 overflow-hidden">
                  {/* Dismiss button */}
                  <button
                    onClick={onDismiss}
                    className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/90 flex items-center justify-center shadow-lg z-10"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  {/* Sparkles */}
                  <motion.div
                    className="absolute top-2 left-4 text-2xl"
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    ✨
                  </motion.div>
                  <motion.div
                    className="absolute top-4 right-14 text-xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.4 }}
                  >
                    🎊
                  </motion.div>
                  <motion.div
                    className="absolute bottom-4 right-4 text-2xl"
                    initial={{ scale: 0, rotate: 45 }}
                    animate={{ scale: [0, 1.3, 1], rotate: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    🎉
                  </motion.div>
                  <motion.div
                    className="absolute bottom-4 left-4 text-xl"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ delay: 0.5 }}
                  >
                    ⭐
                  </motion.div>
                  
                  <div className="flex flex-col items-center text-center gap-4 pt-2">
                    {/* Big celebration emoji */}
                    <motion.div
                      className="text-6xl"
                      animate={{ 
                        rotate: [0, -15, 15, -10, 10, 0],
                        scale: [1, 1.2, 1]
                      }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    >
                      🏆
                    </motion.div>
                    
                    <div>
                      <p className="text-sm text-accent-foreground/80 font-medium mb-1">
                        Stufe erreicht!
                      </p>
                      {tierName && (
                        <motion.p
                          className="text-xl font-bold text-white mb-2"
                          initial={{ scale: 0.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.25 }}
                        >
                          {tierName}
                        </motion.p>
                      )}
                      <motion.div
                        className="flex items-center justify-center gap-2 bg-white/20 px-4 py-2 rounded-full"
                        initial={{ scale: 0.5 }}
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ delay: 0.35 }}
                      >
                        <TalerIcon className="h-6 w-6" />
                        <span className="text-2xl font-bold text-white">+{talerAmount}</span>
                        <span className="text-white/80 text-sm">Taler</span>
                      </motion.div>
                    </div>
                    
                    {/* Next tier preview */}
                    {nextTierInfo && (
                      <motion.div
                        className="w-full bg-white/10 rounded-xl p-3 border border-white/20"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                      >
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2 text-white/70">
                            <ChevronRight className="h-4 w-4" />
                            <span>Nächste Stufe:</span>
                          </div>
                          <span className="font-semibold text-white">{nextTierInfo.name}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5 text-white/70 text-xs">
                            <Clock className="h-3 w-3" />
                            <span>in {formatTimeRemaining(nextTierInfo.secondsRemaining)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-accent-foreground">
                            <TalerIcon className="h-4 w-4" />
                            <span className="font-bold">+{nextTierInfo.reward}</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                    
                    {!nextTierInfo && (
                      <motion.p
                        className="text-xs text-accent-foreground/80 bg-white/10 px-3 py-2 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                      >
                        🎉 Du hast alle Stufen erreicht! Maximaler Superfan!
                      </motion.p>
                    )}
                    
                    {/* Continue Button */}
                    <motion.button
                      onClick={onDismiss}
                      className="w-full flex items-center justify-center gap-2 bg-white/20 hover:bg-white/30 text-accent-foreground font-semibold py-3 px-5 rounded-xl transition-colors"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
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
