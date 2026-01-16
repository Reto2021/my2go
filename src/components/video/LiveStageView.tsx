import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Crown, 
  Eye, 
  MessageCircle, 
  Heart,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Participant } from '@/hooks/useLiveKitRoom';
import { Room, Track } from 'livekit-client';
import { 
  LiveChat, 
  QuickReactions, 
  SpectatorCount,
  ChatMessage,
  StageRole
} from './DancePartyModes';

interface LiveStageViewProps {
  hosts: Participant[];
  spectatorCount: number;
  localRole: StageRole;
  localParticipant: Participant | null;
  room: Room | null;
  chatMessages: ChatMessage[];
  onSendMessage: (message: string) => void;
  onSendReaction: (emoji: string) => void;
  onLeave: () => void;
  songTitle?: string;
}

// Host video tile with spotlight effect
const HostTile = ({ 
  participant, 
  room, 
  isMainHost,
  index
}: { 
  participant: Participant; 
  room: Room | null;
  isMainHost: boolean;
  index: number;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    if (!room || !videoRef.current) return;
    
    const remoteP = room.remoteParticipants.get(participant.identity);
    if (!remoteP) return;
    
    const videoTrack = remoteP.getTrackPublication(Track.Source.Camera)?.track;
    if (videoTrack) {
      videoTrack.attach(videoRef.current);
    }
    
    const audioTrack = remoteP.getTrackPublication(Track.Source.Microphone)?.track;
    if (audioTrack && audioRef.current) {
      audioTrack.attach(audioRef.current);
    }
    
    return () => {
      if (videoTrack) videoTrack.detach();
      if (audioTrack) audioTrack.detach();
    };
  }, [room, participant.identity]);
  
  const initials = participant.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        isMainHost ? "col-span-2 row-span-2" : "aspect-[3/4]",
        participant.isSpeaking && "ring-2 ring-green-500 ring-offset-2"
      )}
    >
      {/* Spotlight effect for main host */}
      {isMainHost && (
        <div className="absolute inset-0 bg-gradient-radial from-primary/20 via-transparent to-transparent pointer-events-none z-10" />
      )}
      
      {participant.isVideoOff ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
          <Avatar className={cn("mb-2", isMainHost ? "h-20 w-20" : "h-12 w-12")}>
            <AvatarFallback className="bg-primary/30 text-primary text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{participant.name}</span>
        </div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />
      )}
      
      <audio ref={audioRef} autoPlay />
      
      {/* Host badge */}
      <div className="absolute top-2 left-2 flex items-center gap-1 bg-yellow-500/90 text-yellow-900 px-2 py-1 rounded-full text-xs font-medium z-20">
        <Crown className="h-3 w-3" />
        Host
      </div>
      
      {/* Name badge */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-20">
        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full truncate max-w-[70%]">
          {participant.name}
        </span>
        {participant.isSpeaking && (
          <span className="bg-green-500/80 p-1 rounded-full animate-pulse">
            <div className="h-2 w-2 bg-white rounded-full" />
          </span>
        )}
      </div>
    </motion.div>
  );
};

// Floating reactions animation
const FloatingReaction = ({ emoji }: { emoji: string }) => {
  const randomX = Math.random() * 60 + 20; // 20-80%
  
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: `${randomX}%`, scale: 0.5 }}
      animate={{ 
        opacity: [1, 1, 0], 
        y: -200, 
        scale: [0.5, 1.5, 1]
      }}
      transition={{ duration: 2.5, ease: "easeOut" }}
      className="absolute bottom-20 text-3xl pointer-events-none"
      style={{ left: `${randomX}%` }}
    >
      {emoji}
    </motion.div>
  );
};

