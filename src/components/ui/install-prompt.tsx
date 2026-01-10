import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const VISIT_COUNT_KEY = 'pwa-visit-count';
const LAST_VISIT_KEY = 'pwa-last-visit';
const INSTALL_DISMISSED_KEY = 'pwa-install-dismissed';
const MIN_VISITS_TO_SHOW = 3; // Show prompt after 3 visits
const DISMISS_COOLDOWN_DAYS = 7; // Don't show again for 7 days after dismiss

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [visitCount, setVisitCount] = useState(0);

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
    
    // Count as new visit if more than 1 hour since last visit
    if (hoursSinceLastVisit > 1) {
      currentVisitCount += 1;
      localStorage.setItem(VISIT_COUNT_KEY, currentVisitCount.toString());
      localStorage.setItem(LAST_VISIT_KEY, Date.now().toString());
    }
    
    setVisitCount(currentVisitCount);

    // Check if user dismissed before
    const dismissed = localStorage.getItem(INSTALL_DISMISSED_KEY);
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    const canShowPrompt = daysSinceDismissed > DISMISS_COOLDOWN_DAYS && currentVisitCount >= MIN_VISITS_TO_SHOW;

    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show after delay if conditions are met
      if (canShowPrompt) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // For iOS, show prompt after delay if conditions are met
    if (iOS && !standalone && canShowPrompt) {
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

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

  // Don't show if already installed
  if (isStandalone) return null;

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-20 left-4 right-4 z-[100] md:left-auto md:right-4 md:w-80"
        >
          <div className="bg-card rounded-2xl shadow-strong border border-border p-4">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors"
              aria-label="Schliessen"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>

            <div className="flex gap-3">
              {/* App Icon */}
              <div className="h-14 w-14 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img 
                  src="/pwa-192x192.png" 
                  alt="My 2Go" 
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 pr-4">
                <h3 className="font-bold text-foreground text-sm">Radio 2Go installieren</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Schneller Zugriff auf Radio, Taler & Gutscheine
                </p>
              </div>
            </div>

            {/* Visit count indicator */}
            <div className="flex items-center gap-2 mt-3 mb-3 px-2 py-1.5 rounded-lg bg-accent/10">
              <Smartphone className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs text-accent font-medium">
                Schon {visitCount}x besucht – Zeit für die App! 🎉
              </span>
            </div>

            {/* Actions */}
            <div className="mt-4">
              {isIOS ? (
                // iOS instructions
                <div className="bg-muted/50 rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-foreground font-medium mb-2">
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
                <button
                  onClick={handleInstall}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-xl py-3",
                    "bg-accent text-accent-foreground font-semibold text-sm",
                    "hover:bg-accent/90 transition-colors"
                  )}
                >
                  <Download className="h-4 w-4" />
                  Jetzt installieren
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
