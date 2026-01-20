import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Gift, Radio, CheckCircle2, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FunnelRadioPlayer } from '@/components/funnel/FunnelRadioPlayer';
import { BonusPromptSheet } from '@/components/funnel/BonusPromptSheet';
import { QuickSignupSheet } from '@/components/funnel/QuickSignupSheet';
import { TalerLoopVisual } from '@/components/taler/TalerLoopVisual';
import { useRadioStore } from '@/lib/radio-store';
import { useAuth } from '@/contexts/AuthContext';
import { trackFunnelEvent, SIGNUP_BONUS_TALER } from '@/lib/funnel-config';
import { Coins } from 'lucide-react';

export default function FunnelEntryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPlaying, togglePlay } = useRadioStore();
  
  const [showBonusPrompt, setShowBonusPrompt] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [hasStartedRadio, setHasStartedRadio] = useState(false);

  useEffect(() => {
    trackFunnelEvent('go_view');
  }, []);

  // Show bonus prompt after radio starts (with delay)
  useEffect(() => {
    if (isPlaying && !user && !showBonusPrompt && hasStartedRadio) {
      const timer = setTimeout(() => {
        trackFunnelEvent('signup_prompt_shown');
        setShowBonusPrompt(true);
      }, 15000); // 15 seconds after play
      return () => clearTimeout(timer);
    }
  }, [isPlaying, user, showBonusPrompt, hasStartedRadio]);

  const handlePrimaryClick = () => {
    trackFunnelEvent('go_start_tap');
    
    // Start radio
    if (!isPlaying) {
      togglePlay();
      setHasStartedRadio(true);
    }
    
    // If not logged in, show bonus prompt immediately
    if (!user) {
      setTimeout(() => {
        trackFunnelEvent('signup_prompt_shown');
        setShowBonusPrompt(true);
      }, 2000);
    } else {
      // Already logged in, go to home
      navigate('/');
    }
  };

  const handleSecondaryClick = () => {
    // Just start radio without signup prompt
    if (!isPlaying) {
      togglePlay();
      setHasStartedRadio(true);
    }
  };

  const handleSignupStart = () => {
    setShowBonusPrompt(false);
    setShowSignup(true);
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
    trackFunnelEvent('bonus_granted');
    navigate('/u/welcome');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col">
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md mx-auto text-center">
          {/* Bonus Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 text-accent-foreground font-bold text-sm mb-6"
          >
            <Coins className="h-5 w-5" />
            +{SIGNUP_BONUS_TALER} 2Go Taler Bonus
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
          >
            {SIGNUP_BONUS_TALER} 2Go Taler holen & Radio starten
          </motion.h1>

          {/* Subline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-muted-foreground mb-8"
          >
            Tippen, hören, registrieren (10 Sekunden) – danach Gutscheine & Goodies sichern.
          </motion.p>

          {/* Radio Player Visual */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <FunnelRadioPlayer variant="expanded" onPlayStart={() => setHasStartedRadio(true)} />
          </motion.div>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <Button
              onClick={handlePrimaryClick}
              size="lg"
              className="w-full h-14 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/30 transition-all hover:scale-[1.02]"
            >
              <Play className="h-5 w-5 mr-2" />
              Jetzt starten (Radio + Bonus)
            </Button>

            <button
              onClick={handleSecondaryClick}
              className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Nur hören
            </button>
          </motion.div>

          {/* Trust Line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-muted-foreground mt-6"
          >
            Kostenlos • lokal einlösbar • du entscheidest, welche Angebote du bekommst
          </motion.p>
        </div>
      </section>

      {/* Taler Loop Section */}
      <section className="px-4 pb-4">
        <div className="max-w-md mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <TalerLoopVisual variant="compact" className="mb-4" />
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 pb-8">
        <div className="max-w-md mx-auto">
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Radio, label: 'Hör Radio' },
              { icon: Gift, label: 'Sammle Taler' },
              { icon: MapPin, label: 'Geniess vor Ort' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.1 }}
                className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-muted/50"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs font-medium text-center">{item.label}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Floating Radio Player */}
      <FunnelRadioPlayer variant="minimal" />

      {/* Bonus Prompt Sheet */}
      <BonusPromptSheet
        isOpen={showBonusPrompt}
        onClose={() => setShowBonusPrompt(false)}
        onSignup={handleSignupStart}
      />

      {/* Quick Signup Sheet */}
      <QuickSignupSheet
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        onSuccess={handleSignupSuccess}
      />
    </div>
  );
}
