import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  Room, 
  RoomEvent, 
  RemoteParticipant, 
  LocalParticipant,
  Track,
  RemoteTrackPublication,
  LocalTrackPublication,
  ConnectionState,
  DataPacket_Kind
} from 'livekit-client';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export type ParticipantRole = 'host' | 'spectator' | 'standard';

export interface Participant {
  identity: string;
  name: string;
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeaking: boolean;
  role?: ParticipantRole;
}

export interface Reaction {
  id: string;
  emoji: string;
  participantId: string;
  participantName: string;
  timestamp: number;
}

export interface ApplauseEvent {
  id: string;
  participantId: string;
  participantName: string;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: number;
  type: 'message' | 'join' | 'reaction';
}

export interface UseLiveKitRoomReturn {
  isConnected: boolean;
  isConnecting: boolean;
  participants: Participant[];
  localParticipant: Participant | null;
  error: string | null;
  room: Room | null;
  connect: (roomName: string, role?: ParticipantRole) => Promise<void>;
  disconnect: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  sendReaction: (emoji: string) => void;
  sendApplause: () => void;
  sendChatMessage: (message: string) => void;
  reactions: Reaction[];
  applauseEvents: ApplauseEvent[];
  chatMessages: ChatMessage[];
  isMuted: boolean;
  isVideoOff: boolean;
  localRole: ParticipantRole;
  hosts: Participant[];
  spectatorCount: number;
}

const REACTION_EMOJIS = ['🔥', '💃', '🕺', '👏', '❤️', '🎉', '😍', '🙌'];

