import { useState, useEffect, useCallback } from 'react';
import { X, Download, Share, Plus, Smartphone, Sparkles, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISIT_COUNT_KEY = 'pwa-visit-count';
const LAST_VISIT_KEY = 'pwa-last-visit';
const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';
const REMIND_LATER_KEY = 'pwa-remind-later';
const ENGAGEMENT_SCORE_KEY = 'pwa-engagement-score';
const MIN_VISITS_TO_SHOW = 2; // Show prompt after 2 visits
const DISMISS_COOLDOWN_DAYS = 14; // Don't show again for 14 days after dismiss
const REMIND_LATER_HOURS = 12; // Show again after 12 hours if "remind later" clicked
const MIN_ENGAGEMENT_SCORE = 5; // Minimum engagement score to show prompt
const MIN_TIME_ON_PAGE_SECONDS = 30; // Minimum time on page before showing

// Engagement scoring system
function getEngagementScore(): number {
  const stored = localStorage.getItem(ENGAGEMENT_SCORE_KEY);
  return stored ? parseInt(stored) : 0;
}

function addEngagementPoints(points: number): number {
  const current = getEngagementScore();
  const newScore = current + points;
  localStorage.setItem(ENGAGEMENT_SCORE_KEY, newScore.toString());
  return newScore;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visitCount, setVisitCount] = useState(0);
  const [engagementScore, setEngagementScore] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);

  // Track scrolling for engagement
  const handleScroll = useCallback(() => {
    if (!hasScrolled) {
      setHasScrolled(true);
      const newScore = addEngagementPoints(2);
      setEngagementScore(newScore);
    }
  }, [hasScrolled]);

  // Check if we can show the prompt
  const canShowPrompt = useCallback((currentVisitCount: number) => {
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    const remindLater = localStorage.getItem(REMIND_LATER_KEY);
    const remindLaterTime = remindLater ? parseInt(remindLater) : 0;
    const hoursSinceRemindLater = (Date.now() - remindLaterTime) / (1000 * 60 * 60);
    
    const currentEngagement = getEngagementScore();
    
    return currentVisitCount >= MIN_VISITS_TO_SHOW && 
      daysSinceDismissed > DISMISS_COOLDOWN_DAYS && 
      hoursSinceRemindLater > REMIND_LATER_HOURS &&
      currentEngagement >= MIN_ENGAGEMENT_SCORE;
  }, []);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Don't track visits if already installed
    if (standalone) return;

    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);

    // Track visit count (count unique sessions, not page loads)
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    const lastVisitTime = lastVisit ? parseInt(lastVisit) : 0;
    const hoursSinceLastVisit = (Date.now() - lastVisitTime) / (1000 * 60 * 60);
    
    let currentVisitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0');
    
    // Count as new visit if more than 30 minutes since last visit
    if (hoursSinceLastVisit > 0.5) {
      currentVisitCount += 1;
      localStorage.setItem(VISIT_COUNT_KEY, currentVisitCount.toString());
      localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
      // Award engagement points for returning
      addEngagementPoints(3);
    }
    
    setVisitCount(currentVisitCount);
    setEngagementScore(getEngagementScore());

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Track time on page for engagement
    const timeInterval = setInterval(() => {
      setTimeSpent(prev => {
        const newTime = prev + 1;
        // Award points every 15 seconds
        if (newTime > 0 && newTime % 15 === 0) {
          const score = addEngagementPoints(1);
          setEngagementScore(score);
        }
        return newTime;
      });
    }, 1000);

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(timeInterval);
    };
  }, [handleScroll]);

  // Show prompt when conditions are met
  useEffect(() => {
    if (isStandalone) return;

    const shouldShow = canShowPrompt(visitCount) && 
      timeSpent >= MIN_TIME_ON_PAGE_SECONDS &&
      (deferredPrompt || isIOS);

    if (shouldShow && !showPrompt) {
      // Delay to avoid interrupting user immediately
      const timer = setTimeout(() => setShowPrompt(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [visitCount, timeSpent, deferredPrompt, isIOS, isStandalone, canShowPrompt, showPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(INSTALL_DISMISSED_KEY, Date.now().toString());
  };

  const handleRemindLater = () => {
    setShowPrompt(false);
    localStorage.setItem(REMIND_LATER_KEY, Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) return null;

  // Calculate benefit message based on engagement
  const getBenefitMessage = () => {
    if (visitCount >= 5) return "Du bist ein Stammgast! 🎉";
    if (engagementScore >= 20) return "Du liebst die App offensichtlich! 💙";
    if (visitCount >= 3) return `Schon ${visitCount}x besucht – Zeit für die App!`;
    return "Für schnelleren Zugriff installieren";
  };

  return (
    <AnimatePresence>
      {showPrompt && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99] md:hidden"
            onClick={handleRemindLater}
          />
          
          <motion.div
            initial={{ y: 100, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 100, opacity: 0, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-96"
          >
            <div className="bg-card rounded-3xl shadow-strong border border-border overflow-hidden">
              {/* Gradient header */}
              <div className="relative h-16 bg-gradient-to-r from-secondary via-primary to-secondary overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    className="absolute"
                  >
                    <Sparkles className="h-24 w-24 text-white/10" />
                  </motion.div>
                  <Radio className="h-8 w-8 text-white relative z-10" />
                </div>
                
                {/* Close button */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label="Schliessen"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>

              <div className="p-4">
                <div className="flex gap-3 items-start">
                  {/* App Icon */}
                  <div className="h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden shadow-md">
                    <img 
                      src="/pwa-192x192.png" 
                      alt="My 2Go" 
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-foreground">My 2Go installieren</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Schneller Zugriff auf Radio, Taler & Gutscheine
                    </p>
                  </div>
                </div>

                {/* Engagement indicator */}
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-accent/10 border border-accent/20"
                >
                  <Smartphone className="h-4 w-4 text-accent" />
                  <span className="text-sm text-accent font-medium">
                    {getBenefitMessage()}
                  </span>
                </motion.div>

                {/* Benefits mini-list */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {['⚡ Schneller', '📴 Offline', '🔔 Push'].map((benefit, i) => (
                    <motion.span
                      key={benefit}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                    >
                      {benefit}
                    </motion.span>
                  ))}
                </div>

                {/* Actions */}
                <div className="mt-4 space-y-2">
                  {isIOS ? (
                    // iOS instructions
                    <div className="bg-muted/50 rounded-xl p-3">
                      <div className="flex items-center gap-2 text-sm text-foreground font-medium mb-2">
                        <Share className="h-4 w-4 text-primary" />
                        So installierst du My 2Go:
                      </div>
                      <ol className="text-xs text-muted-foreground space-y-1.5 ml-6">
                        <li className="flex items-center gap-2">
                          <span className="font-medium">1.</span> Tippe auf 
                          <Share className="h-3.5 w-3.5 inline" /> (Teilen)
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="font-medium">2.</span> Wähle
                          <Plus className="h-3.5 w-3.5 inline" /> "Zum Home-Bildschirm"
                        </li>
                      </ol>
                    </div>
                  ) : (
                    // Android/Chrome install button
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleInstall}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 rounded-xl py-3.5",
                        "bg-accent text-accent-foreground font-bold text-base",
                        "hover:bg-accent/90 transition-colors shadow-md"
                      )}
                    >
                      <Download className="h-5 w-5" />
                      Jetzt installieren
                    </motion.button>
                  )}
                  
                  {/* Remind Later Button */}
                  <button
                    onClick={handleRemindLater}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
                  >
                    Später erinnern
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
