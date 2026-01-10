import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Gift, Ticket, Trophy, Flame, CheckCircle2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FunnelRadioPlayer } from '@/components/funnel/FunnelRadioPlayer';
import { BonusPromptSheet } from '@/components/funnel/BonusPromptSheet';
import { QuickSignupSheet } from '@/components/funnel/QuickSignupSheet';
import { useRadioStore } from '@/lib/radio-store';
import { useAuth } from '@/contexts/AuthContext';
import { 
  trackFunnelEvent, 
  SIGNUP_BONUS_TALER, 
  getPartnerConfig, 
  HookType 
} from '@/lib/funnel-config';
import talerCoin from '@/assets/taler-coin.png';

const HOOK_ICONS: Record<HookType, typeof Gift> = {
  coupon: Ticket,
  goodie: Gift,
  raffle: Trophy,
  streak: Flame,
  none: Gift,
};

const HOOK_COLORS: Record<HookType, string> = {
  coupon: 'bg-green-500/20 text-green-600',
  goodie: 'bg-purple-500/20 text-purple-600',
  raffle: 'bg-amber-500/20 text-amber-600',
  streak: 'bg-orange-500/20 text-orange-600',
  none: 'bg-primary/20 text-primary',
};

export default function FunnelPartnerPage() {
  const { partnerSlug } = useParams<{ partnerSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPlaying, togglePlay } = useRadioStore();
  
  const [showBonusPrompt, setShowBonusPrompt] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const config = getPartnerConfig(partnerSlug || 'default');
  const HookIcon = HOOK_ICONS[config.hookType];
  const hookColor = HOOK_COLORS[config.hookType];

  useEffect(() => {
    trackFunnelEvent('partner_entry_view', { partner_slug: partnerSlug || '' });
    trackFunnelEvent('partner_hook_type', { hook_type: config.hookType });
  }, [partnerSlug, config.hookType]);

  const handlePrimaryClick = () => {
    trackFunnelEvent('go_start_tap', { partner_slug: partnerSlug });
    
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
      // Already logged in - go to partner rewards
      navigate(`/partner/${partnerSlug}`);
    }
  };

  const handleSecondaryClick = () => {
    if (!isPlaying) {
      togglePlay();
    }
  };

  const handleSignupStart = () => {
    setShowBonusPrompt(false);
    setShowSignup(true);
  };

  const handleSignupSuccess = () => {
    setShowSignup(false);
    trackFunnelEvent('bonus_granted', { partner_slug: partnerSlug });
    navigate('/u/welcome');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col px-4 py-8">
      <div className="w-full max-w-md mx-auto flex-1">
        {/* Partner Logo/Icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center mb-6"
        >
          <div className="h-20 w-20 rounded-3xl bg-primary/20 flex items-center justify-center">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.partnerName} className="h-full w-full object-cover rounded-3xl" />
            ) : (
              <Store className="h-10 w-10 text-secondary" />
            )}
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-3"
        >
          Bei {config.partnerName} gibt's Vorteile mit My2Go ✅
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-muted-foreground text-center mb-6"
        >
          Radio starten + {SIGNUP_BONUS_TALER} 2Go Taler sichern – danach Gutscheine & Goodies nutzen.
        </motion.p>

        {/* Partner Hook Badge */}
        {config.hookType !== 'none' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className={`p-4 rounded-2xl border-2 ${hookColor.replace('text-', 'border-').replace('/20', '/30')}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`h-10 w-10 rounded-xl ${hookColor} flex items-center justify-center`}>
                  <HookIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    {config.hookType === 'coupon' && `Heute bei ${config.partnerName}`}
                    {config.hookType === 'goodie' && 'Diese Woche'}
                    {config.hookType === 'raffle' && 'Mitmachen & gewinnen'}
                    {config.hookType === 'streak' && 'Jeder Besuch zählt'}
                  </p>
                  <p className="font-bold text-foreground">{config.hookTitle}</p>
                </div>
              </div>
              {config.hookDetails && (
                <p className="text-sm text-muted-foreground">{config.hookDetails}</p>
              )}
              {config.validityText && (
                <p className="text-xs text-muted-foreground mt-2">{config.validityText}</p>
              )}
              <p className="text-xs text-primary font-medium mt-2">
                Erscheint sofort nach Registrierung.
              </p>
            </div>
          </motion.div>
        )}

        {/* Bonus Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <img src={talerCoin} alt="" className="h-6 w-6" />
          <span className="font-bold text-accent">+{SIGNUP_BONUS_TALER} 2Go Taler Bonus</span>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <Button
            onClick={handlePrimaryClick}
            size="lg"
            className="w-full h-14 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/30 transition-all hover:scale-[1.02]"
          >
            <Play className="h-5 w-5 mr-2" />
            Starten & Bonus holen
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
          transition={{ delay: 0.6 }}
          className="text-xs text-muted-foreground text-center mt-6"
        >
          Kostenlos • lokal einlösbar • jederzeit abmelden
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
        partnerSlug={partnerSlug}
      />
    </div>
  );
}
