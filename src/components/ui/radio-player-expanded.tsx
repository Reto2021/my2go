import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Radio, 
  Music2,
  ChevronDown,
  Clock,
  Gift,
  Coins,
  Wallet,
  Video,
  Image
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { hapticToggle, hapticSuccess } from '@/lib/haptics';
import { useRadioStore, SongHistoryItem } from '@/lib/radio-store';
import { Slider } from '@/components/ui/slider';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

import { useAuthSafe } from '@/contexts/AuthContext';
import { LiveListenerCount } from '@/components/social-proof/LiveListenerCount';
import { TierCelebration } from '@/components/radio/TierCelebration';
import { AnimatedVinylFallback } from '@/components/radio/AnimatedVinylFallback';

interface ListeningTier {
  id: string;
  name: string;
  description: string | null;
  min_duration_seconds: number;
  taler_reward: number;
  sort_order: number;
}

interface ExpandedRadioPlayerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpandedRadioPlayer({ isOpen, onClose }: ExpandedRadioPlayerProps) {
  const navigate = useNavigate();
  const auth = useAuthSafe();
  const user = auth?.user ?? null;
  const isAuthenticated = !!user;
  
  const { 
    isPlaying, 
    isMuted, 
    isLoading, 
    volume, 
    nowPlaying, 
    songHistory,
    currentSessionDuration,
    updateSessionDuration,
    togglePlay, 
    toggleMute, 
    setVolume 
  } = useRadioStore();
  
