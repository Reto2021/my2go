import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gift, Headphones, QrCode, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WalletCTA } from '@/components/funnel/WalletCTA';
import { FunnelRadioPlayer } from '@/components/funnel/FunnelRadioPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { trackFunnelEvent, SIGNUP_BONUS_TALER } from '@/lib/funnel-config';
import { Confetti } from '@/components/ui/confetti';
import { Coins } from 'lucide-react';

export default function FunnelWelcomePage() {
  const navigate = useNavigate();
  const { user, balance } = useAuth();

  useEffect(() => {
    trackFunnelEvent('welcome_view');
  }, []);

  const handleViewRewards = () => {
    trackFunnelEvent('rewards_viewed');
    navigate('/rewards');
  };

  const handleContinueListening = () => {
    navigate('/');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col px-4 py-8">
      {/* Confetti on load */}
      <Confetti 
        isActive={true} 
        showMessage={false}
        particleCount={60}
        duration={3000}
      />

      <div className="w-full max-w-md mx-auto flex-1">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex items-center justify-center mb-6"
        >
          <div className="relative">
            <div className="h-24 w-24 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-success" />
            </div>
            <motion.div
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="absolute -top-2 -right-2"
            >
              <Sparkles className="h-8 w-8 text-accent" />
            </motion.div>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-2"
        >
          Willkommen! 🎉
        </motion.h1>

        {/* Bonus Confirmation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <Coins className="h-6 w-6" />
          <span className="font-bold text-lg text-accent">
            +{SIGNUP_BONUS_TALER} 2Go Taler sind drauf
          </span>
        </motion.div>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-3xl bg-gradient-to-br from-primary/20 via-card to-accent/10 border border-primary/20 mb-6"
        >
          <p className="text-sm text-muted-foreground mb-1">Dein Guthaben</p>
          <div className="flex items-center gap-3">
            <Coins className="h-10 w-10 text-accent" />
            <span className="text-4xl font-extrabold text-foreground">
              {balance?.taler_balance || SIGNUP_BONUS_TALER}
            </span>
            <span className="text-lg text-muted-foreground">Taler</span>
          </div>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3 mb-6"
        >
          <Button
            onClick={handleViewRewards}
            size="lg"
            className="w-full h-14 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg"
          >
            <Gift className="h-5 w-5 mr-2" />
            Gutscheine & Goodies ansehen
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>

          <button
            onClick={handleContinueListening}
            className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
          >
            <Headphones className="h-4 w-4" />
            Weiterhören
          </button>
        </motion.div>

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex items-start gap-3 p-4 rounded-2xl bg-muted/50 mb-6"
        >
          <QrCode className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Tipp:</span> Scanne bei Partnern, um weitere Taler zu sammeln.
          </p>
        </motion.div>

        {/* Wallet & Install CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <WalletCTA 
            onInstallPWA={() => navigate('/u/install')}
          />
        </motion.div>
      </div>

      {/* Floating Radio Player */}
      <FunnelRadioPlayer variant="minimal" />
    </div>
  );
}
