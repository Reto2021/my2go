import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coins, Gift, Trophy, Flame, Star, PartyPopper, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/ui/confetti';
import { useShareCard, ShareCardGenerator } from '@/components/share/ShareCardGenerator';
import { hapticSuccess } from '@/lib/haptics';

interface MilestoneData {
  type: 'taler' | 'redemption' | 'streak' | 'leaderboard';
  value: number;
  title: string;
  description: string;
  icon?: string;
}

interface MilestoneCelebrationProps {
  milestone: MilestoneData | null;
  onClose: () => void;
}

const milestoneConfig = {
  taler: {
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
    icon: Coins,
    iconColor: 'text-emerald-400',
  },
  redemption: {
    gradient: 'from-purple-500 via-pink-500 to-rose-500',
    icon: Gift,
    iconColor: 'text-purple-400',
  },
  streak: {
    gradient: 'from-orange-500 via-red-500 to-pink-500',
    icon: Flame,
    iconColor: 'text-orange-400',
  },
  leaderboard: {
    gradient: 'from-amber-500 via-orange-500 to-red-500',
    icon: Trophy,
    iconColor: 'text-amber-400',
  },
};

// Predefined milestones to check
export const MILESTONES = {
  taler: [100, 250, 500, 1000, 2500, 5000],
  redemption: [1, 5, 10, 25, 50],
  streak: [7, 14, 30, 60, 100],
  leaderboard: [1, 2, 3], // Top 3
};

export function MilestoneCelebration({ milestone, onClose }: MilestoneCelebrationProps) {
  const [showConfetti, setShowConfetti] = useState(false);
  const { isOpen: shareOpen, cardData, openShareCard, closeShareCard } = useShareCard();

  useEffect(() => {
    if (milestone) {
      setShowConfetti(true);
      hapticSuccess();
      
      // Auto-close after delay
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [milestone]);

  const handleShare = useCallback(() => {
    if (!milestone) return;
    
    openShareCard({
      type: milestone.type,
      title: milestone.title,
      subtitle: milestone.description,
      value: milestone.value.toString(),
      icon: milestone.icon,
    });
  }, [milestone, openShareCard]);

  if (!milestone) return null;

  const config = milestoneConfig[milestone.type];
  const Icon = config.icon;

  return (
    <>
      <Confetti 
        isActive={showConfetti} 
        particleCount={100} 
        duration={4000}
        playSound
      />
      
      <AnimatePresence>
        {milestone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            {/* Backdrop */}
            <motion.div 
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* Content */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ type: 'spring', damping: 15 }}
              className="relative z-10 w-full max-w-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Card */}
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${config.gradient} p-8 text-white shadow-2xl`}>
                {/* Background Effects */}
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    className="absolute -top-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-3xl"
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.5, 0.3],
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute -bottom-20 -right-20 w-40 h-40 bg-white/10 rounded-full blur-3xl"
                    animate={{ 
                      scale: [1.2, 1, 1.2],
                      opacity: [0.2, 0.4, 0.2],
                    }}
                    transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
                  />
                </div>

                {/* Content */}
                <div className="relative z-10 text-center">
                  {/* Celebration Icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="mb-4"
                  >
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm">
                      <motion.div
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ duration: 1, repeat: Infinity }}
                      >
                        {milestone.icon ? (
                          <span className="text-5xl">{milestone.icon}</span>
                        ) : (
                          <Icon className="h-10 w-10" />
                        )}
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Stars */}
                  <motion.div
                    className="flex items-center justify-center gap-1 mb-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                      >
                        <Star className="h-5 w-5 fill-white/80 text-white/80" />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Value */}
                  <motion.p
                    className="text-6xl font-black mb-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                  >
                    {milestone.value}
                  </motion.p>

                  {/* Title */}
                  <motion.h3
                    className="text-2xl font-bold mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    {milestone.title}
                  </motion.h3>

                  {/* Description */}
                  <motion.p
                    className="text-sm opacity-80 mb-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {milestone.description}
                  </motion.p>

                  {/* Actions */}
                  <motion.div
                    className="flex gap-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Button
                      variant="secondary"
                      className="flex-1 bg-white/20 hover:bg-white/30 text-white border-0"
                      onClick={handleShare}
                    >
                      <Share2 className="h-4 w-4 mr-2" />
                      Teilen
                    </Button>
                    <Button
                      className="flex-1 bg-white text-gray-900 hover:bg-white/90"
                      onClick={onClose}
                    >
                      <PartyPopper className="h-4 w-4 mr-2" />
                      Weiter!
                    </Button>
                  </motion.div>
                </div>
              </div>

              {/* Hint */}
              <motion.p
                className="text-center text-white/50 text-xs mt-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Tippe irgendwo, um fortzufahren
              </motion.p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Card Modal */}
      {cardData && (
        <ShareCardGenerator 
          isOpen={shareOpen} 
          onClose={closeShareCard} 
          data={cardData} 
        />
      )}
    </>
  );
}

// Hook for milestone checking
export function useMilestoneChecker() {
  const [pendingMilestone, setPendingMilestone] = useState<MilestoneData | null>(null);
  
  const checkMilestone = useCallback((
    type: keyof typeof MILESTONES,
    currentValue: number,
    previousValue: number
  ) => {
    const thresholds = MILESTONES[type];
    
    // Find if we crossed a threshold
    for (const threshold of thresholds) {
      if (previousValue < threshold && currentValue >= threshold) {
        const milestoneData: MilestoneData = getMilestoneData(type, threshold);
        setPendingMilestone(milestoneData);
        return true;
      }
    }
    return false;
  }, []);

  const dismissMilestone = useCallback(() => {
    setPendingMilestone(null);
  }, []);

  return {
    pendingMilestone,
    checkMilestone,
    dismissMilestone,
    triggerMilestone: setPendingMilestone,
  };
}

function getMilestoneData(type: keyof typeof MILESTONES, value: number): MilestoneData {
  switch (type) {
    case 'taler':
      return {
        type: 'taler',
        value,
        title: `${value} Taler erreicht!`,
        description: 'Du bist auf dem besten Weg zum Taler-Profi!',
        icon: '🪙',
      };
    case 'redemption':
      return {
        type: 'redemption',
        value,
        title: `${value} Einlösungen!`,
        description: value === 1 
          ? 'Deine erste Einlösung – der Anfang einer Reise!'
          : 'Du geniesst die Vorteile in vollen Zügen!',
        icon: '🎁',
      };
    case 'streak':
      return {
        type: 'streak',
        value,
        title: `${value}-Tage Streak!`,
        description: 'Deine Treue zahlt sich aus!',
        icon: '🔥',
      };
    case 'leaderboard':
      const icons: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };
      const titles: Record<number, string> = { 
        1: 'Du bist #1!', 
        2: 'Silber-Rang!', 
        3: 'Bronze erreicht!' 
      };
      return {
        type: 'leaderboard',
        value,
        title: titles[value] || `Top ${value}!`,
        description: 'Du gehörst zur Elite der Taler-Sammler!',
        icon: icons[value] || '🏆',
      };
  }
}
