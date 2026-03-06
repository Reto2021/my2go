import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, SparklesIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isAISoundEnabled, setAISoundEnabled, getCurrentPreset } from '@/lib/audio-processor';
import { useRadioStore } from '@/lib/radio-store';
import { hapticToggle } from '@/lib/haptics';

interface AISoundToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function AISoundToggle({ className, size = 'md' }: AISoundToggleProps) {
  const [enabled, setEnabled] = useState(isAISoundEnabled);
  const [preset, setPreset] = useState(getCurrentPreset());

  // Poll for preset changes (lightweight)
  useEffect(() => {
    const interval = setInterval(() => {
      setPreset(getCurrentPreset());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const toggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticToggle();
    const next = !enabled;
    setEnabled(next);
    setAISoundEnabled(next);

    // If WebAudio captured the element, force a clean audio element on disable
    // so mobile output returns reliably.
    if (!next) {
      useRadioStore.getState().rebuildAudioAfterAISoundToggle();
    }
  };

  const isSmall = size === 'sm';

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "relative flex items-center gap-1.5 rounded-full transition-all touch-manipulation",
        isSmall ? "h-8 px-2.5" : "h-10 px-3",
        enabled
          ? "bg-gradient-to-r from-violet-500/30 to-fuchsia-500/30 border border-violet-400/50 text-violet-200"
          : "bg-white/10 border border-white/20 text-white/60",
        className
      )}
      aria-label={enabled ? "AI Sound aus" : "AI Sound an"}
      title={enabled && preset ? `AI Sound: ${preset.label} – ${preset.description}` : "AI Sound Processing"}
    >
      <motion.div
        animate={enabled ? { rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] } : { rotate: 0, scale: 1 }}
        transition={enabled ? { duration: 0.6, ease: 'easeInOut' } : { duration: 0.2 }}
      >
        <Sparkles className={cn(
          "transition-colors",
          isSmall ? "h-3.5 w-3.5" : "h-4 w-4",
          enabled ? "text-violet-300" : "text-white/50"
        )} />
      </motion.div>

      <span className={cn(
        "font-semibold whitespace-nowrap",
        isSmall ? "text-[10px]" : "text-xs",
      )}>
        AI
      </span>

      {/* Active indicator dot */}
      {enabled && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50"
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-violet-400"
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      )}

      {/* Preset label tooltip */}
      <AnimatePresence>
        {enabled && preset && (
          <motion.span
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -5 }}
            className={cn(
              "text-violet-300/80 truncate max-w-[60px]",
              isSmall ? "text-[9px]" : "text-[10px]",
            )}
          >
            {preset.label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