  const [tiers, setTiers] = useState<ListeningTier[]>([]);
  const [showVideo, setShowVideo] = useState(true);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationTaler, setCelebrationTaler] = useState(0);
  const [celebrationTierName, setCelebrationTierName] = useState('');
  const lastReachedTierRef = useRef<string | null>(null);
  const hasStartedTrackingRef = useRef(false);

  // Update session duration every second
  useEffect(() => {
    if (isOpen && isPlaying) {
      const interval = setInterval(() => {
        updateSessionDuration();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen, isPlaying, updateSessionDuration]);

  // Fetch listening tiers
  useEffect(() => {
    if (isOpen && tiers.length === 0) {
      supabase
        .from('radio_listening_tiers')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .then(({ data }) => {
          if (data) setTiers(data);
        });
    }
  }, [isOpen, tiers.length]);

  // Calculate current and next tier
  const getCurrentAndNextTier = () => {
    if (tiers.length === 0) return { current: null, next: null, progress: 0 };
    
    let currentTier: ListeningTier | null = null;
    let nextTier: ListeningTier | null = null;
    
    for (let i = 0; i < tiers.length; i++) {
      if (currentSessionDuration >= tiers[i].min_duration_seconds) {
        currentTier = tiers[i];
        nextTier = tiers[i + 1] || null;
      } else {
        if (!currentTier) {
          nextTier = tiers[i];
        }
        break;
      }
    }
    
    // Calculate progress to next tier
    let progress = 0;
    if (nextTier) {
      const startSeconds = currentTier?.min_duration_seconds || 0;
      const endSeconds = nextTier.min_duration_seconds;
      const range = endSeconds - startSeconds;
      const elapsed = currentSessionDuration - startSeconds;
      progress = Math.min(100, Math.max(0, (elapsed / range) * 100));
    } else if (currentTier) {
      progress = 100; // All tiers completed
    }
    
    return { current: currentTier, next: nextTier, progress };
  };

  const { current: currentTier, next: nextTier, progress } = getCurrentAndNextTier();
  
  // Calculate remaining seconds for countdown animation
  const remainingSeconds = nextTier 
    ? nextTier.min_duration_seconds - currentSessionDuration 
    : 0;
  const isCountdownUrgent = remainingSeconds > 0 && remainingSeconds <= 30;
  
  // Detect tier advancement and trigger celebration
  useEffect(() => {
    if (currentTier && isAuthenticated && isOpen && isPlaying) {
      // Check if this is a new tier (not yet celebrated)
      const celebratedTiers = lastReachedTierRef.current ? lastReachedTierRef.current.split(',') : [];
      
      if (!celebratedTiers.includes(currentTier.id)) {
        // Only celebrate if we've been tracking (started playing from beginning)
        if (hasStartedTrackingRef.current) {
          setCelebrationTaler(currentTier.taler_reward);
          setCelebrationTierName(currentTier.name);
          setShowCelebration(true);
          hapticSuccess();
        }
        // Add this tier to celebrated list
        lastReachedTierRef.current = [...celebratedTiers, currentTier.id].join(',');
      }
    }
  }, [currentTier?.id, isAuthenticated, isOpen, isPlaying]);
  
  // Start tracking when playing begins
  useEffect(() => {
    if (isPlaying && !hasStartedTrackingRef.current) {
      hasStartedTrackingRef.current = true;
    }
  }, [isPlaying]);
  
  // Reset tracking when radio stops
  useEffect(() => {
    if (!isPlaying) {
      hasStartedTrackingRef.current = false;
      lastReachedTierRef.current = null;
    }
  }, [isPlaying]);
  
  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: '100%' }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-0 z-[200] flex flex-col overflow-hidden bg-gradient-to-b from-secondary via-secondary to-black"
        >
          {/* Header with integrated close button and swipe indicator */}
          <div 
            className="flex-shrink-0 relative z-50" 
            style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
          >
            {/* Swipe indicator - purely visual, positioned above header content */}
            <div className="flex justify-center pt-2 pb-1">
              <div className="w-10 h-1 rounded-full bg-white/30" />
            </div>
            
            {/* Header row with close button */}
            <div className="flex items-center justify-between px-3 sm:px-4 py-2">
              {/* Close Button - clear and prominent */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  hapticToggle();
                  onClose();
                }}
                className="h-10 w-10 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 active:bg-white/30 transition-colors touch-manipulation"
                aria-label="Schliessen"
              >
                <ChevronDown className="h-6 w-6 text-white" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-accent" />
                  <span className="text-sm font-semibold text-white">Radio 2Go Live</span>
                </div>
                {isPlaying && <LiveListenerCount size="sm" className="bg-white/10" />}
              </div>
              
              {/* Empty spacer for balanced header */}
              <div className="h-10 w-10" />
            </div>
          </div>

          {/* Scrollable Main Content - NO drag on this container to allow button clicks */}
          <div 
            className="flex-1 flex flex-col items-center overflow-y-auto overflow-x-hidden px-4 sm:px-8 py-2 sm:py-4 relative z-20" 
            style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          >
            {/* Large Cover Art or Video */}
            <ArtworkDisplay 
              artworkUrl={nowPlaying?.artworkUrl} 
              videoUrl={nowPlaying?.videoUrl}
              title={nowPlaying?.title}
              isPlaying={isPlaying}
              showVideo={showVideo}
              onToggleMedia={() => setShowVideo(!showVideo)}
            />

            {/* Song Info with change animation */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center mb-4 sm:mb-8 max-w-md w-full"
            >
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={nowPlaying?.title || 'default'}
                  initial={{ y: 20, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: -20, opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="font-bold text-white mb-1 sm:mb-2 truncate text-xl sm:text-2xl"
                >
                  {nowPlaying?.title || 'Radio 2Go'}
                </motion.h2>
              </AnimatePresence>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={nowPlaying?.artist || 'default-artist'}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
                  className="text-white/60 truncate text-base sm:text-lg"
                >
                  {nowPlaying?.artist || 'Live Stream'}
                </motion.p>
              </AnimatePresence>
            </motion.div>

            {/* Progress Bar to Next Tier - or Login Prompt for unauthenticated */}
            {tiers.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="w-full max-w-sm mb-4 sm:mb-6"
              >
                {isAuthenticated ? (
                  <div className="bg-white/10 rounded-2xl p-3 sm:p-4">
                    {/* Section Label */}
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Gift className="h-4 w-4 text-accent" />
                      <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">
                        2Go-Taler beim Hören verdienen
                      </span>
                    </div>
                    
                    {/* Timer Display - Countdown to next reward */}
                    <div className={cn(
                      "flex items-center justify-center gap-2 mb-2 transition-all",
                      isCountdownUrgent && "animate-pulse"
                    )}>
                      <Clock className={cn(
                        "h-4 w-4 transition-colors",
                        isCountdownUrgent ? "text-accent" : "text-white/60"
                      )} />
                      {nextTier ? (
                        <>
                          <motion.span 
                            className={cn(
                              "text-base sm:text-lg font-bold tabular-nums transition-colors",
                              isCountdownUrgent ? "text-accent" : "text-accent"
                            )}
                            animate={isCountdownUrgent ? { 
                              scale: [1, 1.05, 1],
                            } : {}}
                            transition={{ 
                              duration: 0.5, 
                              repeat: isCountdownUrgent ? Infinity : 0,
                              repeatType: "reverse"
                            }}
                          >
                            {formatCountdown(remainingSeconds)}
                          </motion.span>
                          <span className={cn(
                            "text-xs transition-colors",
                            isCountdownUrgent ? "text-accent/80 font-semibold" : "text-white/50"
                          )}>
                            bis +{nextTier.taler_reward} Taler
                          </span>
                          {isCountdownUrgent && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="text-lg"
                            >
                              🔥
                            </motion.span>
                          )}
                        </>
                      ) : (
                        <>
                          <span className="text-base sm:text-lg font-bold text-green-400 tabular-nums">
                            {formatSessionDuration(currentSessionDuration)}
                          </span>
                          <span className="text-xs text-white/50">Maximum erreicht! 🎉</span>
                        </>
                      )}
                    </div>
                    
                    {/* Progress Bar with Label */}
                    <div className="mb-2 sm:mb-3">
                      <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                        <span className="text-white/60">
                          {currentTier ? `${currentTier.name} erreicht` : 'Fortschritt'}
                        </span>
                        {nextTier && (
                          <span className="text-white/60">
                            Nächste Stufe: {formatDuration(nextTier.min_duration_seconds)}
                          </span>
                        )}
                      </div>
                      <div className="relative h-2 sm:h-3 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-primary rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                    
                    {/* Reward Info */}
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5">
                        <Coins className="h-4 w-4 text-accent" />
                        <span className="text-white/70">Aktuell verdient:</span>
                        <span className="text-accent font-bold">
                          {currentTier ? `+${currentTier.taler_reward}` : '0'} Taler
                        </span>
                      </div>
                      {nextTier && (
                        <div className="flex items-center gap-1 text-white/50">
                          <span>→</span>
                          <span className="text-accent/70">+{nextTier.taler_reward}</span>
                        </div>
                      )}
                      {!nextTier && currentTier && (
                        <span className="text-green-400 font-semibold text-xs">Maximum! 🎉</span>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Login Prompt for unauthenticated users */
                  <div className="bg-white/10 rounded-2xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Coins className="h-5 w-5 text-accent" />
                      <span className="text-base font-bold text-white">2Go Taler verdienen</span>
                    </div>
                    <p className="text-sm text-white/70 mb-4">
                      Melde dich an, um beim Radiohören Taler zu sammeln und exklusive Gutscheine einzulösen!
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        navigate('/auth');
                      }}
                      className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-accent text-accent-foreground font-semibold text-sm active:scale-95 transition-transform touch-manipulation"
                    >
                      <Wallet className="h-4 w-4" />
                      Kostenlos anmelden
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Volume Slider */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="w-full max-w-xs mb-4 sm:mb-8"
            >
              <div className="flex items-center gap-4 touch-none">
                <button 
                  type="button"
                  onClick={toggleMute} 
                  className="text-white/60 hover:text-white transition-colors touch-manipulation p-2 -m-2"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={(value) => setVolume(value[0] / 100)}
                  max={100}
                  step={1}
                  className="flex-1 touch-none"
                />
              </div>
            </motion.div>

            {/* Play/Pause Button */}
            <button
              type="button"
              onClick={() => {
                hapticToggle();
                togglePlay();
              }}
              disabled={isLoading}
              className={cn(
                "h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center transition-all flex-shrink-0 touch-manipulation active:scale-95",
                isPlaying 
                  ? "bg-white text-secondary hover:bg-white/90" 
                  : "bg-accent text-accent-foreground hover:bg-accent/90",
                isLoading && "opacity-50"
              )}
            >
              {isLoading ? (
                <div className="h-6 w-6 sm:h-8 sm:w-8 border-3 border-current border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6 sm:h-8 sm:w-8" />
              ) : (
                <Play className="h-6 w-6 sm:h-8 sm:w-8 ml-1" />
              )}
            </button>
            
            {/* Song History - always show if available */}
            {songHistory.length > 0 && (
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="w-full max-w-sm pb-4 mt-6"
              >
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-white/40" />
                  <span className="text-sm font-semibold text-white/60">Zuletzt gespielt</span>
                </div>
                <div className="space-y-2">
                  {songHistory.slice(0, 5).map((song, index) => (
                    <SongHistoryRow key={`${song.title}-${song.playedAt}`} song={song} index={index} />
                  ))}
                </div>
              </motion.div>
            )}
          </div>
          
          {/* Tier Celebration Overlay */}
          <TierCelebration 
            isVisible={showCelebration}
            talerAmount={celebrationTaler}
            tierName={celebrationTierName}
            onDismiss={() => setShowCelebration(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SongHistoryRow = ({ song, index }: { song: SongHistoryItem; index: number }) => (
  <motion.div
    initial={{ x: -20, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    transition={{ delay: 0.5 + index * 0.05 }}
    className="flex items-center gap-3 p-2 rounded-xl bg-white/5"
  >
    <div className="h-10 w-10 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
      {song.artworkUrl ? (
        <img src={song.artworkUrl} alt={song.title} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <Music2 className="h-4 w-4 text-white/30" />
        </div>
      )}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-white truncate">{song.title}</p>
      <p className="text-xs text-white/50 truncate">{song.artist}</p>
    </div>
    <span className="text-xs text-white/40 flex-shrink-0">
      {formatDistanceToNow(new Date(song.playedAt), { addSuffix: true, locale: de })}
    </span>
  </motion.div>
);

function formatDuration(seconds: number): string {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} Std.`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes} Min.`;
}

function formatSessionDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatCountdown(remainingSeconds: number): string {
  if (remainingSeconds <= 0) return '0:00';
  
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function RewardTierRow({ tier, index }: { tier: ListeningTier; index: number }) {
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.1 + index * 0.05 }}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
    >
      <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
        <Coins className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{tier.name}</p>
        <p className="text-xs text-white/50">ab {formatDuration(tier.min_duration_seconds)}</p>
      </div>
      <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-accent/20">
        <span className="text-sm font-bold text-accent">+{tier.taler_reward}</span>
        <Coins className="h-3.5 w-3.5" />
      </div>
    </motion.div>
  );
}

// Helper component that shows vinyl on image load error or if no artwork
function ArtworkWithFallback({ 
  src, 
  alt, 
  isPlaying 
}: { 
  src: string; 
  alt?: string; 
  isPlaying: boolean 
}) {
  const [hasError, setHasError] = useState(false);
  
  // Show vinyl if no src or on error
  if (!src || hasError) {
    return <AnimatedVinylFallback isPlaying={isPlaying} size="lg" />;
  }
  
  return (
    <img
      src={src}
      alt={alt || 'Album cover'}
      className="w-full h-full object-cover"
      onError={() => setHasError(true)}
    />
  );
}

// Storage key for video hint
const VIDEO_HINT_SHOWN_KEY = 'radio2go_video_hint_shown';

// Memoized artwork component to prevent flickering during session duration updates
const ArtworkDisplay = React.memo(function ArtworkDisplay({
  artworkUrl,
  videoUrl,
  title,
  isPlaying,
  showVideo,
  onToggleMedia
}: {
  artworkUrl?: string | null;
  videoUrl?: string | null;
  title?: string;
  isPlaying: boolean;
  showVideo: boolean;
  onToggleMedia: () => void;
}) {
  const hasVideo = !!videoUrl;
  const shouldShowVideo = showVideo && hasVideo;
  
  // Check localStorage to see if hint was already shown
  const [showHint, setShowHint] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(VIDEO_HINT_SHOWN_KEY);
  });

  // Auto-hide hint after 4 seconds and mark as shown in localStorage
  useEffect(() => {
    if (hasVideo && showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem(VIDEO_HINT_SHOWN_KEY, 'true');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [hasVideo, showHint]);

  // Handle toggle with haptic feedback
  const handleToggle = () => {
    hapticToggle();
    // If hint is showing, hide it and mark as shown
    if (showHint) {
      setShowHint(false);
      localStorage.setItem(VIDEO_HINT_SHOWN_KEY, 'true');
    }
    onToggleMedia();
  };

  return (
    <div className="relative">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl mb-4 sm:mb-8 flex-shrink-0 w-[200px] h-[200px] xs:w-[240px] xs:h-[240px] sm:w-[280px] sm:h-[280px] md:w-[320px] md:h-[320px]"
        onClick={hasVideo ? handleToggle : undefined}
        style={{ cursor: hasVideo ? 'pointer' : 'default' }}
      >
        {shouldShowVideo ? (
          <video
            src={videoUrl!}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <ArtworkWithFallback 
            src={artworkUrl || ''} 
            alt={title} 
            isPlaying={isPlaying}
          />
        )}
        
        {/* Video hint overlay - shows when video is available but not playing */}
        <AnimatePresence>
          {hasVideo && !shouldShowVideo && showHint && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
            >
              <div className="flex flex-col items-center gap-2 text-white">
                <Video className="h-8 w-8" />
                <span className="text-sm font-medium">Tippe für Video</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Playing indicator */}
        {isPlaying && !shouldShowVideo && !showHint && (
          <div className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm">
            <div className="flex items-end gap-0.5 h-4">
              <motion.div
                animate={{ height: ['40%', '100%', '60%', '80%', '40%'] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1 bg-accent rounded-full"
              />
              <motion.div
                animate={{ height: ['60%', '40%', '100%', '50%', '60%'] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
                className="w-1 bg-accent rounded-full"
              />
              <motion.div
                animate={{ height: ['80%', '60%', '40%', '100%', '80%'] }}
                transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                className="w-1 bg-accent rounded-full"
              />
            </div>
            <span className="text-xs font-semibold text-white ml-1">LIVE</span>
          </div>
        )}
      </motion.div>
      
      {/* Video/Cover Toggle Button - small indicator */}
      {hasVideo && (
        <button
          onClick={handleToggle}
          className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors z-10"
          title={shouldShowVideo ? 'Cover anzeigen' : 'Video anzeigen'}
        >
          {shouldShowVideo ? (
            <Image className="h-4 w-4 text-white" />
          ) : (
            <Video className="h-4 w-4 text-white" />
          )}
        </button>
      )}
    </div>
  );
});
