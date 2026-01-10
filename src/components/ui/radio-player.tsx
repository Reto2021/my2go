import { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, VolumeX, Radio, Music2, Expand, ChevronUp, ChevronDown, Gift, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';
import { ExpandedRadioPlayer } from './radio-player-expanded';
import { TalerIcon } from '@/components/icons/TalerIcon';
import { supabase } from '@/integrations/supabase/client';

interface ListeningTier {
  id: string;
  name: string;
  min_duration_seconds: number;
  taler_reward: number;
  sort_order: number;
}

const formatDuration = (seconds: number): string => {
  if (seconds >= 3600) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} Std.`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes} Min.`;
};

export function RadioPlayer({ className }: { className?: string }) {
  const { 
    isPlaying, 
    isMuted, 
    isLoading, 
    nowPlaying, 
    currentSessionDuration,
    updateSessionDuration,
    togglePlay, 
    toggleMute,
    fetchNowPlaying 
  } = useRadioStore();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [showTiersOverview, setShowTiersOverview] = useState(false);
  const [tiers, setTiers] = useState<ListeningTier[]>([]);
  const [showTierReached, setShowTierReached] = useState(false);
  const [reachedTier, setReachedTier] = useState<ListeningTier | null>(null);
  const lastReachedTierRef = useRef<string | null>(null);

  // Fetch now playing on mount and periodically
  useEffect(() => {
    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, 30000);
    return () => clearInterval(interval);
  }, [fetchNowPlaying]);

  // Refetch when playing starts
  useEffect(() => {
    if (isPlaying) {
      fetchNowPlaying();
    }
  }, [isPlaying, fetchNowPlaying]);

  // Fetch tiers
  useEffect(() => {
    supabase
      .from('radio_listening_tiers')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data }) => {
        if (data) setTiers(data);
      });
  }, []);

  // Update session duration every second
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        updateSessionDuration();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying, updateSessionDuration]);

  // Calculate progress and check for tier reached
  const getCurrentTierInfo = () => {
    if (tiers.length === 0) return { progress: 0, currentTier: null, nextTier: null };
    
    let currentTier: ListeningTier | null = null;
    let nextTier: ListeningTier | null = null;
    
    for (let i = 0; i < tiers.length; i++) {
      if (currentSessionDuration >= tiers[i].min_duration_seconds) {
        currentTier = tiers[i];
        nextTier = tiers[i + 1] || null;
      } else {
        if (!currentTier) nextTier = tiers[i];
        break;
      }
    }
    
    let progress = 0;
    if (nextTier) {
      const startSeconds = currentTier?.min_duration_seconds || 0;
      const endSeconds = nextTier.min_duration_seconds;
      const range = endSeconds - startSeconds;
      const elapsed = currentSessionDuration - startSeconds;
      progress = Math.min(100, Math.max(0, (elapsed / range) * 100));
    } else if (currentTier) {
      progress = 100;
    }
    
    return { progress, currentTier, nextTier };
  };

  const { progress, currentTier, nextTier } = getCurrentTierInfo();

  // Tier reached animation trigger
  useEffect(() => {
    if (currentTier && currentTier.id !== lastReachedTierRef.current && isPlaying) {
      lastReachedTierRef.current = currentTier.id;
      setReachedTier(currentTier);
      setShowTierReached(true);
      setTimeout(() => setShowTierReached(false), 3000);
    }
  }, [currentTier, isPlaying]);

  // Reset on stop
  useEffect(() => {
    if (!isPlaying) {
      lastReachedTierRef.current = null;
    }
  }, [isPlaying]);

  return (
    <>
      <div className="relative">
        {/* Tier Reached Celebration */}
        <AnimatePresence>
          {showTierReached && reachedTier && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              className="absolute -top-16 left-1/2 -translate-x-1/2 z-10"
            >
              <div className="bg-gradient-to-r from-accent to-primary px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <motion.div
                  animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  🎉
                </motion.div>
                <TalerIcon size={16} />
                <span className="text-sm font-bold text-white">+{reachedTier.taler_reward} Taler!</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div 
          className={cn(
            "relative overflow-hidden rounded-2xl bg-gradient-to-r from-secondary via-secondary to-secondary/90 text-secondary-foreground cursor-pointer",
            className
          )}
          onClick={() => setIsExpanded(true)}
        >
          {/* Background decoration */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* Progress Bar at top */}
          {isPlaying && tiers.length > 0 && (
            <div className="relative h-1.5 bg-white/10">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
              {/* Tier markers */}
              {tiers.map((tier) => {
                const maxDuration = tiers[tiers.length - 1].min_duration_seconds;
                const position = (tier.min_duration_seconds / maxDuration) * 100;
                const isReached = currentSessionDuration >= tier.min_duration_seconds;
                return (
                  <div
                    key={tier.id}
                    className={cn(
                      "absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full border-2 transition-colors",
                      isReached 
                        ? "bg-accent border-accent" 
                        : "bg-secondary border-white/30"
                    )}
                    style={{ left: `${position}%`, transform: 'translate(-50%, -50%)' }}
                  />
                );
              })}
            </div>
          )}

          <div className="relative flex items-center gap-4 p-4">
            {/* Artwork / Radio Icon */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "h-14 w-14 rounded-xl overflow-hidden bg-primary/20 flex items-center justify-center",
                isPlaying && "ring-2 ring-accent ring-offset-2 ring-offset-secondary"
              )}>
                {nowPlaying?.artworkUrl ? (
                  <img 
                    src={nowPlaying.artworkUrl} 
                    alt={nowPlaying.title}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Music2 className="h-6 w-6 text-secondary-foreground/70" />
                )}
              </div>
              {isPlaying && (
                <div className="absolute -top-1 -right-1 h-4 w-4 bg-accent rounded-full flex items-center justify-center">
                  <Radio className="h-2.5 w-2.5 text-accent-foreground animate-pulse" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <Radio className="h-3.5 w-3.5 text-accent flex-shrink-0" />
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">Radio 2Go Live</span>
                {isPlaying && nextTier && (
                  <div className="flex items-center gap-1 ml-auto mr-2">
                    <TalerIcon size={10} />
                    <span className="text-xs text-accent font-medium">+{nextTier.taler_reward}</span>
                  </div>
                )}
                <Expand className="h-4 w-4 text-accent" />
              </div>
              {nowPlaying ? (
                <>
                  <p className="font-bold text-sm truncate">{nowPlaying.title}</p>
                  <p className="text-xs text-secondary-foreground/70 truncate">{nowPlaying.artist}</p>
                </>
              ) : (
                <>
                  <p className="font-bold text-sm">Hör 2Go.</p>
                  <p className="text-xs text-secondary-foreground/70">Bei lokalen Partnern</p>
                </>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {isPlaying && (
                <button
                  onClick={toggleMute}
                  className="h-9 w-9 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-secondary-foreground/20 transition-colors"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </button>
              )}
              <button
                onClick={togglePlay}
                disabled={isLoading}
                className={cn(
                  "h-12 w-12 rounded-full flex items-center justify-center transition-all",
                  isPlaying 
                    ? "bg-accent text-accent-foreground hover:bg-accent/90" 
                    : "bg-secondary-foreground text-secondary hover:bg-secondary-foreground/90",
                  isLoading && "opacity-50"
                )}
              >
                {isLoading ? (
                  <div className="h-5 w-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>
            </div>
          </div>

          {/* Tiers Overview Toggle */}
          {tiers.length > 0 && (
            <div 
              className="relative border-t border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowTiersOverview(!showTiersOverview)}
                className="w-full flex items-center justify-center gap-2 py-2 hover:bg-white/5 transition-colors"
              >
                <Gift className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-medium text-white/70">
                  {showTiersOverview ? 'Tiers ausblenden' : 'Hör-Belohnungen'}
                </span>
                {showTiersOverview ? (
                  <ChevronUp className="h-3.5 w-3.5 text-white/50" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-white/50" />
                )}
              </button>

              <AnimatePresence>
                {showTiersOverview && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 space-y-2">
                      {tiers.map((tier, index) => {
                        const isReached = currentSessionDuration >= tier.min_duration_seconds;
                        const isNext = !isReached && (index === 0 || currentSessionDuration >= tiers[index - 1].min_duration_seconds);
                        return (
                          <motion.div
                            key={tier.id}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className={cn(
                              "flex items-center gap-3 p-2.5 rounded-xl transition-all",
                              isReached 
                                ? "bg-accent/20 border border-accent/30" 
                                : isNext
                                  ? "bg-white/10 border border-white/20"
                                  : "bg-white/5"
                            )}
                          >
                            <div className={cn(
                              "h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0",
                              isReached ? "bg-accent" : "bg-white/10"
                            )}>
                              {isReached ? (
                                <span className="text-sm">✓</span>
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-white/50" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-xs font-semibold",
                                isReached ? "text-accent" : "text-white/80"
                              )}>
                                {tier.name}
                              </p>
                              <p className="text-xs text-white/50">
                                {formatDuration(tier.min_duration_seconds)} hören
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <TalerIcon size={14} />
                              <span className={cn(
                                "text-sm font-bold",
                                isReached ? "text-accent" : "text-white/70"
                              )}>
                                +{tier.taler_reward}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                      <p className="text-xs text-white/40 text-center pt-1">
                        Du erhältst die Taler der höchsten erreichten Stufe.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Player Modal */}
      <ExpandedRadioPlayer isOpen={isExpanded} onClose={() => setIsExpanded(false)} />
    </>
  );
}