export const LiveStageView = ({
  hosts,
  spectatorCount,
  localRole,
  localParticipant,
  room,
  chatMessages,
  onSendMessage,
  onSendReaction,
  onLeave,
  songTitle
}: LiveStageViewProps) => {
  const [showChat, setShowChat] = useState(true);
  const [floatingReactions, setFloatingReactions] = useState<{ id: string; emoji: string }[]>([]);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  
  // Handle local host video
  useEffect(() => {
    if (localRole !== 'host' || !room || !localVideoRef.current) return;
    
    const localTrack = room.localParticipant.getTrackPublication(Track.Source.Camera)?.track;
    if (localTrack) {
      localTrack.attach(localVideoRef.current);
    }
    
    return () => {
      if (localTrack) localTrack.detach();
    };
  }, [room, localRole]);
  
  // Handle reaction animation
  const handleReaction = (emoji: string) => {
    onSendReaction(emoji);
    
    // Add floating reaction
    const id = `${Date.now()}-${Math.random()}`;
    setFloatingReactions(prev => [...prev, { id, emoji }]);
    
    // Remove after animation
    setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== id));
    }, 2500);
  };
  
  // Calculate grid layout based on host count
  const getGridClass = () => {
    const totalHosts = hosts.length + (localRole === 'host' ? 1 : 0);
    if (totalHosts === 1) return "grid-cols-1";
    if (totalHosts === 2) return "grid-cols-2";
    if (totalHosts === 3) return "grid-cols-2"; // 1 big + 2 small
    return "grid-cols-2";
  };
  
  return (
    <div className="flex flex-col h-full relative">
      {/* Floating reactions */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
        <AnimatePresence>
          {floatingReactions.map(({ id, emoji }) => (
            <FloatingReaction key={id} emoji={emoji} />
          ))}
        </AnimatePresence>
      </div>
      
      {/* Header with spectator count */}
      <div className="flex items-center justify-between p-2">
        <div className="flex items-center gap-2">
          <SpectatorCount count={spectatorCount} />
          {songTitle && (
            <span className="text-xs text-muted-foreground">
              🎵 {songTitle}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onLeave}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Stage area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Hosts grid */}
        <div className={cn(
          "flex-1 grid gap-2 p-2",
          getGridClass()
        )}>
          {/* Local host (if applicable) */}
          {localRole === 'host' && localParticipant && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "relative rounded-xl overflow-hidden",
                hosts.length === 0 ? "col-span-2 row-span-2" : "aspect-[3/4]",
                "ring-2 ring-primary"
              )}
            >
              {localParticipant.isVideoOff ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20">
                  <Avatar className="h-20 w-20 mb-2">
                    <AvatarFallback className="bg-primary/30 text-primary text-xl">
                      Du
                    </AvatarFallback>
                  </Avatar>
                </div>
              ) : (
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ transform: 'scaleX(-1)' }}
                />
              )}
              
              {/* Your host badge */}
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium z-20">
                <Crown className="h-3 w-3" />
                Du (Host)
              </div>
            </motion.div>
          )}
          
          {/* Remote hosts */}
          <AnimatePresence>
            {hosts.map((host, index) => (
              <HostTile
                key={host.identity}
                participant={host}
                room={room}
                isMainHost={localRole === 'spectator' && index === 0 && hosts.length === 1}
                index={index}
              />
            ))}
          </AnimatePresence>
          
          {/* Empty state for spectators */}
          {localRole === 'spectator' && hosts.length === 0 && (
            <div className="col-span-2 flex items-center justify-center text-center">
              <div className="text-muted-foreground">
                <Crown className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Warte auf Hosts...</p>
                <p className="text-sm">Die Show beginnt bald!</p>
              </div>
            </div>
          )}
        </div>
        
        {/* Spectator controls */}
        {localRole === 'spectator' && (
          <div className="border-t">
            {/* Quick reactions */}
            <QuickReactions onReaction={handleReaction} />
            
            {/* Chat toggle */}
            <div className="flex items-center justify-center pb-2">
              <Button
                variant={showChat ? "default" : "outline"}
                size="sm"
                onClick={() => setShowChat(!showChat)}
                className="gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                {showChat ? 'Chat ausblenden' : 'Chat anzeigen'}
              </Button>
            </div>
            
            {/* Chat area */}
            <AnimatePresence>
              {showChat && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t overflow-hidden"
                >
                  <LiveChat 
                    messages={chatMessages} 
                    onSendMessage={onSendMessage}
                    isSpectator={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
        
        {/* Host controls (simplified, main controls are in parent) */}
        {localRole === 'host' && (
          <div className="border-t p-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Eye className="h-4 w-4" />
              <span>{spectatorCount} Zuschauer</span>
              <Heart className="h-4 w-4 text-red-500" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveStageView;
