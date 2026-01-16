import { useState, useRef, useEffect, useCallback } from 'react';
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
  Music,
  Share2,
  Check,
  Palette,
  ImageIcon,
  Radio,
  Crown,
  Film,
  Gift,
  Mic2
} from 'lucide-react';
import { useLiveKitRoom, Participant, REACTION_EMOJIS, ParticipantRole } from '@/hooks/useLiveKitRoom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Track, Room } from 'livekit-client';
import { 
  CameraFilterOverlay, 
  FilterSelector, 
  getVideoFilter, 
  CameraFilterType,
  CAMERA_FILTERS 
} from './CameraFilters';
import { Confetti } from '@/components/ui/confetti';
import { 
  BackgroundSelector, 
  BackgroundOverlay, 
  VirtualBackgroundType,
  VIRTUAL_BACKGROUNDS 
} from './VirtualBackgrounds';
import { 
  GroupPhotoButton, 
  GroupPhotoSheet, 
  useGroupPhoto 
} from './GroupPhoto';
import { MicrophoneVisualizer, RadioMusicVisualizer } from './AudioVisualizer';
import { RealtimeBackgroundProcessor } from '@/lib/background-removal';
import { useRadioStore } from '@/lib/radio-store';
import { 
  PartyModeSelector, 
  PartyMode, 
  PARTY_MODES, 
  RoleSelector, 
  StageRole 
} from './DancePartyModes';
import { LiveStageView } from './LiveStageView';
import { DuetRecorder } from './DuetRecorder';
import { AudioEffectsPanel } from './AudioEffectsPanel';
import { AudioEffectType } from '@/lib/audio-effects';
import { GiftPanel, GiftButton, FloatingGift } from './GiftPanel';
import { VIRTUAL_GIFTS, useGiftStore, SentGift } from '@/lib/gifts-store';
import { KaraokeButton, KaraokeOverlay } from './KaraokeDisplay';
import { useLyricsStore } from '@/lib/lyrics-store';

// Applause sound generator
const playApplauseSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;
    
    // Create applause-like sound with multiple noise bursts
    for (let i = 0; i < 8; i++) {
      const bufferSize = audioContext.sampleRate * 0.15;
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      for (let j = 0; j < bufferSize; j++) {
        output[j] = (Math.random() * 2 - 1) * 0.3;
      }
      
      const noise = audioContext.createBufferSource();
      noise.buffer = noiseBuffer;
      
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800 + Math.random() * 400;
      filter.Q.value = 0.5;
      
      const gainNode = audioContext.createGain();
      const startTime = now + i * 0.08 + Math.random() * 0.05;
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.15 + Math.random() * 0.1, startTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);
      
      noise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      noise.start(startTime);
      noise.stop(startTime + 0.15);
    }
    
    // Add a cheerful "ding" at the end
    const playTone = (freq: number, time: number, dur: number, vol: number) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, time);
      gain.gain.linearRampToValueAtTime(vol, time + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);
      osc.start(time);
      osc.stop(time + dur);
    };
    
    playTone(880, now + 0.6, 0.3, 0.1);
    playTone(1108, now + 0.7, 0.3, 0.08);
    playTone(1318, now + 0.8, 0.4, 0.1);
    
  } catch (error) {
    console.log('Audio not supported');
  }
};

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

