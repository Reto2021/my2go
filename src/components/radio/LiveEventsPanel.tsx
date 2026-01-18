import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Radio, 
  Tv, 
  Users, 
  ChevronRight, 
  X,
  Volume2,
  ArrowLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLiveEventsStore, LiveEvent, EVENT_TYPES } from '@/lib/live-events-store';
import { useRadioStore } from '@/lib/radio-store';
import { Slider } from '@/components/ui/slider';

// Green pulsing live indicator
export const LiveIndicator = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };
  
  return (
    <span className="relative flex items-center">
      <span className={cn(
        "rounded-full bg-green-500",
        sizeClasses[size]
      )} />
      <span className={cn(
        "absolute rounded-full bg-green-500 animate-ping opacity-75",
        sizeClasses[size]
      )} />
    </span>
  );
};

// Live event card for the list
interface LiveEventCardProps {
  event: LiveEvent;
  isActive: boolean;
  onJoin: () => void;
}

export const LiveEventCard = ({ event, isActive, onJoin }: LiveEventCardProps) => {
  // Fallback to 'other' type if event type is not recognized
  const typeInfo = EVENT_TYPES[event.type] || EVENT_TYPES['other'];
  
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onJoin}
      className={cn(
        "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
        "border-2",
        isActive
          ? "bg-primary/10 border-primary"
          : "bg-card border-transparent hover:border-muted"
      )}
    >
      {/* Thumbnail or emoji placeholder */}
      <div className={cn(
        "h-14 w-14 rounded-lg flex items-center justify-center flex-shrink-0",
        "bg-gradient-to-br",
        typeInfo.color
      )}>
        {event.thumbnailUrl ? (
          <img 
            src={event.thumbnailUrl} 
            alt={event.title}
            className="h-full w-full object-cover rounded-lg"
          />
        ) : (
          <span className="text-2xl">{typeInfo.emoji}</span>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{event.title}</span>
          {event.isLive && <LiveIndicator size="sm" />}
        </div>
        <div className="text-sm text-muted-foreground truncate">
          {event.hostName}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <Users className="h-3 w-3" />
          <span>{event.viewerCount.toLocaleString()}</span>
          <span className="px-1.5 py-0.5 bg-muted rounded text-[10px]">
            {typeInfo.label}
          </span>
        </div>
      </div>
      
      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
    </motion.button>
  );
};

// Live events badge on radio player (shows when events are available)
interface LiveEventsBadgeProps {
  onClick: () => void;
  eventCount: number;
  hasLiveEvents: boolean;
}

export const LiveEventsBadge = ({ onClick, eventCount, hasLiveEvents }: LiveEventsBadgeProps) => {
  // Always show badge, but with different styles based on live status
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-full transition-all",
        hasLiveEvents
          ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/20"
          : "bg-muted text-muted-foreground border border-border"
      )}
    >
      {hasLiveEvents ? (
        <>
          <LiveIndicator size="sm" />
          <Tv className="h-3.5 w-3.5" />
          <span className="text-xs font-medium">{eventCount} Live</span>
        </>
      ) : (
        <>
          <Tv className="h-3.5 w-3.5" />
          <span className="text-xs">Live</span>
        </>
      )}
    </motion.button>
  );
};

// Compact header button for homepage
interface LiveHeaderButtonProps {
  onClick: () => void;
  hasLiveEvents: boolean;
}

export const LiveHeaderButton = ({ onClick, hasLiveEvents }: LiveHeaderButtonProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all",
        hasLiveEvents 
          ? "bg-red-500/20 border-2 border-red-500 text-red-500 shadow-[0_0_12px_2px_rgba(239,68,68,0.5)] animate-pulse" 
          : "bg-transparent text-white/70 hover:text-white"
      )}
    >
      <Tv className="h-3.5 w-3.5" />
      <span>Live</span>
      {hasLiveEvents && (
        <span className="relative flex h-2 w-2 ml-0.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
        </span>
      )}
    </button>
  );
};

// Full live events panel
interface LiveEventsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LiveEventsPanel = ({ isOpen, onClose }: LiveEventsPanelProps) => {
  const { 
    events, 
    currentEvent, 
    isEventPlaying,
    fetchEvents, 
    isLoadingEvents,
    crossfadeToEvent,
    crossfadeToRadio,
    eventVolume,
    setEventVolume
  } = useLiveEventsStore();
  
