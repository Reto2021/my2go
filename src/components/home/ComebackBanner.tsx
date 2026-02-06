import { motion, AnimatePresence } from 'framer-motion';
import { PartyPopper, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import talerCoin from '@/assets/taler-coin.png';

interface ComebackBannerProps {
  isVisible: boolean;
  isClaiming: boolean;
  onClaim: () => void;
  onDismiss: () => void;
}

export function ComebackBanner({ isVisible, isClaiming, onClaim, onDismiss }: ComebackBannerProps) {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20 }}
        className="p-4 rounded-2xl bg-gradient-to-r from-accent/20 to-primary/10 border border-accent/30 relative"
      >
        <button onClick={onDismiss} className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center shrink-0">
            <PartyPopper className="h-6 w-6 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm">Willkommen zurück! 🎉</p>
            <p className="text-xs text-muted-foreground">Wir haben dich vermisst – hier sind 10 Bonus-Taler für dich.</p>
          </div>
        </div>
        <Button
          onClick={onClaim}
          disabled={isClaiming}
          size="sm"
          className="w-full mt-3 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          {isClaiming ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <img src={talerCoin} alt="" className="w-4 h-4 mr-2" />
          )}
          10 Taler einlösen
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
