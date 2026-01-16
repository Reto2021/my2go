import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic2, Music2, X, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLyricsStore, LyricLine } from '@/lib/lyrics-store';
import { cn } from '@/lib/utils';

interface KaraokeDisplayProps {
  isActive: boolean;
  onToggle: () => void;
  songTitle?: string;
  songArtist?: string;
  className?: string;
}

// Single lyric line with progress highlight
const LyricLineDisplay = ({ 
  line, 
  isActive, 
  isPast, 
  isFuture,
  progress = 0 // 0-1 for current line
}: { 
  line: LyricLine; 
  isActive: boolean; 
  isPast: boolean;
  isFuture: boolean;
  progress?: number;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isActive ? 1 : isPast ? 0.4 : 0.6,
        y: 0,
        scale: isActive ? 1.1 : 1
      }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "text-center px-4 py-2 transition-all duration-300",
        isActive && "text-white font-bold",
        isPast && "text-muted-foreground/50",
        isFuture && "text-muted-foreground/70"
      )}
    >
      <div className="relative inline-block">
        {/* Background text */}
        <span className={cn(
          "text-lg md:text-xl transition-all",
          isActive && "text-2xl md:text-3xl"
        )}>
          {line.text}
        </span>
        
        {/* Highlighted overlay for active line */}
        {isActive && (
          <span 
            className="absolute left-0 top-0 text-primary overflow-hidden whitespace-nowrap text-2xl md:text-3xl font-bold"
            style={{ 
              width: `${progress * 100}%`,
              backgroundImage: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--chart-1)))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            {line.text}
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Compact karaoke button for toolbar
export const KaraokeButton = ({ 
  isActive, 
  onToggle,
  hasLyrics 
}: { 
  isActive: boolean; 
  onToggle: () => void;
  hasLyrics: boolean;
}) => (
  <Button
    variant={isActive ? "default" : "outline"}
    size="sm"
    onClick={onToggle}
    className={cn(
      "gap-2",
      isActive && "bg-gradient-to-r from-pink-500 to-violet-500 border-none"
    )}
  >
    <Mic2 className="h-4 w-4" />
    <span className="hidden sm:inline">Karaoke</span>
    {hasLyrics && !isActive && (
      <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
    )}
  </Button>
);

// Main karaoke display component
export const KaraokeDisplay = ({
  isActive,
  onToggle,
  songTitle,
  songArtist,
  className
}: KaraokeDisplayProps) => {
  const { 
    currentLyrics, 
    isLoading, 
    error,
    currentLineIndex,
    fetchLyrics,
    setCurrentPosition,
    clearLyrics
  } = useLyricsStore();
  
  const [isExpanded, setIsExpanded] = useState(true);
  const [simulatedTime, setSimulatedTime] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Fetch lyrics when activated
  useEffect(() => {
    if (isActive && songTitle && songArtist) {
      fetchLyrics(songTitle, songArtist);
    }
    
    return () => {
      if (!isActive) {
        clearLyrics();
      }
    };
  }, [isActive, songTitle, songArtist, fetchLyrics, clearLyrics]);
  
  // Simulate time progression for demo (in production, sync with actual audio)
  useEffect(() => {
    if (!isActive || !currentLyrics) return;
    
    const interval = setInterval(() => {
      setSimulatedTime(prev => {
        const next = prev + 0.1;
        setCurrentPosition(next);
        // Loop back to start
        if (next > currentLyrics.duration) {
          return 0;
        }
        return next;
      });
    }, 100);
    
    return () => clearInterval(interval);
  }, [isActive, currentLyrics, setCurrentPosition]);
  
  // Auto-scroll to current line
  useEffect(() => {
    if (containerRef.current && currentLineIndex >= 0) {
      const container = containerRef.current;
      const activeElement = container.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLineIndex]);
  
  if (!isActive) return null;
  
  // Calculate progress within current line
  const getCurrentLineProgress = () => {
    if (!currentLyrics || currentLineIndex < 0) return 0;
    const line = currentLyrics.lines[currentLineIndex];
    if (!line) return 0;
    const lineDuration = line.endTime - line.startTime;
    const lineProgress = (simulatedTime - line.startTime) / lineDuration;
    return Math.min(Math.max(lineProgress, 0), 1);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className={cn(
        "fixed bottom-20 left-0 right-0 z-40",
        "bg-gradient-to-t from-black/90 via-black/70 to-transparent",
        "pointer-events-auto",
        className
      )}
    >
      {/* Toggle expand/collapse */}
      <div className="flex justify-center py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-white/70 hover:text-white"
        >
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="text-white/70 hover:text-white ml-2"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {/* Header */}
            <div className="text-center pb-2">
              <div className="flex items-center justify-center gap-2 text-primary">
                <Mic2 className="h-4 w-4" />
                <span className="text-sm font-medium">Karaoke Modus</span>
              </div>
              {songTitle && songArtist && (
                <p className="text-xs text-muted-foreground mt-1">
                  {songArtist} - {songTitle}
                </p>
              )}
            </div>
            
            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                <p className="text-sm text-muted-foreground">Lade Lyrics...</p>
              </div>
            )}
            
            {/* Error/info message */}
            {error && !isLoading && (
              <div className="text-center py-2">
                <p className="text-xs text-amber-400/80">{error}</p>
              </div>
            )}
            
            {/* Lyrics display */}
            {currentLyrics && !isLoading && (
              <div 
                ref={containerRef}
                className="max-h-48 overflow-hidden relative"
              >
                {/* Gradient overlays */}
                <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />
                
                {/* Scrolling lyrics */}
                <div className="py-8 space-y-1">
                  {currentLyrics.lines.map((line, index) => (
                    <div key={index} data-active={index === currentLineIndex}>
                      <LyricLineDisplay
                        line={line}
                        isActive={index === currentLineIndex}
                        isPast={index < currentLineIndex}
                        isFuture={index > currentLineIndex}
                        progress={index === currentLineIndex ? getCurrentLineProgress() : 0}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* No lyrics placeholder */}
            {!currentLyrics && !isLoading && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Music2 className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">
                  Keine Lyrics verfügbar
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Starte einen Song um Lyrics zu laden
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Minimal overlay version for dance party
export const KaraokeOverlay = ({
  isActive,
  className
}: {
  isActive: boolean;
  className?: string;
}) => {
  const { currentLyrics, currentLineIndex } = useLyricsStore();
  
  if (!isActive || !currentLyrics) return null;
  
  const currentLine = currentLyrics.lines[currentLineIndex];
  const nextLine = currentLyrics.lines[currentLineIndex + 1];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "absolute bottom-24 left-0 right-0 z-30",
        "text-center pointer-events-none",
        className
      )}
    >
      {/* Current line */}
      {currentLine && (
        <motion.div
          key={currentLineIndex}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="px-4"
        >
          <p 
            className="text-xl md:text-2xl font-bold text-white drop-shadow-lg"
            style={{
              textShadow: '0 0 20px rgba(var(--primary), 0.5), 0 2px 4px rgba(0,0,0,0.5)'
            }}
          >
            {currentLine.text}
          </p>
        </motion.div>
      )}
      
      {/* Next line preview */}
      {nextLine && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          className="text-sm md:text-base text-white/60 mt-2 drop-shadow"
        >
          {nextLine.text}
        </motion.p>
      )}
    </motion.div>
  );
};