// Video tile using LiveKit components with real-time AI background
const LiveKitVideoTile = ({ 
  participant, 
  isLocal,
  room,
  filter = 'none',
  background = 'none'
}: { 
  participant: Participant;
  isLocal: boolean;
  room: Room | null;
  filter?: CameraFilterType;
  background?: VirtualBackgroundType;
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processorRef = useRef<RealtimeBackgroundProcessor | null>(null);
  const [isAIProcessing, setIsAIProcessing] = useState(false);
  const [aiReady, setAiReady] = useState(false);

  // Initialize AI processor when ai-remove background is selected
  useEffect(() => {
    if (background === 'ai-remove' && isLocal && !processorRef.current) {
      const initProcessor = async () => {
        setIsAIProcessing(true);
        processorRef.current = new RealtimeBackgroundProcessor();
        const success = await processorRef.current.initialize();
        setAiReady(success);
        setIsAIProcessing(false);
        
        if (success) {
          toast.success('AI Hintergrund-Entfernung aktiviert! ✨');
        } else {
          toast.error('AI Hintergrund konnte nicht initialisiert werden');
        }
      };
      initProcessor();
    }

    return () => {
      if (processorRef.current) {
        processorRef.current.destroy();
        processorRef.current = null;
      }
    };
  }, [background, isLocal]);

  // Start/stop AI processing based on background selection
  useEffect(() => {
    if (background === 'ai-remove' && isLocal && aiReady && videoRef.current && canvasRef.current && processorRef.current) {
      // Get virtual background gradient based on selected theme
      const bgGradient = '#1a1a2e'; // Default dark background when AI removes
      processorRef.current.startProcessing(videoRef.current, bgGradient, canvasRef.current, 12);
    } else if (processorRef.current) {
      processorRef.current.stopProcessing();
    }

    return () => {
      if (processorRef.current) {
        processorRef.current.stopProcessing();
      }
    };
  }, [background, isLocal, aiReady]);

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

  const showAICanvas = background === 'ai-remove' && isLocal && aiReady;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "aspect-[3/4] flex items-center justify-center",
        isLocal && "ring-2 ring-primary",
        participant.isSpeaking && "ring-2 ring-green-500 ring-offset-2"
      )}
    >
      {/* Virtual background (non-AI) */}
      {background !== 'ai-remove' && <BackgroundOverlay background={background} />}
      
      {/* AI Processing indicator */}
      {isAIProcessing && isLocal && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent mx-auto mb-2"
            />
            <span className="text-xs text-white">AI lädt...</span>
          </div>
        </div>
      )}

      {participant.isVideoOff ? (
        <div className="flex flex-col items-center gap-2 z-10">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/30 text-primary text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm text-muted-foreground">{participant.name}</span>
          {/* Still show background when video is off */}
          {background === 'none' && (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 -z-10" />
          )}
        </div>
      ) : (
        <>
          {/* Original video (hidden when AI is processing) */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal}
            className={cn(
              "w-full h-full object-cover",
              showAICanvas ? "hidden" : "z-10"
            )}
            style={{ 
              transform: isLocal ? 'scaleX(-1)' : 'none',
              filter: getVideoFilter(filter),
              mixBlendMode: background !== 'none' && background !== 'ai-remove' ? 'normal' : undefined
            }}
          />
          
          {/* AI-processed canvas output */}
          {showAICanvas && (
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover z-10"
              style={{ 
                transform: isLocal ? 'scaleX(-1)' : 'none',
                filter: getVideoFilter(filter)
              }}
            />
          )}
          
          {/* Camera filter overlay */}
          <CameraFilterOverlay filter={filter} />
        </>
      )}

      {/* Audio element for remote participants */}
      {!isLocal && <audio ref={audioRef} autoPlay />}

      {/* Name badge */}
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-20">
        <span className="bg-black/60 text-white text-xs px-2 py-1 rounded-full truncate max-w-[70%]">
          {isLocal ? 'Du' : participant.name}
          {showAICanvas && ' ✨'}
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
  const authContext = useAuth();
  const user = authContext?.user;
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
    sendApplause,
    sendChatMessage,
    reactions,
    applauseEvents,
    chatMessages,
    isMuted,
    isVideoOff,
    localRole,
    hosts,
    spectatorCount
  } = useLiveKitRoom();

  // Party mode state
  const [partyMode, setPartyMode] = useState<PartyMode>('standard');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showDuetRecorder, setShowDuetRecorder] = useState(false);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [currentFilter, setCurrentFilter] = useState<CameraFilterType>('none');
  const [currentBackground, setCurrentBackground] = useState<VirtualBackgroundType>('none');
  const [showFilters, setShowFilters] = useState(false);
  const [showBackgrounds, setShowBackgrounds] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showRadioVisualizer, setShowRadioVisualizer] = useState(true);
  const [visualizerVariant, setVisualizerVariant] = useState<'bars' | 'wave' | 'pulse'>('bars');
  const videoGridRef = useRef<HTMLDivElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  
  // Audio effects state (for hosts)
  const [currentAudioEffect, setCurrentAudioEffect] = useState<AudioEffectType>('none');
  const [showAudioEffects, setShowAudioEffects] = useState(false);
  
  // Gift system state
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [giftTargetHost, setGiftTargetHost] = useState<Participant | null>(null);
  const { recentGifts, clearOldGifts, addReceivedGift } = useGiftStore();
  
  const isRadioPlaying = useRadioStore((state) => state.isPlaying);
  const nowPlaying = useRadioStore((state) => state.nowPlaying);
  const currentBalance = authContext?.balance?.taler_balance ?? 0;
  
  // Karaoke state
  const [isKaraokeActive, setIsKaraokeActive] = useState(false);
  const { fetchLyrics, currentLyrics, clearLyrics } = useLyricsStore();
  // Clear old gifts periodically
  useEffect(() => {
    const interval = setInterval(clearOldGifts, 1000);
    return () => clearInterval(interval);
  }, [clearOldGifts]);

  // Group photo hook
  const { 
    isCapturing, 
    photoDataUrl, 
    showPhotoSheet, 
    setShowPhotoSheet, 
    capturePhoto 
  } = useGroupPhoto(videoGridRef);

  // Create room name from song
  const roomName = `dance-${songIdentifier.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}`;

  // Handle incoming applause events
  useEffect(() => {
    if (applauseEvents.length > 0) {
      const latestEvent = applauseEvents[applauseEvents.length - 1];
      // Check if this is a new event (within last 500ms)
      if (Date.now() - latestEvent.timestamp < 500) {
        playApplauseSound();
        setShowConfetti(true);
        // Reset confetti after animation
        setTimeout(() => setShowConfetti(false), 100);
      }
    }
  }, [applauseEvents]);

  const handleApplause = useCallback(() => {
    sendApplause();
    // Local effect is handled by the applauseEvents useEffect
  }, [sendApplause]);

  // Get local stream for preview - only once when sheet opens
  useEffect(() => {
    let mounted = true;
    
    if (open && !isConnected && !isConnecting && !localStream) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          if (mounted) {
            setLocalStream(stream);
          } else {
            // Component unmounted, stop the stream
            stream.getTracks().forEach(track => track.stop());
          }
        })
        .catch((err) => {
          console.error('Media access error:', err);
        });
    }

    return () => {
      mounted = false;
    };
  }, [open, isConnected, isConnecting, localStream]);
  
  // Cleanup stream when sheet closes or connects
  useEffect(() => {
    if ((!open || isConnected) && localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  }, [open, isConnected, localStream]);
  
  // Attach stream to video element when available
  useEffect(() => {
    if (previewVideoRef.current && localStream) {
      previewVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const handleJoin = async (role?: ParticipantRole) => {
    // Stop preview stream before connecting
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    
    // For live-stage mode, we need to know the role
    const connectRole = partyMode === 'live-stage' ? (role || 'spectator') : 
                        partyMode === 'duet' ? 'host' : 'standard';
    
    await connect(roomName, connectRole);
    setShowRoleSelector(false);
  };

  const handleModeChange = (mode: PartyMode) => {
    setPartyMode(mode);
    // Reset role selector when mode changes
    setShowRoleSelector(false);
    setShowDuetRecorder(false);
  };

  const handleJoinClick = () => {
    if (partyMode === 'live-stage') {
      // Show role selector for live stage
      setShowRoleSelector(true);
    } else {
      handleJoin();
    }
  };

  const handleRoleSelect = (role: StageRole) => {
    handleJoin(role);
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

  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/?dance=${encodeURIComponent(roomName)}`;
  };

  const handleShare = async () => {
    const shareUrl = getShareUrl();
    const shareData = {
      title: '🕺 Dance Party Einladung!',
      text: songTitle 
        ? `Komm zur Dance Party! Wir tanzen gerade zu "${songTitle}" 💃🎵`
        : 'Komm zur Dance Party und tanz mit uns! 💃🕺',
      url: shareUrl
    };

    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast.success('Einladung geteilt! 🎉');
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link kopiert! 📋');
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        // User cancelled share, not an error
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Link kopiert! 📋');
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const totalParticipants = (isConnected ? 1 : 0) + participants.length;

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent 
        side="bottom" 
        className="h-[90vh] rounded-t-3xl bg-gradient-to-b from-background to-background/95 z-[250]"
      >
        {/* Confetti overlay for applause */}
        <Confetti isActive={showConfetti} particleCount={80} duration={3000} playSound={false} />
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
          
          {/* Radio Music Visualizer */}
          {isConnected && isRadioPlaying && showRadioVisualizer && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2"
            >
              <RadioMusicVisualizer 
                isActive={isRadioPlaying} 
                variant={visualizerVariant}
                className="h-12 w-full max-w-[280px] mx-auto" 
                barCount={24}
              />
            </motion.div>
          )}
          
          {/* Microphone Visualizer (fallback when radio not playing) */}
          {isConnected && !isRadioPlaying && (
            <div className="flex justify-center mt-2">
              <MicrophoneVisualizer isActive={isConnected && !isMuted} className="h-6" />
            </div>
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
                      ref={previewVideoRef}
                      autoPlay
                      playsInline
                      muted
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

                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <Button 
                    onClick={handleJoinClick}
                    size="lg"
                    className="gap-2 w-full"
                    disabled={!user}
                  >
                    <Sparkles className="h-4 w-4" />
                    {user ? 'Party beitreten' : 'Bitte einloggen'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 w-full"
                    onClick={handleShare}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Share2 className="h-4 w-4" />
                    )}
                    Freunde einladen
                  </Button>
                </div>
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
              <div ref={videoGridRef} className="grid grid-cols-2 gap-3 p-2">
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
                      filter={currentFilter}
                      background={currentBackground}
                    />
                  )}

                  {/* Remote participants */}
                  {participants.map((p) => (
                    <LiveKitVideoTile
                      key={p.identity}
                      participant={p}
                      isLocal={false}
                      room={room}
                      filter={currentFilter}
                      background={currentBackground}
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
                
                {/* Karaoke Overlay */}
                <KaraokeOverlay isActive={isKaraokeActive && isConnected} />
              </div>
            )}
          </div>

          {/* Filter & Background Selector */}
          {isConnected && (
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t"
                >
                  <FilterSelector 
                    currentFilter={currentFilter} 
                    onFilterChange={(filter) => {
                      setCurrentFilter(filter);
                      toast.success(`${CAMERA_FILTERS[filter].emoji} ${CAMERA_FILTERS[filter].name} Filter aktiviert`);
                    }} 
                  />
                </motion.div>
              )}
              {showBackgrounds && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t"
                >
                  <BackgroundSelector 
                    currentBackground={currentBackground} 
                    onBackgroundChange={(bg) => {
                      setCurrentBackground(bg);
                      toast.success(`${VIRTUAL_BACKGROUNDS[bg].emoji} ${VIRTUAL_BACKGROUNDS[bg].name} Hintergrund`);
                      setShowBackgrounds(false);
                    }} 
                  />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Reactions Bar */}
          {isConnected && (
            <ReactionBar onReaction={sendReaction} />
          )}

          {/* Controls */}
          {isConnected && (
          <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-center gap-3 py-4 border-t"
            >
              {/* Group Photo Button */}
              <GroupPhotoButton 
                onCapture={capturePhoto} 
                isCapturing={isCapturing} 
              />

              {/* Gift Button (for spectators to send to hosts) */}
              {localRole === 'spectator' && hosts.length > 0 && (
                <GiftButton 
                  onClick={() => {
                    setGiftTargetHost(hosts[0]); // Default to first host
                    setShowGiftPanel(true);
                  }}
                  hasGifts={recentGifts.length > 0}
                />
              )}

              {/* Audio Effects Button (for hosts only) */}
              {(localRole === 'host' || localRole === 'standard') && (
                <AudioEffectsPanel
                  currentEffect={currentAudioEffect}
                  onEffectChange={setCurrentAudioEffect}
                  isCompact
                  isDisabled={!isConnected}
                />
              )}

              {/* Karaoke Button */}
              <KaraokeButton
                isActive={isKaraokeActive}
                onToggle={() => {
                  const newActive = !isKaraokeActive;
                  setIsKaraokeActive(newActive);
                  if (newActive && nowPlaying) {
                    fetchLyrics(nowPlaying.title, nowPlaying.artist);
                  } else if (!newActive) {
                    clearLyrics();
                  }
                }}
                hasLyrics={!!currentLyrics}
              />

              {/* Applause Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full border-yellow-500/50 hover:bg-yellow-500/10 hover:border-yellow-500"
                onClick={handleApplause}
              >
                <span className="text-xl">👏</span>
              </Button>

              {/* Radio Visualizer Toggle */}
              {isRadioPlaying && (
                <Button
                  variant={showRadioVisualizer ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-12 w-12 rounded-full",
                    showRadioVisualizer ? "bg-gradient-to-r from-pink-500 to-purple-500" : "border-pink-500/50 hover:bg-pink-500/10"
                  )}
                  onClick={() => {
                    if (showRadioVisualizer) {
                      // Cycle through variants
                      const variants: ('bars' | 'wave' | 'pulse')[] = ['bars', 'wave', 'pulse'];
                      const currentIdx = variants.indexOf(visualizerVariant);
                      const nextVariant = variants[(currentIdx + 1) % variants.length];
                      setVisualizerVariant(nextVariant);
                      toast.success(`Visualizer: ${nextVariant === 'bars' ? 'Balken' : nextVariant === 'wave' ? 'Welle' : 'Puls'} 🎵`);
                    } else {
                      setShowRadioVisualizer(true);
                    }
                  }}
                  onDoubleClick={() => setShowRadioVisualizer(!showRadioVisualizer)}
                >
                  <Radio className={cn("h-5 w-5", showRadioVisualizer ? "text-white" : "text-pink-500")} />
                </Button>
              )}

              {/* Background Button */}
              <Button
                variant={showBackgrounds ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full",
                  showBackgrounds ? "" : "border-purple-500/50 hover:bg-purple-500/10"
                )}
                onClick={() => {
                  setShowBackgrounds(!showBackgrounds);
                  setShowFilters(false);
                }}
              >
                <ImageIcon className={cn("h-5 w-5", showBackgrounds ? "" : "text-purple-500")} />
              </Button>

              {/* Filter Button */}
              <Button
                variant={showFilters ? "default" : "outline"}
                size="icon"
                className={cn(
                  "h-12 w-12 rounded-full",
                  showFilters ? "" : "border-primary/50 hover:bg-primary/10"
                )}
                onClick={() => {
                  setShowFilters(!showFilters);
                  setShowBackgrounds(false);
                }}
              >
                <Palette className={cn("h-5 w-5", showFilters ? "" : "text-primary")} />
              </Button>

              {/* Share/Invite Button */}

              {/* Share/Invite Button */}
              <Button
                variant="outline"
                size="icon"
                className="h-12 w-12 rounded-full border-primary/50 hover:bg-primary/10"
                onClick={handleShare}
              >
                {copied ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Share2 className="h-5 w-5 text-primary" />
                )}
              </Button>

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

      {/* Group Photo Sheet */}
      <GroupPhotoSheet
        open={showPhotoSheet}
        onOpenChange={setShowPhotoSheet}
        photoDataUrl={photoDataUrl}
        songTitle={songTitle}
        participantCount={totalParticipants}
      />

      {/* Gift Panel */}
      {giftTargetHost && user && (
        <GiftPanel
          isOpen={showGiftPanel}
          onClose={() => setShowGiftPanel(false)}
          recipientId={giftTargetHost.identity}
          recipientName={giftTargetHost.name}
          senderId={user.id}
          senderName={user.user_metadata?.display_name || 'User'}
          currentBalance={currentBalance}
          onGiftSent={(gift) => {
            toast.success(`${gift.emoji} gesendet!`);
          }}
        />
      )}

      {/* Floating gifts animation */}
      <AnimatePresence>
        {recentGifts.map((gift) => {
          const giftInfo = VIRTUAL_GIFTS.find(g => g.id === gift.giftId);
          if (!giftInfo) return null;
          return (
            <FloatingGift key={gift.id} gift={gift} giftInfo={giftInfo} />
          );
        })}
      </AnimatePresence>
    </Sheet>
  );
};
