import { motion, AnimatePresence } from 'framer-motion';
import { Pause } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRadioStore } from '@/lib/radio-store';
import { hapticToggle } from '@/lib/haptics';

interface MiniPlayerBarProps {
  onExpand: () => void;
}

function Equalizer({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-end gap-[2px] h-4", className)}>
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-1" />
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-2" />
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-3" />
      <div className="w-[3px] bg-accent rounded-full animate-equalizer-4" />
    </div>
  );
}

export function MiniPlayerBar({ onExpand }: MiniPlayerBarProps) {
  const { isPlaying, nowPlaying, togglePlay, isLoading } = useRadioStore();
  
  const handleTogglePlay = () => {
    hapticToggle();
    togglePlay();
  };
  
  return (
    <AnimatePresence>
      {isPlaying && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed bottom-[72px] left-0 right-0 z-40 px-3"
        >
          <div className="mx-auto max-w-lg">
            <div 
              className="flex items-center gap-3 p-2 rounded-2xl bg-secondary shadow-xl shadow-secondary/30 cursor-pointer"
              onClick={onExpand}
            >
              {/* Album Art or Equalizer */}
              <div className="h-12 w-12 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center flex-shrink-0">
                {nowPlaying?.artworkUrl ? (
                  <img 
                    src={nowPlaying.artworkUrl} 
                    alt={nowPlaying.title} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Equalizer />
                )}
              </div>
              
              {/* Song Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-secondary-foreground truncate">
                  {nowPlaying?.title || 'Radio 2Go'}
                </p>
                <p className="text-xs text-secondary-foreground/60 truncate">
                  {nowPlaying?.artist || 'Live Stream'}
                </p>
              </div>
              
              {/* Play/Pause Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleTogglePlay();
                }}
                disabled={isLoading}
                className={cn(
                  "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all",
                  "bg-accent text-accent-foreground"
                )}
                aria-label={isPlaying ? 'Pause' : 'Abspielen'}
              >
                {isLoading ? (
                  <div className="h-4 w-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <Pause className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
