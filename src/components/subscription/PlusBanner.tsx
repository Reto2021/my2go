import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, ChevronRight } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { PlusUpgradeSheet } from '@/components/subscription/PlusUpgradeSheet';
import { cn } from '@/lib/utils';

export function PlusBanner() {
  const { user } = useAuth();
  const { isSubscribed, isTrial, trialDaysRemaining, isLoading } = useSubscription();
  const [showUpgradeSheet, setShowUpgradeSheet] = useState(false);

  // Don't show if not logged in, loading, or already subscribed (not trial)
  if (!user || isLoading || (isSubscribed && !isTrial)) {
    return null;
  }

  // Show trial countdown banner
  if (isTrial && trialDaysRemaining) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
      >
        <div 
          onClick={() => setShowUpgradeSheet(true)}
          className={cn(
            "cursor-pointer p-4",
            "bg-gradient-to-r from-accent/20 via-accent/15 to-accent/20",
            "border border-accent/30 rounded-2xl",
            "flex items-center justify-between gap-3",
            "hover:border-accent/50 transition-colors"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent to-accent/80 shrink-0">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="font-semibold text-accent">
                Noch {trialDaysRemaining} Tage Premium gratis
              </p>
              <p className="text-sm text-muted-foreground">
                Jetzt 2Go Plus sichern und alle Rewards freischalten
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-accent shrink-0" />
        </div>
        
        <PlusUpgradeSheet 
          open={showUpgradeSheet} 
          onOpenChange={setShowUpgradeSheet}
          trigger="banner"
        />
      </motion.div>
    );
  }

  // Show upgrade CTA banner for free users
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl overflow-hidden"
    >
      <div 
        onClick={() => setShowUpgradeSheet(true)}
        className={cn(
          "cursor-pointer p-4",
          "bg-gradient-to-r from-accent via-accent/90 to-accent",
          "flex items-center justify-between gap-3",
          "hover:opacity-95 transition-opacity"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-accent-foreground/20 shrink-0">
            <Crown className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <p className="font-semibold text-accent-foreground">
              2Go Plus entdecken
            </p>
            <p className="text-sm text-accent-foreground/80">
              CHF-Rabatte, 2für1 & mehr ab CHF 4.90/Monat
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-accent-foreground shrink-0" />
      </div>
      
      <PlusUpgradeSheet 
        open={showUpgradeSheet} 
        onOpenChange={setShowUpgradeSheet}
        trigger="banner"
      />
    </motion.div>
  );
}
