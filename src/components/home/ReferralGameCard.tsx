import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Users, Share2, Trophy, Star, Sparkles, ChevronRight, Copy, Check } from 'lucide-react';
import { useAuth, useUserCode } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// Milestone definitions
const MILESTONES = [
  { count: 1, label: 'Erster Freund', icon: Star, reward: 25, badge: '🌟' },
  { count: 3, label: 'Trio', icon: Users, reward: 75, badge: '🎯' },
  { count: 5, label: 'High Five', icon: Trophy, reward: 125, badge: '🏆' },
  { count: 10, label: 'Squad Leader', icon: Sparkles, reward: 250, badge: '👑' },
];

export function ReferralGameCard() {
  const { user, profile } = useAuth();
  const userCode = useUserCode();
  const [copied, setCopied] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  
  const referralCount = profile?.referral_count || 0;
  const referralCode = userCode?.permanent_code || '';
  
  // Build the referral link
  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/auth?ref=${encodeURIComponent(referralCode)}`;
  
  // Calculate progress to next milestone
  const currentMilestone = MILESTONES.findIndex(m => referralCount < m.count);
  const nextMilestone = MILESTONES[currentMilestone] || MILESTONES[MILESTONES.length - 1];
  const prevMilestoneCount = currentMilestone > 0 ? MILESTONES[currentMilestone - 1].count : 0;
  const progressToNext = currentMilestone === -1 
    ? 100 
    : ((referralCount - prevMilestoneCount) / (nextMilestone.count - prevMilestoneCount)) * 100;
  
  // Total Taler earned from referrals
  const totalTalerEarned = referralCount * 25;
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link kopiert!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Kopieren fehlgeschlagen');
    }
  };
  
  const handleShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }
    
    setIsSharing(true);
    try {
      await navigator.share({
        title: 'My 2Go',
        text: `Melde dich bei My 2Go an und wir erhalten beide 25 Taler! Nutze meinen Code: ${referralCode}`,
        url: referralLink,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        handleCopy();
      }
    } finally {
      setIsSharing(false);
    }
  };
  
  if (!user) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-secondary to-primary/80 p-4 shadow-lg"
    >
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-2 right-8 w-20 h-20 bg-accent/20 rounded-full blur-2xl animate-pulse" />
        <div className="absolute bottom-4 left-4 w-16 h-16 bg-primary/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-extrabold text-secondary-foreground tracking-tight">
              One for Me – One for You!
            </h3>
            <p className="text-xs text-secondary-foreground/70 mt-0.5">
              25 Taler für euch beide
            </p>
          </div>
          <motion.div 
            className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center"
            animate={{ rotate: [0, -10, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <Gift className="h-5 w-5 text-accent" />
          </motion.div>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Users className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xl font-bold text-secondary-foreground tabular-nums">{referralCount}</p>
              <p className="text-[10px] text-secondary-foreground/60 -mt-0.5">Freunde</p>
            </div>
          </div>
          
          <div className="h-8 w-px bg-secondary-foreground/20" />
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-accent/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-xl font-bold text-accent tabular-nums">{totalTalerEarned}</p>
              <p className="text-[10px] text-secondary-foreground/60 -mt-0.5">Taler</p>
            </div>
          </div>
        </div>
        
        {/* Progress to Next Milestone */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-[10px] mb-1.5">
            <span className="text-secondary-foreground/70">
              {currentMilestone === -1 ? 'Alle Meilensteine erreicht!' : `Nächstes Ziel: ${nextMilestone.label}`}
            </span>
            <span className="text-accent font-semibold">
              {currentMilestone === -1 ? '👑' : `${referralCount}/${nextMilestone.count}`}
            </span>
          </div>
          <div className="h-2 bg-secondary-foreground/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progressToNext, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />
          </div>
        </div>
        
        {/* Milestone Badges */}
        <div className="flex items-center justify-between mb-4">
          {MILESTONES.map((milestone, index) => {
            const isAchieved = referralCount >= milestone.count;
            const isNext = index === currentMilestone;
            
            return (
              <motion.div
                key={milestone.count}
                className={cn(
                  'flex flex-col items-center gap-1 transition-all duration-300',
                  isAchieved ? 'opacity-100' : 'opacity-40'
                )}
                whileHover={{ scale: 1.1 }}
              >
                <div className={cn(
                  'h-9 w-9 rounded-xl flex items-center justify-center text-lg transition-all',
                  isAchieved 
                    ? 'bg-accent/30 shadow-lg shadow-accent/20' 
                    : isNext 
                      ? 'bg-secondary-foreground/10 ring-2 ring-accent/50 ring-offset-1 ring-offset-secondary'
                      : 'bg-secondary-foreground/10'
                )}>
                  {isAchieved ? milestone.badge : <milestone.icon className="h-4 w-4 text-secondary-foreground/50" />}
                </div>
                <span className="text-[9px] text-secondary-foreground/60 font-medium">{milestone.count}</span>
              </motion.div>
            );
          })}
        </div>
        
        {/* Action Buttons */}
        <div className="flex gap-2">
          <motion.button
            onClick={handleShare}
            disabled={isSharing}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            <Share2 className="h-4 w-4" />
            Teilen
          </motion.button>
          
          <motion.button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary-foreground/10 text-secondary-foreground font-semibold text-sm hover:bg-secondary-foreground/20 transition-colors"
            whileTap={{ scale: 0.98 }}
          >
            {copied ? (
              <Check className="h-4 w-4 text-success" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </motion.button>
          
          <Link
            to="/referral"
            className="flex items-center justify-center px-3 py-2.5 rounded-xl bg-secondary-foreground/10 text-secondary-foreground hover:bg-secondary-foreground/20 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
