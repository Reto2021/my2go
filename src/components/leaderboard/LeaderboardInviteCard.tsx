import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'leaderboard_invite_dismissed';
const MIN_TRANSACTIONS_TO_SHOW = 3;

export function LeaderboardInviteCard() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [show, setShow] = useState(false);
  const [transactionCount, setTransactionCount] = useState(0);
  
  useEffect(() => {
    if (!user || !profile) return;
    
    // Don't show if already participating
    if (profile.show_on_leaderboard) return;
    
    // Don't show if already has nickname
    if (profile.leaderboard_nickname) return;
    
    // Check if dismissed recently (7 days)
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const daysSince = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return;
    }
    
    // Check transaction count
    async function checkTransactions() {
      const { count } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('type', 'earn');
      
      if (count && count >= MIN_TRANSACTIONS_TO_SHOW) {
        setTransactionCount(count);
        setShow(true);
      }
    }
    
    checkTransactions();
  }, [user, profile]);
  
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    setShow(false);
  };
  
  const handleJoin = () => {
    navigate('/leaderboard');
    setShow(false);
  };
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, height: 0, marginBottom: 0 }}
          animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
          exit={{ opacity: 0, height: 0, marginBottom: 0 }}
          className="overflow-hidden"
        >
          <div className="relative p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-primary/5 to-accent/10 border border-amber-500/20">
            {/* Dismiss button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-muted/50 transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
            
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Trophy className="h-6 w-6 text-amber-500" />
              </div>
              
              <div className="flex-1 min-w-0 pr-6">
                <h3 className="font-bold text-foreground mb-1">
                  Tritt dem Leaderboard bei!
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Du hast bereits {transactionCount} Taler-Transaktionen. 
                  Zeige deinen Fortschritt im wöchentlichen Ranking!
                </p>
                
                <button
                  onClick={handleJoin}
                  className="flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 transition-colors"
                >
                  <User className="h-4 w-4" />
                  Nickname wählen
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}