  const { isPlaying: isRadioPlaying, setVolume: setRadioVolume } = useRadioStore();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Fetch events on mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);
  
  // Handle event audio playback
  useEffect(() => {
    if (audioRef.current && currentEvent) {
      audioRef.current.src = currentEvent.streamUrl;
      audioRef.current.volume = eventVolume;
      
      if (isEventPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [currentEvent, isEventPlaying]);
  
  // Update volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = eventVolume;
    }
  }, [eventVolume]);
  
  // Reset fullscreen when closing
  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
    }
  }, [isOpen]);
  
  const handleJoinEvent = (eventId: string) => {
    crossfadeToEvent(eventId);
  };
  
  const handleBackToRadio = () => {
    crossfadeToRadio();
  };
  
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };
  
  const liveEvents = events.filter(e => e.isLive);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn(
              "fixed bg-background z-50 overflow-hidden transition-all duration-300",
              isFullscreen 
                ? "inset-0 rounded-none max-h-full" 
                : "bottom-0 left-0 right-0 rounded-t-2xl max-h-[80vh]"
            )}
          >
            {/* Hidden audio element for event playback */}
            <audio ref={audioRef} />
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                {isEventPlaying ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBackToRadio}
                    className="h-8 w-8"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <Tv className="h-5 w-5 text-white" />
                  </div>
                )}
                <div>
                  <h2 className="font-semibold">
                    {isEventPlaying ? currentEvent?.title : 'Live Events'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {isEventPlaying 
                      ? currentEvent?.hostName 
                      : `${liveEvents.length} Übertragungen gerade live`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isEventPlaying && (
                  <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
                    {isFullscreen ? (
                      <Minimize2 className="h-5 w-5" />
                    ) : (
                      <Maximize2 className="h-5 w-5" />
                    )}
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Content */}
            <div className={cn(
              "overflow-y-auto p-4",
              isFullscreen ? "max-h-[calc(100vh-80px)]" : "max-h-[60vh]"
            )}>
              {isEventPlaying && currentEvent ? (
                // Event player view
                <div className="space-y-4">
                  {/* Event thumbnail/visual */}
                  {(() => {
                    const eventTypeInfo = EVENT_TYPES[currentEvent.type] || EVENT_TYPES['other'];
                    return (
                      <div className={cn(
                        "aspect-video rounded-xl flex items-center justify-center",
                        "bg-gradient-to-br",
                        eventTypeInfo.color
                      )}>
                        <div className="text-center text-white">
                          <span className="text-6xl">{eventTypeInfo.emoji}</span>
                          <div className="mt-2 flex items-center justify-center gap-2">
                            <LiveIndicator size="md" />
                            <span className="text-sm font-medium">Live</span>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  {/* Volume control */}
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                    <Volume2 className="h-5 w-5 text-muted-foreground" />
                    <Slider
                      value={[eventVolume * 100]}
                      onValueChange={([val]) => setEventVolume(val / 100)}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground w-12 text-right">
                      {Math.round(eventVolume * 100)}%
                    </span>
                  </div>
                  
                  {/* Event description */}
                  <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="text-sm">{currentEvent.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{currentEvent.viewerCount.toLocaleString()} schauen zu</span>
                    </div>
                  </div>
                  
                  {/* Back to radio button */}
                  <Button 
                    onClick={handleBackToRadio}
                    variant="outline"
                    className="w-full gap-2"
                  >
                    <Radio className="h-4 w-4" />
                    Zurück zu Radio 2Go
                  </Button>
                </div>
              ) : (
                // Events list
                <div className="space-y-3">
                  {isLoadingEvents ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
                    </div>
                  ) : liveEvents.length > 0 ? (
                    liveEvents.map(event => (
                      <LiveEventCard
                        key={event.id}
                        event={event}
                        isActive={currentEvent?.id === event.id}
                        onJoin={() => handleJoinEvent(event.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Tv className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
                      <p className="text-muted-foreground">
                        Keine Live Events gerade
                      </p>
                      <p className="text-sm text-muted-foreground/70 mt-1">
                        Schau später wieder vorbei!
                      </p>
                    </div>
                  )}
                  
                  {/* Radio 2Go option (always visible) */}
                  <div className="pt-3 border-t mt-4">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                      <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Radio className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">Radio 2Go</span>
                        <div className="text-xs text-muted-foreground">
                          Dein Community Radio läuft immer
                        </div>
                      </div>
                      {isRadioPlaying && <LiveIndicator size="md" />}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default LiveEventsPanel;
