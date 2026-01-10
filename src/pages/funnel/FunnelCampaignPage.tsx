import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Gift, Ticket, Trophy, Flame, Clock, Zap, Calendar, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FunnelRadioPlayer } from '@/components/funnel/FunnelRadioPlayer';
import { BonusPromptSheet } from '@/components/funnel/BonusPromptSheet';
import { QuickSignupSheet } from '@/components/funnel/QuickSignupSheet';
import { useRadioStore } from '@/lib/radio-store';
import { useAuth } from '@/contexts/AuthContext';
import { 
  trackFunnelEvent, 
  SIGNUP_BONUS_TALER, 
  getCampaignConfig, 
  HookType,
  CampaignConfig
} from '@/lib/funnel-config';
import { Coins } from 'lucide-react';

const HOOK_ICONS: Record<HookType, typeof Gift> = {
  coupon: Ticket,
  goodie: Gift,
  raffle: Trophy,
  streak: Flame,
  none: Zap,
};

const HOOK_COLORS: Record<HookType, string> = {
  coupon: 'bg-green-500/20 text-green-400 border-green-500/30',
  goodie: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  raffle: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  streak: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  none: 'bg-primary/20 text-primary border-primary/30',
};

// Default campaign for unknown slugs
const DEFAULT_CAMPAIGN: CampaignConfig = {
  campaignSlug: 'default',
  campaignName: 'Aktion',
  hookType: 'coupon',
  hookTitle: 'Bonus sichern',
  hookDetails: 'Nur für kurze Zeit verfügbar',
  validityText: 'Begrenzte Aktion',
  rewardCtaText: 'Mitmachen',
};

function useCountdown(targetDate: string | undefined) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    expired: false,
  });

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
      return;
    }

    const target = new Date(targetDate).getTime();

    const updateCountdown = () => {
      const now = Date.now();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, expired: false });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  return timeLeft;
}

