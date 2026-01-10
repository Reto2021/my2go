import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Wallet, Smartphone, X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { trackFunnelEvent } from '@/lib/funnel-config';

interface WalletCTAProps {
  className?: string;
  onAddWallet?: () => void;
  onInstallPWA?: () => void;
  onDismiss?: () => void;
}

export function WalletCTA({ 
  className, 
  onAddWallet, 
  onInstallPWA,
  onDismiss 
}: WalletCTAProps) {
  const [isAppleDevice, setIsAppleDevice] = useState(false);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [canInstallPWA, setCanInstallPWA] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Detect device
    const ua = navigator.userAgent;
    setIsAppleDevice(/iPhone|iPad|iPod/.test(ua));
    
    // Check if PWA is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    setIsPWAInstalled(isStandalone);

    // Listen for beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstallPWA(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleWalletClick = () => {
    trackFunnelEvent('wallet_cta_shown');
    trackFunnelEvent('wallet_added', { type: isAppleDevice ? 'apple' : 'google' });
    onAddWallet?.();
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
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || isPWAInstalled) {
    return null;
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
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-2">
          {/* Wallet Option */}
          <button
            onClick={handleWalletClick}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-sm">In Wallet speichern</p>
              <p className="text-xs text-muted-foreground">
                {isAppleDevice ? 'Apple Wallet' : 'Google Wallet'}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          {/* PWA Install Option */}
          {canInstallPWA && (
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 transition-colors text-left"
            >
              <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-accent/10">
                <Smartphone className="h-5 w-5 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">My2Go installieren</p>
                <p className="text-xs text-muted-foreground">Wie eine App nutzen</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>

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
