import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Flame, Clock, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FunnelRadioPlayer } from '@/components/funnel/FunnelRadioPlayer';
import { BonusPromptSheet } from '@/components/funnel/BonusPromptSheet';
import { QuickSignupSheet } from '@/components/funnel/QuickSignupSheet';
import { useRadioStore } from '@/lib/radio-store';
import { useAuth } from '@/contexts/AuthContext';
import { trackFunnelEvent, SIGNUP_BONUS_TALER, DROP_CONFIG } from '@/lib/funnel-config';
import talerCoin from '@/assets/taler-coin.png';

export default function FunnelDropPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPlaying, togglePlay } = useRadioStore();
  
  const [showBonusPrompt, setShowBonusPrompt] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [codeWord, setCodeWord] = useState('');
  const [codeError, setCodeError] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(DROP_CONFIG.defaultDurationMinutes * 60);

  useEffect(() => {
    trackFunnelEvent('drop_view');
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDropStart = () => {
    trackFunnelEvent('drop_start');
    
    // Check code word if enabled
    if (DROP_CONFIG.codeWordEnabled) {
      if (codeWord.toUpperCase() !== DROP_CONFIG.codeWord) {
        setCodeError(true);
        return;
      }
      trackFunnelEvent('codeword_success');
    }
    
    // Start radio
    if (!isPlaying) {
      togglePlay();
    }
    
    // Show signup prompt
    if (!user) {
      setTimeout(() => {
        trackFunnelEvent('signup_prompt_shown');
        setShowBonusPrompt(true);
      }, 1000);
    } else {
      navigate('/u/welcome');
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

  const isExpired = timeRemaining === 0;

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md mx-auto text-center">
        {/* Live Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-600 font-bold text-sm mb-6"
        >
          <Flame className="h-4 w-4" />
          Drop ist live 🔥
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4"
        >
          +{SIGNUP_BONUS_TALER} 2Go Taler – jetzt sichern
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground mb-6"
        >
          Tippen → Radio startet → Bonus sichern.
        </motion.p>

        {/* Countdown Timer */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl bg-card border-2 border-orange-500/30">
            <Clock className="h-6 w-6 text-orange-500" />
            <div className="text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Noch verfügbar</p>
              <p className="text-3xl font-mono font-bold text-foreground">
                {isExpired ? 'ABGELAUFEN' : formatTime(timeRemaining)}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Bonus Visual */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-3 mb-8"
        >
          <div className="relative">
            <img src={talerCoin} alt="" className="h-16 w-16" />
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-sm font-bold px-2 py-1 rounded-full"
            >
              +{SIGNUP_BONUS_TALER}
            </motion.div>
          </div>
        </motion.div>

        {/* Code Word Input (if enabled) */}
        {DROP_CONFIG.codeWordEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Code-Wort aus dem Radio</span>
            </div>
            <Input
              value={codeWord}
              onChange={(e) => {
                setCodeWord(e.target.value);
                setCodeError(false);
              }}
              placeholder="Code-Wort eingeben..."
              className={`h-14 text-center text-lg font-bold uppercase rounded-2xl ${
                codeError ? 'border-destructive' : ''
              }`}
            />
            {codeError && (
              <p className="text-sm text-destructive mt-2">Falsches Code-Wort. Hör genau hin!</p>
            )}
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleDropStart}
            size="lg"
            disabled={isExpired}
            className="w-full h-14 text-base font-bold rounded-2xl bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/30 transition-all hover:scale-[1.02] disabled:opacity-50"
          >
            <Play className="h-5 w-5 mr-2" />
            {isExpired ? 'Drop beendet' : 'Drop starten'}
          </Button>
        </motion.div>

        {/* Trust Line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-muted-foreground mt-6"
        >
          Kostenlos • kein Spam • Abmelden jederzeit
        </motion.p>
      </div>

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