export default function FunnelCampaignPage() {
  const { campaignSlug } = useParams<{ campaignSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isPlaying, togglePlay } = useRadioStore();
  
  const [showBonusPrompt, setShowBonusPrompt] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const config = getCampaignConfig(campaignSlug || '') || { ...DEFAULT_CAMPAIGN, campaignSlug: campaignSlug || 'default' };
  const HookIcon = HOOK_ICONS[config.hookType];
  const hookColor = HOOK_COLORS[config.hookType];
  const countdown = useCountdown(config.expiresAt);

  useEffect(() => {
    trackFunnelEvent('campaign_entry_view', { campaign_slug: campaignSlug || '' });
    trackFunnelEvent('campaign_hook_type', { hook_type: config.hookType });
  }, [campaignSlug, config.hookType]);

  const handlePrimaryClick = () => {
    if (countdown.expired) return;
    
    trackFunnelEvent('campaign_start_tap', { campaign_slug: campaignSlug });
    
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
      // Already logged in - go to rewards
      navigate('/rewards');
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
    trackFunnelEvent('bonus_granted', { campaign_slug: campaignSlug });
    navigate('/u/welcome');
  };

  const formatTimeUnit = (value: number) => String(value).padStart(2, '0');

  return (
    <div className="min-h-[calc(100vh-8rem)] flex flex-col px-4 py-8">
      <div className="w-full max-w-md mx-auto flex-1">
        {/* Campaign Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center mb-6"
        >
          <div className={`px-4 py-2 rounded-full ${hookColor} border flex items-center gap-2`}>
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-bold">{config.campaignName}</span>
            {!countdown.expired && <span className="animate-pulse">🔥</span>}
          </div>
        </motion.div>

        {/* Countdown Timer */}
        {config.expiresAt && !countdown.expired && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="bg-card/50 border border-border rounded-2xl p-4">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Timer className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium text-muted-foreground">Endet in</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                {countdown.days > 0 && (
                  <>
                    <div className="text-center">
                      <div className="bg-background rounded-lg px-3 py-2 min-w-[50px]">
                        <span className="text-2xl font-bold text-foreground">{formatTimeUnit(countdown.days)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 block">Tage</span>
                    </div>
                    <span className="text-xl font-bold text-muted-foreground">:</span>
                  </>
                )}
                <div className="text-center">
                  <div className="bg-background rounded-lg px-3 py-2 min-w-[50px]">
                    <span className="text-2xl font-bold text-foreground">{formatTimeUnit(countdown.hours)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">Std</span>
                </div>
                <span className="text-xl font-bold text-muted-foreground">:</span>
                <div className="text-center">
                  <div className="bg-background rounded-lg px-3 py-2 min-w-[50px]">
                    <span className="text-2xl font-bold text-foreground">{formatTimeUnit(countdown.minutes)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">Min</span>
                </div>
                <span className="text-xl font-bold text-muted-foreground">:</span>
                <div className="text-center">
                  <div className="bg-background rounded-lg px-3 py-2 min-w-[50px]">
                    <span className="text-2xl font-bold text-accent">{formatTimeUnit(countdown.seconds)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground mt-1 block">Sek</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Expired State */}
        {countdown.expired && config.expiresAt && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-4 text-center">
              <Clock className="h-8 w-8 text-destructive mx-auto mb-2" />
              <p className="font-bold text-destructive">Aktion beendet</p>
              <p className="text-sm text-muted-foreground">Diese Kampagne ist leider abgelaufen.</p>
            </div>
          </motion.div>
        )}

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center mb-3"
        >
          {config.hookTitle || `${SIGNUP_BONUS_TALER} 2Go Taler sichern`}
        </motion.h1>

        {/* Subline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg text-muted-foreground text-center mb-6"
        >
          {config.hookDetails || 'Radio starten + Bonus sichern – danach Gutscheine & Goodies nutzen.'}
        </motion.p>

        {/* Campaign Hook Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className={`p-4 rounded-2xl border-2 ${hookColor}`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`h-10 w-10 rounded-xl ${hookColor.split(' ').slice(0, 2).join(' ')} flex items-center justify-center`}>
                <HookIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {config.hookType === 'coupon' && 'Exklusiver Coupon'}
                  {config.hookType === 'goodie' && 'Limitiertes Goodie'}
                  {config.hookType === 'raffle' && 'Gewinnspiel'}
                  {config.hookType === 'streak' && 'Bonus-Serie Challenge'}
                  {config.hookType === 'none' && 'Bonus Aktion'}
                </p>
                <p className="font-bold text-foreground">{config.hookTitle}</p>
              </div>
            </div>
            {config.validityText && (
              <p className="text-sm text-muted-foreground">{config.validityText}</p>
            )}
            <p className="text-xs text-primary font-medium mt-2">
              Erscheint sofort nach Registrierung.
            </p>
          </div>
        </motion.div>

        {/* Bonus Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 mb-6"
        >
          <Coins className="h-6 w-6" />
          <span className="font-bold text-accent">+{SIGNUP_BONUS_TALER} 2Go Taler Bonus</span>
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-3"
        >
          <Button
            onClick={handlePrimaryClick}
            disabled={countdown.expired}
            size="lg"
            className="w-full h-14 text-base font-bold rounded-2xl bg-accent hover:bg-accent/90 text-accent-foreground shadow-xl shadow-accent/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Play className="h-5 w-5 mr-2" />
            {countdown.expired ? 'Aktion beendet' : (config.rewardCtaText || 'Jetzt mitmachen')}
          </Button>

          {!countdown.expired && (
            <button
              onClick={handleSecondaryClick}
              className="w-full py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Nur hören
            </button>
          )}
        </motion.div>

        {/* Trust Line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-xs text-muted-foreground text-center mt-6"
        >
          Kostenlos • kein Spam • jederzeit abmelden
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
        campaignSlug={campaignSlug}
      />
    </div>
  );
}
