import { useState, useEffect } from 'react';
import { X, Download, Share, Plus, Smartphone, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const BANNER_DISMISSED_KEY = 'install-banner-dismissed';
const BANNER_DISMISS_DAYS = 7;

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // Check if already installed
    const standalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone === true;
    setIsInstalled(standalone);
    
    if (standalone) return;
    
    // Check if dismissed recently
    const dismissed = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed) {
      const dismissedTime = parseInt(dismissed);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < BANNER_DISMISS_DAYS) return;
    }
    
    // Detect iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(iOS);
    
    // Listen for install prompt (Android/Chrome)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // For iOS, show banner after a short delay
    if (iOS) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          toast.success('App wird installiert! 🎉');
          setIsVisible(false);
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (error) {
        console.error('Install error:', error);
      }
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(BANNER_DISMISSED_KEY, Date.now().toString());
  };

  const handleIOSClick = () => {
    setShowIOSSteps(!showIOSSteps);
  };

  // Don't render if installed or not visible
  if (isInstalled || !isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, height: 0 }}
        animate={{ opacity: 1, y: 0, height: 'auto' }}
        exit={{ opacity: 0, y: -20, height: 0 }}
        className="overflow-hidden"
      >
        <div className={cn(
          "relative rounded-2xl overflow-hidden",
          "bg-gradient-to-r from-accent via-accent/90 to-primary",
          "shadow-lg border border-white/10"
        )}>
          {/* Decorative sparkles */}
          <div className="absolute top-2 right-12 opacity-30">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors z-10"
            aria-label="Schliessen"
          >
            <X className="h-4 w-4 text-white" />
          </button>

          <div className="p-4">
            <div className="flex items-center gap-3">
              {/* App Icon */}
              <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-md overflow-hidden">
                <img 
                  src="/pwa-192x192.png" 
                  alt="My 2Go" 
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-white/80" />
                  <h3 className="font-bold text-white text-sm">App installieren</h3>
                </div>
                <p className="text-xs text-white/80 mt-0.5">
                  Schneller Zugriff • Offline nutzen • Push-Benachrichtigungen
                </p>
              </div>

              {/* Install Button */}
              {isIOS ? (
                <button
                  onClick={handleIOSClick}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl",
                    "bg-white text-accent font-bold text-sm",
                    "hover:bg-white/90 transition-colors shadow-md"
                  )}
                >
                  <Share className="h-4 w-4" />
                  <span className="hidden sm:inline">Anleitung</span>
                </button>
              ) : deferredPrompt ? (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleInstall}
                  className={cn(
                    "flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl",
                    "bg-white text-accent font-bold text-sm",
                    "hover:bg-white/90 transition-colors shadow-md"
                  )}
                >
                  <Download className="h-4 w-4" />
                  <span>Installieren</span>
                </motion.button>
              ) : null}
            </div>

            {/* iOS Instructions - Expandable */}
            <AnimatePresence>
              {showIOSSteps && isIOS && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 pt-3 border-t border-white/20">
                    <ol className="text-sm text-white/90 space-y-2">
                      <li className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">1</span>
                        <span>Tippe auf <Share className="h-4 w-4 inline mx-1" /> (Teilen) unten in Safari</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">2</span>
                        <span>Scrolle und wähle <Plus className="h-4 w-4 inline mx-1" /> "Zum Home-Bildschirm"</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">3</span>
                        <span>Tippe oben rechts auf "Hinzufügen"</span>
                      </li>
                    </ol>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