export const useLiveKitRoom = (): UseLiveKitRoomReturn => {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [localParticipant, setLocalParticipant] = useState<Participant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [applauseEvents, setApplauseEvents] = useState<ApplauseEvent[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [localRole, setLocalRole] = useState<ParticipantRole>('standard');

  const roomRef = useRef<Room | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  // Auto-remove reactions after 3 seconds
  useEffect(() => {
    if (reactions.length > 0) {
      const timer = setTimeout(() => {
        setReactions(prev => prev.filter(r => Date.now() - r.timestamp < 3000));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [reactions]);

  // Auto-remove applause events after 4 seconds
  useEffect(() => {
    if (applauseEvents.length > 0) {
      const timer = setTimeout(() => {
        setApplauseEvents(prev => prev.filter(a => Date.now() - a.timestamp < 4000));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [applauseEvents]);

  // Compute hosts and spectator count
  const hosts = participants.filter(p => p.role === 'host' || !p.role);
  const spectatorCount = participants.filter(p => p.role === 'spectator').length + 
                         (localRole === 'spectator' ? 1 : 0);

  const getToken = async (roomName: string): Promise<{ token: string; url: string; participantName: string } | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await supabase.functions.invoke('livekit-token', {
        body: { roomName }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data;
    } catch (err) {
      console.error('[useLiveKitRoom] Token error:', err);
      setError('Konnte Token nicht abrufen');
      return null;
    }
  };

  const updateParticipants = useCallback((room: Room) => {
    const remoteParticipants: Participant[] = [];
    
    room.remoteParticipants.forEach((p: RemoteParticipant) => {
      const audioTrack = p.getTrackPublication(Track.Source.Microphone);
      const videoTrack = p.getTrackPublication(Track.Source.Camera);
      
      // Determine role from metadata if available
      let role: ParticipantRole = 'standard';
      try {
        const metadata = p.metadata ? JSON.parse(p.metadata) : {};
        role = metadata.role || 'standard';
      } catch (e) {
        // Ignore parse errors
      }
      
      remoteParticipants.push({
        identity: p.identity,
        name: p.name || p.identity,
        isMuted: audioTrack?.isMuted ?? true,
        isVideoOff: !videoTrack?.isSubscribed || videoTrack?.isMuted,
        isSpeaking: p.isSpeaking,
        role
      });
    });

    setParticipants(remoteParticipants);
  }, []);

  const connect = useCallback(async (roomName: string, role: ParticipantRole = 'standard') => {
    if (!user) {
      toast.error('Bitte zuerst einloggen');
      return;
    }

    setIsConnecting(true);
    setError(null);
    setLocalRole(role);

    try {
      console.log('[useLiveKitRoom] Connecting to room:', roomName, 'as', role);

      // Get token
      const tokenData = await getToken(roomName);
      if (!tokenData) {
        setIsConnecting(false);
        return;
      }

      console.log('[useLiveKitRoom] Token received, connecting to:', tokenData.url);

      // Create room
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 640, height: 480, frameRate: 24 }
        },
        audioCaptureDefaults: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      roomRef.current = newRoom;
      setRoom(newRoom);

      // Set up event listeners
      newRoom.on(RoomEvent.Connected, async () => {
        console.log('[useLiveKitRoom] Connected to room');
        setIsConnected(true);
        setIsConnecting(false);
        
        // Set metadata for role
        try {
          await newRoom.localParticipant.setMetadata(JSON.stringify({ role }));
        } catch (e) {
          console.warn('[useLiveKitRoom] Could not set metadata:', e);
        }
        
        // Set local participant
        const local = newRoom.localParticipant;
        setLocalParticipant({
          identity: local.identity,
          name: local.name || tokenData.participantName,
          isMuted: role === 'spectator',
          isVideoOff: role === 'spectator',
          isSpeaking: false,
          role
        });

        // Add join message to chat
        setChatMessages(prev => [...prev, {
          id: `${Date.now()}-join`,
          userId: user.id,
          userName: tokenData.participantName,
          message: '',
          timestamp: Date.now(),
          type: 'join'
        }]);

        const roleText = role === 'host' ? 'als Host' : role === 'spectator' ? 'als Zuschauer' : '';
        toast.success(`Dance Party beigetreten ${roleText}! 🕺💃`);
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        console.log('[useLiveKitRoom] Disconnected from room');
        setIsConnected(false);
        setParticipants([]);
        setLocalParticipant(null);
        setChatMessages([]);
      });

      newRoom.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        console.log('[useLiveKitRoom] Participant joined:', participant.identity);
        toast.success(`${participant.name || 'Someone'} ist beigetreten! 🎉`);
        updateParticipants(newRoom);
        
        // Add to chat
        setChatMessages(prev => [...prev, {
          id: `${Date.now()}-join-${participant.identity}`,
          userId: participant.identity,
          userName: participant.name || 'Someone',
          message: '',
          timestamp: Date.now(),
          type: 'join'
        }]);
      });

      newRoom.on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        console.log('[useLiveKitRoom] Participant left:', participant.identity);
        toast.info(`${participant.name || 'Someone'} hat den Raum verlassen`);
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackSubscribed, () => {
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, () => {
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackMuted, () => {
        updateParticipants(newRoom);
      });

      newRoom.on(RoomEvent.TrackUnmuted, () => {
        updateParticipants(newRoom);
      });

      // Listen for local track published to trigger re-render
      newRoom.on(RoomEvent.LocalTrackPublished, () => {
        console.log('[useLiveKitRoom] Local track published');
        // Force update local participant to trigger re-render
        const local = newRoom.localParticipant;
        setLocalParticipant(prev => prev ? {
          ...prev,
          isMuted: !local.isMicrophoneEnabled,
          isVideoOff: !local.isCameraEnabled
        } : null);
      });

      newRoom.on(RoomEvent.ActiveSpeakersChanged, () => {
        updateParticipants(newRoom);
      });

      // Handle incoming data (reactions, applause, and chat)
      newRoom.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        try {
          const decoder = new TextDecoder();
          const data = JSON.parse(decoder.decode(payload));
          
          if (data.type === 'reaction') {
            setReactions(prev => [...prev, {
              id: `${Date.now()}-${Math.random()}`,
              emoji: data.emoji,
              participantId: participant?.identity || 'unknown',
              participantName: participant?.name || 'Someone',
              timestamp: Date.now()
            }]);
          } else if (data.type === 'applause') {
            setApplauseEvents(prev => [...prev, {
              id: `${Date.now()}-${Math.random()}`,
              participantId: participant?.identity || 'unknown',
              participantName: participant?.name || 'Someone',
              timestamp: Date.now()
            }]);
          } else if (data.type === 'chat') {
            setChatMessages(prev => [...prev, {
              id: `${Date.now()}-${Math.random()}`,
              userId: participant?.identity || 'unknown',
              userName: participant?.name || 'Someone',
              message: data.message,
              timestamp: Date.now(),
              type: 'message'
            }]);
          }
        } catch (e) {
          console.error('[useLiveKitRoom] Error parsing data:', e);
        }
      });

      newRoom.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
        console.log('[useLiveKitRoom] Connection state:', state);
        if (state === ConnectionState.Reconnecting) {
          toast.info('Verbindung wird wiederhergestellt...');
        }
      });

      // Connect to room
      await newRoom.connect(tokenData.url, tokenData.token);
      
      // Enable camera and microphone only if not spectator
      if (role !== 'spectator') {
        await newRoom.localParticipant.enableCameraAndMicrophone();
        console.log('[useLiveKitRoom] Camera and microphone enabled');
      } else {
        // Spectators don't publish video/audio
        console.log('[useLiveKitRoom] Joined as spectator (no media)');
        setIsMuted(true);
        setIsVideoOff(true);
      }

    } catch (err) {
      console.error('[useLiveKitRoom] Connect error:', err);
      setError('Verbindung fehlgeschlagen. Bitte Kamera/Mikrofon erlauben.');
      setIsConnecting(false);
      toast.error('Verbindung fehlgeschlagen');
    }
  }, [user, updateParticipants]);

  const disconnect = useCallback(() => {
    console.log('[useLiveKitRoom] Disconnecting');

    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }

    setRoom(null);
    setIsConnected(false);
    setParticipants([]);
    setLocalParticipant(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setReactions([]);
    setApplauseEvents([]);
    setChatMessages([]);
    setLocalRole('standard');
  }, []);

  const toggleMute = useCallback(async () => {
    if (roomRef.current && localRole !== 'spectator') {
      const local = roomRef.current.localParticipant;
      const newMuteState = !isMuted;
      
      await local.setMicrophoneEnabled(!newMuteState);
      setIsMuted(newMuteState);
    }
  }, [isMuted, localRole]);

  const toggleVideo = useCallback(async () => {
    if (roomRef.current && localRole !== 'spectator') {
      const local = roomRef.current.localParticipant;
      const newVideoOffState = !isVideoOff;
      
      await local.setCameraEnabled(!newVideoOffState);
      setIsVideoOff(newVideoOffState);
    }
  }, [isVideoOff, localRole]);

  const sendReaction = useCallback((emoji: string) => {
    if (roomRef.current && isConnected) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ type: 'reaction', emoji }));
      
      roomRef.current.localParticipant.publishData(data, { reliable: true });
      
      // Also show locally
      setReactions(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        emoji,
        participantId: user?.id || 'local',
        participantName: 'Du',
        timestamp: Date.now()
      }]);
    }
  }, [isConnected, user]);

  const sendApplause = useCallback(() => {
    if (roomRef.current && isConnected) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ type: 'applause' }));
      
      roomRef.current.localParticipant.publishData(data, { reliable: true });
      
      // Also trigger locally
      setApplauseEvents(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        participantId: user?.id || 'local',
        participantName: 'Du',
        timestamp: Date.now()
      }]);
    }
  }, [isConnected, user]);

  const sendChatMessage = useCallback((message: string) => {
    if (roomRef.current && isConnected && message.trim()) {
      const encoder = new TextEncoder();
      const data = encoder.encode(JSON.stringify({ type: 'chat', message: message.trim() }));
      
      roomRef.current.localParticipant.publishData(data, { reliable: true });
      
      // Also show locally
      setChatMessages(prev => [...prev, {
        id: `${Date.now()}-${Math.random()}`,
        userId: user?.id || 'local',
        userName: 'Du',
        message: message.trim(),
        timestamp: Date.now(),
        type: 'message'
      }]);
    }
  }, [isConnected, user]);

  return {
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
  };
};

export { REACTION_EMOJIS };
