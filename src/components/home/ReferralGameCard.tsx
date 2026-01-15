import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Users, Trophy, Star, Sparkles, ChevronRight, ChevronDown, Copy, Check, MessageCircle, Send, MoreHorizontal, Facebook, Instagram } from 'lucide-react';
import { useAuth, useUserCode } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Confetti, useConfetti } from '@/components/ui/confetti';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { hapticToggle } from '@/lib/haptics';

// Milestone definitions
const MILESTONES = [
  { count: 1, label: 'Erster Freund', icon: Star, reward: 25, badge: '🌟' },
  { count: 3, label: 'Trio', icon: Users, reward: 75, badge: '🎯' },
  { count: 5, label: 'High Five', icon: Trophy, reward: 125, badge: '🏆' },
  { count: 10, label: 'Squad Leader', icon: Sparkles, reward: 250, badge: '👑' },
];

// Share channel configurations
const SHARE_CHANNELS = [
  { 
    id: 'whatsapp', 
    label: 'WhatsApp', 
    icon: MessageCircle, 
    color: 'bg-[#25D366]',
    getUrl: (link: string, text: string) => 
      `https://wa.me/?text=${encodeURIComponent(text + '\n\n' + link)}`
  },
  { 
    id: 'telegram', 
    label: 'Telegram', 
    icon: Send, 
    color: 'bg-[#0088cc]',
    getUrl: (link: string, text: string) => 
      `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(text)}`
  },
  { 
    id: 'facebook', 
    label: 'Facebook', 
    icon: Facebook, 
    color: 'bg-[#1877F2]',
    getUrl: (link: string, text: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}&quote=${encodeURIComponent(text)}`
  },
  { 
    id: 'instagram', 
    label: 'Insta', 
    icon: Instagram, 
    color: 'bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737]',
    // Instagram doesn't support direct link sharing - we copy and prompt
    getUrl: (link: string, text: string) => 'instagram://app',
    special: 'instagram'
  },
];

export function ReferralGameCard() {
  const { user, profile } = useAuth();
  const userCode = useUserCode();
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { isActive: showConfetti, trigger: triggerConfetti } = useConfetti();
  
  const referralCount = profile?.referral_count || 0;
  const referralCode = userCode?.permanent_code || '';
  
  // Build the referral link and share text
  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/auth?ref=${encodeURIComponent(referralCode)}`;
  const shareText = `Hey! Melde dich bei My 2Go an und wir erhalten beide 25 Taler Bonus! 🎁`;
  
  // Calculate progress to next milestone
  const currentMilestone = MILESTONES.findIndex(m => referralCount < m.count);
  const nextMilestone = MILESTONES[currentMilestone] || MILESTONES[MILESTONES.length - 1];
  const prevMilestoneCount = currentMilestone > 0 ? MILESTONES[currentMilestone - 1].count : 0;
  const progressToNext = currentMilestone === -1 
    ? 100 
    : ((referralCount - prevMilestoneCount) / (nextMilestone.count - prevMilestoneCount)) * 100;
  
  // Total Taler earned from referrals
  const totalTalerEarned = referralCount * 25;
  
  // Track share event in database
  const trackShare = async (channel: string) => {
    if (!user || !referralCode) return;
    
    try {
      await supabase.from('referral_shares').insert({
        user_id: user.id,
        channel,
        referral_code: referralCode,
      });
    } catch (error) {
      console.error('Failed to track share:', error);
    }
  };
  
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success('Link kopiert!');
      trackShare('copy');
      triggerConfetti();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Kopieren fehlgeschlagen');
    }
  };
  
  const handleShareChannel = async (channel: typeof SHARE_CHANNELS[0]) => {
    // Special handling for Instagram - copy link first, then open app
    if (channel.special === 'instagram') {
      try {
        await navigator.clipboard.writeText(referralLink);
        toast.success('Link kopiert! Füge ihn in deine Story ein 📸');
        trackShare('instagram');
        triggerConfetti();
        // Try to open Instagram app, fallback to website
        setTimeout(() => {
          window.open('https://instagram.com', '_blank', 'noopener,noreferrer');
        }, 500);
      } catch (error) {
        toast.error('Kopieren fehlgeschlagen');
      }
      return;
    }
    
    const url = channel.getUrl(referralLink, shareText);
    trackShare(channel.id);
    triggerConfetti();
    window.open(url, '_blank', 'noopener,noreferrer');
  };
  
  const handleNativeShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }
    
    try {
      await navigator.share({
        title: 'My 2Go',
        text: shareText,
        url: referralLink,
      });
      trackShare('native');
      triggerConfetti();
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        handleCopy();
      }
    }
  };
  
  // Handle collapsible open/close with haptics
  const handleOpenChange = (open: boolean) => {
    hapticToggle();
    setIsOpen(open);
  };
  
  // Get next milestone info for header preview
  const nextMilestoneLabel = currentMilestone === -1 
    ? '👑 Alle erreicht!' 
    : `${nextMilestone.badge} ${referralCount}/${nextMilestone.count}`;
  
  if (!user) return null;
  
  return (
    <>
      <Confetti isActive={showConfetti} particleCount={30} duration={2000} playSound={false} />
      <Collapsible open={isOpen} onOpenChange={handleOpenChange}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-secondary via-secondary to-primary/80 shadow-lg"
        >
          {/* Animated background particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-2 right-8 w-20 h-20 bg-accent/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-4 left-4 w-16 h-16 bg-primary/30 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          {/* Collapsible Header/Trigger */}
          <CollapsibleTrigger asChild>
            <button className="relative z-10 w-full p-4 text-left focus:outline-none">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0"
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  >
                    <Gift className="h-5 w-5 text-accent" />
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-extrabold text-secondary-foreground tracking-tight">
                      One for Me – One for You!
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <p className="text-xs text-secondary-foreground/70">
                        25 Taler für euch beide
                      </p>
                      <span className="text-[10px] text-secondary-foreground/40">•</span>
                      <p className="text-xs text-accent font-semibold">
                        {referralCount} Freunde
                      </p>
                      <span className="text-[10px] text-secondary-foreground/40">•</span>
                      <p className="text-xs text-secondary-foreground/60">
                        {nextMilestoneLabel}
                      </p>
                    </div>
                    {/* Mini progress bar in header */}
                    <div className="h-1 bg-secondary-foreground/10 rounded-full overflow-hidden mt-2 w-full max-w-[200px]">
                      <motion.div
                        className="h-full bg-gradient-to-r from-accent to-accent/80 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progressToNext, 100)}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                </div>
                <motion.div
                  animate={{ rotate: isOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="h-8 w-8 rounded-full bg-secondary-foreground/10 flex items-center justify-center flex-shrink-0"
                >
                  <ChevronDown className="h-4 w-4 text-secondary-foreground" />
                </motion.div>
              </div>
            </button>
          </CollapsibleTrigger>
          
          {/* Collapsible Content */}
          <CollapsibleContent className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden">
            <div className="relative z-10 px-4 pb-4">
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
              
              {/* CTA Banner */}
              <motion.div 
                className="relative overflow-hidden rounded-xl bg-gradient-to-r from-accent/20 via-accent/10 to-primary/20 p-3 mb-3 border border-accent/30"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAiIGN5PSIxMCIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
                <div className="relative flex items-center gap-3">
                  <motion.div 
                    className="h-10 w-10 rounded-full bg-accent/30 flex items-center justify-center flex-shrink-0"
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: [0, -5, 5, 0]
                    }}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                  >
                    <span className="text-xl">🎧</span>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-secondary-foreground">
                      Teilen & Taler kassieren!
                    </p>
                    <p className="text-xs text-secondary-foreground/70 truncate">
                      Dein Code: <span className="font-mono font-bold text-accent">{referralCode}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-black text-accent">+50</p>
                    <p className="text-[10px] text-secondary-foreground/60 -mt-0.5">für euch beide</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Quick Share Buttons - Direct App Links */}
              <div className="grid grid-cols-4 gap-2 mb-2">
                {SHARE_CHANNELS.map((channel) => (
                  <motion.button
                    key={channel.id}
                    onClick={() => handleShareChannel(channel)}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1 px-2 py-2.5 rounded-xl text-white font-semibold text-[10px] transition-opacity hover:opacity-90',
                      channel.color
                    )}
                    whileTap={{ scale: 0.95 }}
                  >
                    <channel.icon className="h-5 w-5" />
                    <span>{channel.label}</span>
                  </motion.button>
                ))}
              </div>
              
              {/* Secondary Actions */}
              <div className="flex gap-2">
                <motion.button
                  onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-secondary-foreground/10 text-secondary-foreground font-semibold text-sm hover:bg-secondary-foreground/20 transition-colors"
                  whileTap={{ scale: 0.98 }}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-success" />
                      Kopiert!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Link kopieren
                    </>
                  )}
                </motion.button>
                
                <motion.button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center px-3 py-2 rounded-xl bg-secondary-foreground/10 text-secondary-foreground hover:bg-secondary-foreground/20 transition-colors"
                  whileTap={{ scale: 0.98 }}
                  title="Mehr Optionen"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </motion.button>
                
                <Link
                  to="/referral"
                  className="flex items-center justify-center px-3 py-2 rounded-xl bg-secondary-foreground/10 text-secondary-foreground hover:bg-secondary-foreground/20 transition-colors"
                  title="Details"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CollapsibleContent>
        </motion.div>
      </Collapsible>
    </>
  );
}
