import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { AUDIO_EFFECTS, AudioEffectType } from '@/lib/audio-effects';
import { Button } from '@/components/ui/button';

interface AudioEffectsPanelProps {
  currentEffect: AudioEffectType;
  onEffectChange: (effect: AudioEffectType) => void;
  isDisabled?: boolean;
  isCompact?: boolean;
}

export const AudioEffectsPanel = ({
  currentEffect,
  onEffectChange,
  isDisabled = false,
  isCompact = false
}: AudioEffectsPanelProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const currentEffectInfo = AUDIO_EFFECTS.find(e => e.id === currentEffect) || AUDIO_EFFECTS[0];
  
  if (isCompact) {
    return (
      <div className="relative">
        {/* Compact toggle button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          disabled={isDisabled}
          className={cn(
            "gap-2 transition-colors",
            currentEffect !== 'none' && "bg-primary/10 border-primary"
          )}
        >
          <span className="text-lg">{currentEffectInfo.emoji}</span>
          <span className="hidden sm:inline">{currentEffectInfo.name}</span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        {/* Dropdown */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute bottom-full mb-2 left-0 right-0 min-w-[200px] bg-popover border rounded-lg shadow-lg overflow-hidden z-50"
            >
              <div className="p-2 border-b bg-muted/30">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Audio-Effekte
                </div>
              </div>
              <div className="p-1 max-h-[300px] overflow-y-auto">
                {AUDIO_EFFECTS.map((effect) => (
                  <motion.button
                    key={effect.id}
                    whileHover={{ backgroundColor: 'hsl(var(--muted) / 0.5)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      onEffectChange(effect.id);
                      setIsExpanded(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left",
                      currentEffect === effect.id && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="text-xl">{effect.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{effect.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {effect.description}
                      </div>
                    </div>
                    {currentEffect === effect.id && (
                      <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  
  // Full panel view
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Sparkles className="h-4 w-4 text-primary" />
        Audio-Effekte
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        {AUDIO_EFFECTS.map((effect) => {
          const isActive = currentEffect === effect.id;
          
          return (
            <motion.button
              key={effect.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEffectChange(effect.id)}
              disabled={isDisabled}
              className={cn(
                "flex flex-col items-center gap-1 p-2 rounded-xl transition-all",
                "border-2",
                isActive
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-muted/30 border-transparent hover:border-muted-foreground/20",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <span className="text-2xl">{effect.emoji}</span>
              <span className="text-xs font-medium">{effect.name}</span>
              {isActive && (
                <motion.div
                  layoutId="audio-effect-indicator"
                  className="h-1 w-4 bg-primary rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// Quick effect selector for inline use
interface QuickEffectSelectorProps {
  currentEffect: AudioEffectType;
  onEffectChange: (effect: AudioEffectType) => void;
}

export const QuickEffectSelector = ({ currentEffect, onEffectChange }: QuickEffectSelectorProps) => {
  return (
    <div className="flex items-center gap-1 p-1 bg-black/30 rounded-full backdrop-blur-sm">
      {AUDIO_EFFECTS.slice(0, 4).map((effect) => (
        <motion.button
          key={effect.id}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onEffectChange(effect.id)}
          className={cn(
            "p-1.5 rounded-full transition-colors",
            currentEffect === effect.id 
              ? "bg-primary text-primary-foreground" 
              : "hover:bg-white/20"
          )}
          title={effect.name}
        >
          <span className="text-sm">{effect.emoji}</span>
        </motion.button>
      ))}
    </div>
  );
};

export default AudioEffectsPanel;
