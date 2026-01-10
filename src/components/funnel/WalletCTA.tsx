import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, Smartphone, X, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/lib/funnel-config';
import { useWalletPass, isAppleDevice, isGoogleWalletSupported } from '@/hooks/useWalletPass';
import { useAuth } from '@/contexts/AuthContext';

interface WalletCTAProps {
  className?: string;
  onAddWallet?: () => void;
  onInstallPWA?: () => void;
  onDismiss?: () => void;
  showInstallOption?: boolean;
}

// Apple Wallet Logo SVG
const AppleWalletIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  </svg>
);

// Google Wallet Logo SVG
const GoogleWalletIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M12 12h.01" />
    <path d="M17 12h.01" />
    <path d="M7 12h.01" />
  </svg>
);

export function WalletCTA({ 
  className, 
  onAddWallet, 
  onInstallPWA,
  onDismiss,
  showInstallOption = true,
}: WalletCTAProps) {
  const { user } = useAuth();
  const { addToWallet, addToAppleWallet, addToGoogleWallet, isLoading } = useWalletPass();
  
  const [isApple, setIsApple] = useState(false);
  const [supportsGoogleWallet, setSupportsGoogleWallet] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);
  const [walletAdded, setWalletAdded] = useState<'apple' | 'google' | null>(null);

  useEffect(() => {
    // Detect device capabilities
    setIsApple(isAppleDevice());
    setSupportsGoogleWallet(isGoogleWalletSupported());
    
    // Check if PWA is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWAInstalled(isStandalone);

    // Check localStorage for dismissal
    const dismissedAt = localStorage.getItem('walletCTA_dismissed');
    if (dismissedAt) {
      const dismissedDate = new Date(dismissedAt);
      const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 30) {
        setDismissed(true);
      }
    }

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  useEffect(() => {
    if (!dismissed) {
      trackFunnelEvent('wallet_cta_shown');
    }
  }, [dismissed]);

  const handleAppleWalletClick = async () => {
    trackFunnelEvent('wallet_cta_clicked', { type: 'apple' });
    
    const success = await addToAppleWallet();
    if (success) {
      setWalletAdded('apple');
      onAddWallet?.();
    }
  };

  const handleGoogleWalletClick = async () => {
    trackFunnelEvent('wallet_cta_clicked', { type: 'google' });
    
    const success = await addToGoogleWallet();
    if (success) {
      setWalletAdded('google');
      onAddWallet?.();
    }
  };

  const handleInstallClick = async () => {
    trackFunnelEvent('pwa_install_clicked');
    
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        trackFunnelEvent('pwa_installed');
      }
      setDeferredPrompt(null);
      setCanInstallPWA(false);
    } else {
      onInstallPWA?.();
    }
  };

  const handleDismiss = () => {
    trackFunnelEvent('wallet_skipped');
    localStorage.setItem('walletCTA_dismissed', new Date().toISOString());
    setDismissed(true);
    onDismiss?.();
  };

  // Wallet-Integration vorübergehend deaktiviert - immer null zurückgeben
  // TODO: Aktivieren wenn Apple/Google Wallet Credentials eingerichtet sind
  return null;

  // Show success state briefly after adding wallet
  if (walletAdded) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={className}
      >
        <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/30">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-green-500/20">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="font-medium text-green-600">
                {walletAdded === 'apple' ? 'Apple Wallet' : 'Google Wallet'} hinzugefügt!
              </p>
              <p className="text-sm text-muted-foreground">Dein Pass wird geladen...</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={className}
    >
      <div className="p-4 rounded-2xl bg-muted/50 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-foreground">Schneller Zugriff?</h3>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Schliessen"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Apple Wallet Option - Show on Apple devices */}
          {isApple && (
            <button
              onClick={handleAppleWalletClick}
              disabled={isLoading || !user}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Wallet className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Zu Apple Wallet hinzufügen</p>
                <p className="text-xs text-muted-foreground">
                  Mitgliedskarte immer dabei
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Google Wallet Option - Show on Android/Chrome */}
          {supportsGoogleWallet && (
            <button
              onClick={handleGoogleWalletClick}
              disabled={isLoading || !user}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 text-white animate-spin" />
                ) : (
                  <Wallet className="h-5 w-5 text-white" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Zu Google Wallet hinzufügen</p>
                <p className="text-xs text-muted-foreground">
                  Mitgliedskarte immer dabei
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* Fallback if neither wallet is detected */}
          {!isApple && !supportsGoogleWallet && (
            <button
              onClick={() => addToWallet()}
              disabled={isLoading || !user}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                {isLoading ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <Wallet className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">In Wallet speichern</p>
                <p className="text-xs text-muted-foreground">
                  Mitgliedskarte speichern
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          {/* PWA Install Option */}
          {showInstallOption && canInstallPWA && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-accent/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-accent/10">
                <Smartphone className="h-5 w-5 text-accent" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">My2Go installieren</p>
                <p className="text-xs text-muted-foreground">Wie eine App nutzen</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Not logged in hint */}
        {!user && (
          <p className="text-xs text-muted-foreground text-center mt-3">
            Bitte zuerst registrieren, um den Wallet Pass zu erstellen.
          </p>
        )}

        <button
          onClick={handleDismiss}
          className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Später
        </button>
      </div>
    </motion.div>
  );
}
