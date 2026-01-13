import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const STORAGE_KEY = 'referral_banner_dismissed';
const DAYS_BEFORE_SHOW = 3; // Show after 3 days of being registered

export function ReferralPromoBanner() {
  const { user, profile } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    if (!user || !profile) return;
    
    // Check if already dismissed
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) return;
    
    // Check account age
    const createdAt = new Date(profile.created_at);
    const now = new Date();
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only show after X days and if user hasn't referred anyone yet
    if (daysSinceCreation >= DAYS_BEFORE_SHOW && (profile.referral_count || 0) === 0) {
      // Small delay to not overwhelm user
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [user, profile]);
  
  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="relative rounded-2xl bg-gradient-to-r from-accent/20 via-accent/10 to-primary/20 border border-accent/30 p-4">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-background/50 hover:bg-background/80 transition-colors"
              aria-label="Banner schliessen"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <div className="flex items-center gap-4">
              {/* Icon */}
              <div className="h-12 w-12 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
                <Gift className="h-6 w-6 text-accent" />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-bold text-foreground text-sm">
                  25 Taler für dich & deine Freunde!
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lade Freunde ein und erhalte Bonus-Taler.
                </p>
              </div>
              
              {/* CTA */}
              <Link
                to="/referral"
                onClick={handleDismiss}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-semibold whitespace-nowrap hover:bg-accent/90 transition-colors"
              >
                <Users className="h-4 w-4" />
                Einladen
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
