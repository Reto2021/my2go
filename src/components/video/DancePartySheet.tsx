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
import { useLiveKitRoom, Participant } from '@/hooks/useLiveKitRoom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface DancePartySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  songIdentifier: string;
  songTitle?: string;
}

const VideoTile = ({ 
  participant, 
  isLocal,
  stream
}: { 
  participant: Participant;
  isLocal: boolean;
  stream?: MediaStream | null;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

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
        isLocal && "ring-2 ring-primary"
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
          className="w-full h-full object-cover"
        />
      )}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full truncate max-w-[70%]">
          {isLocal ? 'Du' : participant.name}
        </span>
        {participant.isMuted && (
          <span className="bg-red-500/80 p-1 rounded-full">
            <MicOff className="h-3 w-3 text-white" />
          </span>
        )}
      </div>

      {/* Dancing animation overlay */}
      {!participant.isVideoOff && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(var(--primary), 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(var(--primary), 0.1) 0%, transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(var(--primary), 0.1) 0%, transparent 50%)'
            ]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
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
    connect,
    disconnect,
    toggleMute,
    toggleVideo,
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
        .catch(console.error);
    }

    return () => {
      if (localStream && !isConnected) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [open, isConnected, isConnecting]);

  const handleJoin = async () => {
    await connect(roomName);
  };

  const handleLeave = () => {
    disconnect();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  const handleClose = () => {
    if (isConnected) {
      handleLeave();
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

        <div className="flex flex-col h-[calc(100%-5rem)]">
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
                >
                  <Sparkles className="h-4 w-4" />
                  Party beitreten
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
                    <VideoTile
                      key="local"
                      participant={{
                        ...localParticipant,
                        isMuted,
                        isVideoOff
                      }}
                      isLocal
                      stream={localStream}
                    />
                  )}

                  {/* Remote participants */}
                  {participants.map((p) => (
                    <VideoTile
                      key={p.identity}
                      participant={p}
                      isLocal={false}
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
