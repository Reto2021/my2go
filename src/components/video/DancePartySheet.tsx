import { useState, useRef, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Users,
  Sparkles,
  Music
} from 'lucide-react';
import { useLiveKitRoom, Participant, REACTION_EMOJIS } from '@/hooks/useLiveKitRoom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  VideoTrack, 
  AudioTrack,
  useParticipants,
  useTracks,
  useLocalParticipant
} from '@livekit/components-react';
import { Track, Room } from 'livekit-client';

interface DancePartySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songIdentifier: string;
  songTitle?: string;
}

// Floating reaction animation
const FloatingReaction = ({ emoji, onComplete }: { emoji: string; onComplete: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const randomX = Math.random() * 100;
  
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: `${randomX}%`, scale: 0.5 }}
      animate={{ 
        opacity: [1, 1, 0], 
        y: -300, 
        scale: [0.5, 1.5, 1],
        rotate: [0, 10, -10, 0]
      }}
      transition={{ duration: 3, ease: "easeOut" }}
      className="absolute bottom-20 text-4xl pointer-events-none z-50"
      style={{ left: `${randomX}%` }}
    >
      {emoji}
    </motion.div>
  );
};

// Video tile using LiveKit components
const LiveKitVideoTile = ({ 
  participant, 
  isLocal,
  room
}: { 
  participant: Participant;
  isLocal: boolean;
  room: Room | null;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!room || !videoRef.current) return;

    const lkParticipant = isLocal 
      ? room.localParticipant 
      : room.remoteParticipants.get(participant.identity);

    if (!lkParticipant) return;

    // Attach video track
    const videoTrack = lkParticipant.getTrackPublication(Track.Source.Camera)?.track;
    if (videoTrack && videoRef.current) {
      videoTrack.attach(videoRef.current);
    }

    // Attach audio track (only for remote participants)
    if (!isLocal) {
      const audioTrack = lkParticipant.getTrackPublication(Track.Source.Microphone)?.track;
      if (audioTrack && audioRef.current) {
        audioTrack.attach(audioRef.current);
      }
    }

    return () => {
      if (videoTrack) {
        videoTrack.detach();
      }
      if (!isLocal) {
        const audioTrack = lkParticipant.getTrackPublication(Track.Source.Microphone)?.track;
        if (audioTrack) {
          audioTrack.detach();
        }
      }
    };
  }, [room, participant.identity, isLocal]);

  const initials = participant.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "relative rounded-xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20",
        "aspect-[3/4] flex items-center justify-center",
        isLocal && "ring-2 ring-primary",
        participant.isSpeaking && "ring-2 ring-green-500 ring-offset-2"
      )}
    >
      {participant.isVideoOff ? (
        <div className="flex flex-col items-center gap-2">
          <Avatar className="h-16 w-16">
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
          muted={isLocal}
          className="w-full h-full object-cover mirror"
          style={{ transform: isLocal ? 'scaleX(-1)' : 'none' }}
        />
      )}

      {/* Audio element for remote participants */}
      {!isLocal && <audio ref={audioRef} autoPlay />}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full truncate max-w-[70%]">
          {isLocal ? 'Du' : participant.name}
        </span>
        <div className="flex items-center gap-1">
          {participant.isSpeaking && (
            <span className="bg-green-500/80 p-1 rounded-full animate-pulse">
              <div className="h-2 w-2 bg-white rounded-full" />
            </span>
          )}
          {participant.isMuted && (
            <span className="bg-red-500/80 p-1 rounded-full">
              <MicOff className="h-3 w-3 text-white" />
            </span>
          )}
        </div>
      </div>

      {/* Dancing animation overlay */}
      {!participant.isVideoOff && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(255,100,100,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(100,100,255,0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(255,100,100,0.1) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
};

// Reaction bar
const ReactionBar = ({ onReaction }: { onReaction: (emoji: string) => void }) => {
  return (
    <motion.div 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="flex items-center justify-center gap-2 py-2"
    >
      {REACTION_EMOJIS.map((emoji) => (
        <motion.button
          key={emoji}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onReaction(emoji)}
          className="text-2xl p-2 rounded-full hover:bg-muted/50 transition-colors"
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
};

export const DancePartySheet = ({ 
  open, 
  onOpenChange, 
  songIdentifier,
  songTitle
}: DancePartySheetProps) => {
  const { user } = useAuth();
  const {
    isConnected,
    isConnecting,
    participants,
    localParticipant,
    error,
    room,
    connect,
    disconnect,
    toggleMute,
    toggleVideo,
    sendReaction,
    reactions,
    isMuted,
    isVideoOff
  } = useLiveKitRoom();

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // Create room name from song
  const roomName = `dance-${songIdentifier.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}`;

  // Get local stream for preview
  useEffect(() => {
    if (open && !isConnected && !isConnecting) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(setLocalStream)
        .catch((err) => {
          console.error('Media access error:', err);
        });
    }

    return () => {
      if (localStream && !isConnected) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, isConnected, isConnecting]);

  const handleJoin = async () => {
    // Stop preview stream before connecting
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    await connect(roomName);
  };

  const handleLeave = () => {
    disconnect();
  };

  const handleClose = () => {
    if (isConnected) {
      handleLeave();
    }
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    onOpenChange(false);
  };

  const totalParticipants = (isConnected ? 1 : 0) + participants.length;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-3xl bg-gradient-to-b from-background to-background/95"
      >
        <SheetHeader className="text-center pb-4">
          <SheetTitle className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            Dance Party
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </SheetTitle>
          {songTitle && (
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
              <Music className="h-3 w-3" />
              {songTitle}
            </p>
          )}
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-5rem)] relative">
          {/* Floating Reactions */}
          <AnimatePresence>
            {reactions.map((reaction) => (
              <FloatingReaction
                key={reaction.id}
                emoji={reaction.emoji}
                onComplete={() => {}}
              />
            ))}
          </AnimatePresence>

          {/* Participant count */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {isConnected 
                ? `${totalParticipants} ${totalParticipants === 1 ? 'Tänzer' : 'Tänzer'} im Raum`
                : 'Bereit zum Tanzen?'
              }
            </span>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg mb-4 text-center">
              {error}
            </div>
          )}

          {/* Video grid */}
          <div className="flex-1 overflow-auto">
            {!isConnected && !isConnecting ? (
              // Preview before joining
              <div className="flex flex-col items-center justify-center h-full gap-6">
                <div className="relative w-48 aspect-[3/4] rounded-xl overflow-hidden bg-muted">
                  {localStream ? (
                    <video
                      autoPlay
                      playsInline
                      muted
                      ref={(el) => {
                        if (el) el.srcObject = localStream;
                      }}
                      className="w-full h-full object-cover"
                      style={{ transform: 'scaleX(-1)' }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Video className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                <div className="text-center space-y-2">
                  <h3 className="font-semibold">Bereit für die Dance Party?</h3>
                  <p className="text-sm text-muted-foreground">
                    Tanz gemeinsam mit anderen zur Musik!
                  </p>
                </div>

                <Button 
                  onClick={handleJoin}
                  size="lg"
                  className="gap-2"
                  disabled={!user}
                >
                  <Sparkles className="h-4 w-4" />
                  {user ? 'Party beitreten' : 'Bitte einloggen'}
                </Button>
              </div>
            ) : isConnecting ? (
              // Connecting state
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
                />
                <p className="text-muted-foreground">Verbinde zur Party...</p>
              </div>
            ) : (
              // Connected - show video grid
              <div className="grid grid-cols-2 gap-3 p-2">
                <AnimatePresence>
                  {/* Local participant */}
                  {localParticipant && (
                    <LiveKitVideoTile
                      key="local"
                      participant={{
                        ...localParticipant,
                        isMuted,
                        isVideoOff
                      }}
                      isLocal
                      room={room}
                    />
                  )}

                  {/* Remote participants */}
                  {participants.map((p) => (
                    <LiveKitVideoTile
                      key={p.identity}
                      participant={p}
                      isLocal={false}
                      room={room}
                    />
                  ))}
                </AnimatePresence>

                {/* Empty slots hint */}
                {participants.length === 0 && (
                  <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                    <div className="text-center text-muted-foreground text-sm p-4">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      Warte auf andere Tänzer...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Reactions Bar */}
          {isConnected && (
            <ReactionBar onReaction={sendReaction} />
          )}

          {/* Controls */}
          {isConnected && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-center gap-4 py-4 border-t"
            >
              <Button
                variant={isMuted ? "destructive" : "secondary"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>

              <Button
                variant={isVideoOff ? "destructive" : "secondary"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="h-14 w-14 rounded-full"
                onClick={handleLeave}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
