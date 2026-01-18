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
            "bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-500/20",
            "border border-amber-500/30 rounded-2xl",
            "flex items-center justify-between gap-3",
            "hover:border-amber-500/50 transition-colors"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 shrink-0">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-amber-700 dark:text-amber-400">
                Noch {trialDaysRemaining} Tage Premium gratis
              </p>
              <p className="text-sm text-muted-foreground">
                Jetzt 2Go Plus sichern und alle Rewards freischalten
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
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
          "bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500",
          "flex items-center justify-between gap-3",
          "hover:opacity-95 transition-opacity"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-white/20 shrink-0">
            <Crown className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-white">
              2Go Plus entdecken
            </p>
            <p className="text-sm text-white/80">
              CHF-Rabatte, 2für1 & mehr ab CHF 4.90/Monat
            </p>
          </div>
        </div>
        <ChevronRight className="h-5 w-5 text-white shrink-0" />
      </div>
      
      <PlusUpgradeSheet 
        open={showUpgradeSheet} 
        onOpenChange={setShowUpgradeSheet}
        trigger="banner"
      />
    </motion.div>
  );
}
